import { politeFetch } from "./http-client";
import { sourcesRepo } from "../repo/sourcesRepo";
import { claimsRepo } from "../repo/claimsRepo";
import { eventsRepo } from "../repo/eventsRepo";
import { getDb, schema } from "../db/client";
import { ConfidenceGrade } from "../confidence";

const DOWNGRADE_GRADE_MAP: Record<string, "B" | "C" | "D"> = {
  A: "B",
  B: "C",
  C: "D",
  D: "D",
};

export async function runLinkCheck(mockStatusMap?: Record<string, number>) {
  const sources = sourcesRepo.getAll();
  const database = getDb();

  let checkedSources = 0;
  let deadSources = 0;
  let claimsDowngraded = 0;

  for (const source of sources) {
    checkedSources++;
    let isDead = false;
    let statusCode = 200;

    if (mockStatusMap && mockStatusMap[source.url] !== undefined) {
      statusCode = mockStatusMap[source.url];
      isDead = statusCode === 404 || statusCode === 410 || statusCode >= 500;
    } else {
      // Respect polite fetching
      const headRes = await politeFetch(source.url, { method: "HEAD", timeoutMs: 6000 });
      statusCode = headRes.status;

      // If HEAD is not allowed (some servers return 405 Method Not Allowed), retry with GET
      if (headRes.status === 405) {
        const getRes = await politeFetch(source.url, { method: "GET", timeoutMs: 6000 });
        statusCode = getRes.status;
        isDead = !getRes.ok && (getRes.status === 404 || getRes.status === 410);
      } else {
        isDead = !headRes.ok && (headRes.status === 404 || headRes.status === 410);
      }
    }

    const nowIso = new Date().toISOString();
    const newStatus = isDead ? "dead" : "active";

    // Update source status in repository
    sourcesRepo.updateStatus(source.id, newStatus, nowIso);

    if (isDead) {
      deadSources++;
      console.log(`🚨 Dead source detected: ${source.id} (${source.url}) - Status: ${statusCode}`);

      // Find affected claims
      const allClaims = claimsRepo.getAll();
      const linkedClaims = allClaims.filter((c) => c.source_id === source.id);

      for (const claim of linkedClaims) {
        const oldConf = claim.confidence;
        const newConf = DOWNGRADE_GRADE_MAP[oldConf] || "D";

        if (oldConf !== newConf) {
          claimsDowngraded++;
          claimsRepo.updateConfidence(claim.id, newConf, `Downgraded due to dead primary source URL: ${source.url}`);
        }
      }

      // Record event
      eventsRepo.createEvent(
        "source_dead",
        source.name,
        `Primary source URL returned ${statusCode}. Status changed to dead. Downgraded ${linkedClaims.length} linked claims.`
      );
    }
  }

  return {
    checkedSources,
    deadSources,
    claimsDowngraded,
  };
}
