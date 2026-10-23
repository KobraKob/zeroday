import fs from "fs";
import path from "path";
import crypto from "crypto";
import { politeFetch } from "./http-client";
import { getDb, schema } from "../db/client";
import { eventsRepo } from "../repo/eventsRepo";
import { reviewsRepo } from "../repo/reviewsRepo";
import { extractClaimsFromDocument } from "../ai/claim-extractor";

interface PolicyConfig {
  id: string;
  state_id: string;
  state_name: string;
  policy_name: string;
  url: string;
  publisher: string;
  enabled: boolean;
}

// In-memory snapshot cache for fast diffs and local operation
const localSnapshotHashes = new Map<string, string>();

export async function runPolicyMonitor(mockUrlMap?: Record<string, string>) {
  const configPath = path.resolve(process.cwd(), "data/policy-sources.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("data/policy-sources.json not found");
  }

  const policies: PolicyConfig[] = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const activePolicies = policies.filter(
    (p) => p.enabled && (!mockUrlMap || mockUrlMap[p.url] !== undefined)
  );

  const database = getDb();
  let checkedCount = 0;
  let changesDetected = 0;
  let eventsCreated = 0;

  for (const policy of activePolicies) {
    checkedCount++;
    console.log(`🏛️ Checking policy: ${policy.state_name} - ${policy.policy_name}`);

    let content = "";
    let contentHash = "";

    if (mockUrlMap && mockUrlMap[policy.url]) {
      content = mockUrlMap[policy.url];
      contentHash = crypto.createHash("sha256").update(content).digest("hex");
    } else {
      const res = await politeFetch(policy.url, { timeoutMs: 12000 });
      if (!res.ok || !res.content) {
        console.warn(`Policy check failed for ${policy.policy_name}: ${res.error || res.statusText}`);
        continue;
      }
      content = res.content;
      contentHash = res.contentHash || crypto.createHash("sha256").update(content).digest("hex");
    }

    const previousHash = localSnapshotHashes.get(policy.id);

    if (previousHash && previousHash !== contentHash) {
      changesDetected++;
      console.log(`⚠️ Policy content change detected for ${policy.state_name}! Old: ${previousHash.slice(0, 8)}, New: ${contentHash.slice(0, 8)}`);

      // 1. Create Event
      const eventSummary = `Gazetted policy text modified for ${policy.state_name} (${policy.policy_name}). Content hash shifted from ${previousHash.slice(0, 8)} to ${contentHash.slice(0, 8)}. Automatic re-extraction triggered.`;
      const createdEvent = eventsRepo.createEvent("policy_change", policy.policy_name, eventSummary);
      eventsCreated++;

      // 2. Re-extract claims as pending review
      const { accepted } = extractClaimsFromDocument(policy.id, content, "gpt-4o-mini");
      for (const proposal of accepted) {
        reviewsRepo.addPendingClaim({
          id: `rev-pol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          claim: {
            ...proposal.claim,
            subject_type: "state",
            subject_id: policy.state_id,
            status: "pending_review",
            source_id: policy.id,
          },
          exact_quote: proposal.exact_quote,
          source_context: `${policy.state_name} Gazette Policy Document Update`,
          source_url: policy.url,
          extracted_at: new Date().toISOString(),
          model: "gpt-4o-mini",
          status: "pending",
        });
      }

      // 3. Database persistence
      if (database) {
        try {
          await database.insert(schema.events).values({
            id: createdEvent.id,
            type: "policy_change",
            entity: policy.policy_name,
            summary: eventSummary,
            created_at: new Date(),
          });
        } catch {
          // ignore
        }
      }
    }

    // Save snapshot
    localSnapshotHashes.set(policy.id, contentHash);

    if (database) {
      try {
        await database.insert(schema.sourceSnapshots).values({
          id: `snp-${policy.id}-${Date.now()}`,
          source_id: policy.id,
          raw_content: content.slice(0, 100000), // preserve raw text
          content_hash: contentHash,
          fetched_at: new Date(),
          created_at: new Date(),
        });
      } catch {
        // ignore
      }
    }
  }

  return {
    policiesChecked: checkedCount,
    changesDetected,
    eventsCreated,
  };
}
