import { describe, it, expect } from "vitest";
import { computeProviderScore } from "../lib/scoring";
import { ProofLink } from "../lib/schema";

describe("Provider Evidence Scoring Logic", () => {
  it("computes evidence score based on kind weights", () => {
    const proofLinks: ProofLink[] = [
      {
        id: "pl-1",
        provider_id: "prov-1",
        gcc_id: "gcc-1",
        service: "Lease Advisory",
        year: 2024,
        status: "public",
        evidence: [
          { kind: "attestation", source_id: "src-1", excerpt_summary: "Confirmed" }, // weight 3
        ],
      },
      {
        id: "pl-2",
        provider_id: "prov-1",
        gcc_id: "gcc-2",
        service: "Fit-out",
        year: 2025,
        status: "public",
        evidence: [
          { kind: "press", source_id: "src-2", excerpt_summary: "Press report" }, // weight 2
        ],
      },
      {
        id: "pl-3",
        provider_id: "prov-1",
        gcc_id: "gcc-3",
        service: "Audit",
        year: 2023,
        status: "public",
        evidence: [
          { kind: "case_study", source_id: "src-3", excerpt_summary: "Case study" }, // weight 1
        ],
      },
    ];

    const res = computeProviderScore(proofLinks);
    // 3 + 2 + 1 = 6
    expect(res.score).toBe(6);
    expect(res.totalLinks).toBe(3);
    expect(res.activeLinks).toBe(3);
    expect(res.disputedLinks).toBe(0);
    expect(res.distinctGccCount).toBe(3);
    expect(res.yearsRange.min).toBe(2023);
    expect(res.yearsRange.max).toBe(2025);
  });

  it("awards 0 score for disputed proof links", () => {
    const proofLinks: ProofLink[] = [
      {
        id: "pl-disp",
        provider_id: "prov-1",
        gcc_id: "gcc-1",
        service: "Disputed Claim",
        year: 2024,
        status: "disputed",
        evidence: [
          { kind: "attestation", source_id: "src-1", excerpt_summary: "Disputed by GCC" },
        ],
      },
    ];

    const res = computeProviderScore(proofLinks);
    expect(res.score).toBe(0);
    expect(res.disputedLinks).toBe(1);
    expect(res.activeLinks).toBe(0);
  });
});
