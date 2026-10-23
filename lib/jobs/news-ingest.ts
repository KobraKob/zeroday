import fs from "fs";
import path from "path";
import crypto from "crypto";
import { politeFetch } from "./http-client";
import { extractClaimsFromDocument } from "../ai/claim-extractor";
import { getDb, schema } from "../db/client";
import { reviewsRepo } from "../repo/reviewsRepo";

interface FeedConfig {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
}

export async function runNewsIngest() {
  const feedsPath = path.resolve(process.cwd(), "data/feeds.json");
  if (!fs.existsSync(feedsPath)) {
    throw new Error("data/feeds.json not found");
  }

  const feeds: FeedConfig[] = JSON.parse(fs.readFileSync(feedsPath, "utf-8"));
  const activeFeeds = feeds.filter((f) => f.enabled);

  let totalItemsChecked = 0;
  let newArticlesFetched = 0;
  let claimsProposed = 0;

  const database = getDb();
  const processedUrlHashes = new Set<string>();

  for (const feed of activeFeeds) {
    console.log(`📡 Fetching feed: ${feed.name} (${feed.url})`);

    const feedRes = await politeFetch(feed.url, { timeoutMs: 10000 });
    if (!feedRes.ok || !feedRes.content) {
      console.warn(`Could not fetch feed ${feed.name}: ${feedRes.error || feedRes.statusText}`);
      continue;
    }

    // Basic XML/RSS item extraction
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(feedRes.content)) !== null) {
      totalItemsChecked++;
      const itemBlock = itemMatch[1];

      const titleMatch = itemBlock.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i);
      const title = (titleMatch ? titleMatch[1] || titleMatch[2] : "Untitled").trim();

      const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/i);
      const link = linkMatch ? linkMatch[1].trim() : "";

      const descMatch = itemBlock.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i);
      const desc = (descMatch ? descMatch[1] || descMatch[2] : "").replace(/<[^>]*>/g, " ").trim();

      if (!link) continue;

      // URL Hash Deduplication
      const urlHash = crypto.createHash("sha256").update(link).digest("hex");
      if (processedUrlHashes.has(urlHash)) continue;
      processedUrlHashes.add(urlHash);

      // In production or testing, analyze article description & text
      const articleText = `${title}. ${desc}`;
      if (articleText.length < 30) continue;

      newArticlesFetched++;

      // Run verbatim AI claim extractor
      const sourceId = `src-news-${urlHash.slice(0, 12)}`;
      const { accepted, rejected } = extractClaimsFromDocument(sourceId, articleText, "gpt-4o-mini");

      // Log AI extraction execution
      if (database) {
        try {
          await database.insert(schema.aiLog).values({
            id: `ailog-${Date.now()}-${urlHash.slice(0, 8)}`,
            timestamp: new Date(),
            input_hash: urlHash,
            model: "gpt-4o-mini",
            source_id: sourceId,
            accepted_count: accepted.length,
            rejected_count: rejected.length,
            details: { title, link },
          });
        } catch {
          // ignore
        }
      }

      for (const proposal of accepted) {
        claimsProposed++;

        // Add to review queue in repo
        reviewsRepo.addPendingClaim({
          id: `rev-${proposal.claim.id}`,
          claim: {
            ...proposal.claim,
            status: "pending_review",
            source_id: sourceId,
          },
          exact_quote: proposal.exact_quote,
          source_context: title,
          source_url: link,
          extracted_at: new Date().toISOString(),
          model: "gpt-4o-mini",
          status: "pending",
        });

        // Insert pending claim in Postgres if DB available
        if (database) {
          try {
            await database.insert(schema.claims).values({
              id: proposal.claim.id,
              subject_type: proposal.claim.subject_type,
              subject_id: proposal.claim.subject_id,
              field: proposal.claim.field,
              value: proposal.claim.value,
              unit: proposal.claim.unit || null,
              as_of: proposal.claim.as_of,
              source_id: sourceId,
              confidence: "C", // AI extracted claims capped at C
              status: "pending", // pending human review
              valid_from: new Date(),
              valid_to: null,
              last_checked_at: new Date(),
              created_by: "ai",
              exact_quote: proposal.exact_quote,
              note: `Extracted from RSS: ${title}`,
            }).onConflictDoNothing();
          } catch {
            // ignore
          }
        }
      }
    }
  }

  return {
    feedsProcessed: activeFeeds.length,
    totalItemsChecked,
    newArticlesFetched,
    claimsProposed,
  };
}
