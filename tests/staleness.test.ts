import { describe, it, expect } from "vitest";
import { calculateFreshnessConfidence } from "../lib/jobs/freshness";

describe("Claim Freshness and Staleness Audit", () => {
  const referenceDate = new Date("2026-10-23T00:00:00Z");

  it("downgrades one grade when claim is older than 24 months", () => {
    // 36 months old (2023-10 vs 2026-10)
    const resultGradeA = calculateFreshnessConfidence("A", "2023-08-01", "government", referenceDate);
    expect(resultGradeA.newConfidence).toBe("B");
    expect(resultGradeA.reasons.some((r) => r.includes("24-month staleness"))).toBe(true);

    const resultGradeB = calculateFreshnessConfidence("B", "2023-01-01", "government", referenceDate);
    expect(resultGradeB.newConfidence).toBe("C");

    const resultGradeC = calculateFreshnessConfidence("C", "2022-05-01", "government", referenceDate);
    expect(resultGradeC.newConfidence).toBe("D");
  });

  it("caps confidence at Grade C if the sole evidence is from a press report", () => {
    // Fresh press report (3 months old)
    const resultPress = calculateFreshnessConfidence("A", "2026-07-01", "press", referenceDate);
    expect(resultPress.newConfidence).toBe("C");
    expect(resultPress.reasons.some((r) => r.includes("press reporting is epistemically capped"))).toBe(true);
  });

  it("leaves fresh statutory filings (< 24 months) at Grade A", () => {
    const resultFreshStatutory = calculateFreshnessConfidence("A", "2026-03-01", "government", referenceDate);
    expect(resultFreshStatutory.newConfidence).toBe("A");
    expect(resultFreshStatutory.reasons.length).toBe(0);
  });
});
