import { claimsRepo } from "../repo/claimsRepo";
import { sourcesRepo } from "../repo/sourcesRepo";
import { eventsRepo } from "../repo/eventsRepo";
import { getDb, schema } from "../db/client";
import { ConfidenceGrade } from "../confidence";

const GRADE_DOWNGRADE_MAP: Record<ConfidenceGrade, ConfidenceGrade> = {
  A: "B",
  B: "C",
  C: "D",
  D: "D",
};

export function calculateFreshnessConfidence(
  currentConfidence: ConfidenceGrade,
  asOf: string,
  sourceType?: string,
  referenceDate: Date = new Date()
): {
  newConfidence: ConfidenceGrade;
  reasons: string[];
} {
  let newConfidence = currentConfidence;
  const reasons: string[] = [];

  // Parse as_of (Format can be YYYY-MM-DD or YYYY-MM or YYYY)
  let asOfDate: Date;
  if (/^\d{4}$/.test(asOf)) {
    asOfDate = new Date(`${asOf}-01-01`);
  } else if (/^\d{4}-\d{2}$/.test(asOf)) {
    asOfDate = new Date(`${asOf}-01`);
  } else {
    asOfDate = new Date(asOf);
  }

  // Calculate age in months
  const diffMs = referenceDate.getTime() - asOfDate.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);

  // 1. Older than 24 months downgrades one grade
  if (diffMonths > 24) {
    const downgraded = GRADE_DOWNGRADE_MAP[newConfidence];
    if (downgraded !== newConfidence) {
      reasons.push(`Claim age (${Math.round(diffMonths)} months) exceeds 24-month staleness window (downgraded from ${newConfidence} to ${downgraded})`);
      newConfidence = downgraded;
    }
  }

  // 2. Single press source caps at C
  if (sourceType === "press") {
    if (newConfidence === "A" || newConfidence === "B") {
      reasons.push(`Sole evidence from press reporting is epistemically capped at Grade C (downgraded from ${newConfidence} to C)`);
      newConfidence = "C";
    }
  }

  return { newConfidence, reasons };
}

export async function runFreshnessAudit(referenceDate: Date = new Date()) {
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();
  const sourcesMap = new Map(sources.map((s) => [s.id, s]));

  let auditedClaims = 0;
  let downgradedCount = 0;
  const database = getDb();

  for (const claim of claims) {
    auditedClaims++;
    const source = sourcesMap.get(claim.source_id);
    const { newConfidence, reasons } = calculateFreshnessConfidence(
      claim.confidence,
      claim.as_of,
      source?.type,
      referenceDate
    );

    if (newConfidence !== claim.confidence) {
      downgradedCount++;
      const reasonSummary = reasons.join("; ");
      console.log(`⏳ Staleness downgrade for claim ${claim.id} (${claim.field}): ${claim.confidence} -> ${newConfidence}. Reason: ${reasonSummary}`);

      claimsRepo.updateConfidence(claim.id, newConfidence, reasonSummary);

      eventsRepo.createEvent(
        "staleness_downgrade",
        `${claim.subject_id} (${claim.field})`,
        `Confidence grade adjusted from ${claim.confidence} to ${newConfidence}: ${reasonSummary}`
      );

      if (database) {
        try {
          await database.insert(schema.events).values({
            id: `evt-fresh-${Date.now()}-${claim.id}`,
            type: "staleness_downgrade",
            entity: `${claim.subject_id} (${claim.field})`,
            summary: `Confidence grade adjusted from ${claim.confidence} to ${newConfidence}: ${reasonSummary}`,
            created_at: new Date(),
          });
        } catch {
          // ignore
        }
      }
    }
  }

  return {
    auditedClaims,
    downgradedCount,
  };
}
