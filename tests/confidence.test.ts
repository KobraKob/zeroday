import { describe, it, expect } from "vitest";
import {
  evaluateClaimConfidence,
  computeCoverage,
  recomputeCount,
} from "../lib/confidence";
import { Claim, Source, Gcc } from "../lib/schema";

describe("Confidence & Quality Logic", () => {
  const dummySource: Source = {
    id: "src-1",
    name: "Test Source",
    type: "report",
    url: "https://example.com/report",
    publisher: "Test Publisher",
    published_at: "2026-01-01",
    retrieved_at: "2026-10-21",
  };

  it("retains original grade for recent non-press source with no conflict", () => {
    const claim: Claim = {
      id: "clm-1",
      subject_type: "gcc",
      subject_id: "gcc-1",
      field: "established_year",
      value: 2020,
      as_of: "2026-01-01",
      source_id: "src-1",
      confidence: "A",
    };

    const result = evaluateClaimConfidence(claim, dummySource, [claim]);
    expect(result.effectiveGrade).toBe("A");
    expect(result.downgradedDueToAge).toBe(false);
    expect(result.hasConflict).toBe(false);
  });

  it("downgrades grade by one level if source is older than 24 months", () => {
    const oldSource: Source = {
      ...dummySource,
      published_at: "2023-01-01", // more than 24 months before Oct 2026
    };

    const claim: Claim = {
      id: "clm-old",
      subject_type: "gcc",
      subject_id: "gcc-1",
      field: "established_year",
      value: 2020,
      as_of: "2023-01-01",
      source_id: "src-1",
      confidence: "B",
    };

    const result = evaluateClaimConfidence(claim, oldSource, [claim]);
    expect(result.effectiveGrade).toBe("C");
    expect(result.downgradedDueToAge).toBe(true);
  });

  it("caps confidence at C for single secondary press source", () => {
    const pressSource: Source = {
      ...dummySource,
      type: "press",
      published_at: "2026-05-01",
    };

    const claim: Claim = {
      id: "clm-press",
      subject_type: "gcc",
      subject_id: "gcc-1",
      field: "headcount",
      value: 2500,
      as_of: "2026-05-01",
      source_id: "src-1",
      confidence: "A",
    };

    const result = evaluateClaimConfidence(claim, pressSource, [claim]);
    expect(result.effectiveGrade).toBe("C");
    expect(result.cappedDueToSinglePress).toBe(true);
  });

  it("detects conflicting claims on the same field", () => {
    const claimA: Claim = {
      id: "clm-a",
      subject_type: "gcc",
      subject_id: "gcc-1",
      field: "headcount_band",
      value: "1k-5k",
      as_of: "2026-01-01",
      source_id: "src-1",
      confidence: "B",
    };

    const claimB: Claim = {
      id: "clm-b",
      subject_type: "gcc",
      subject_id: "gcc-1",
      field: "headcount_band",
      value: "5k+",
      as_of: "2026-01-01",
      source_id: "src-1",
      confidence: "B",
    };

    const result = evaluateClaimConfidence(claimA, dummySource, [claimA, claimB]);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingClaimIds).toContain("clm-b");
  });

  it("computes coverage correctly", () => {
    const dummyGccs: Gcc[] = [
      {
        id: "g1",
        slug: "g1",
        name: "G1",
        parent_name: "P1",
        parent_hq_country: "US",
        cities: ["Bengaluru"],
        sector: "Tech",
        functions: ["R&D"],
        status: "operating",
        claim_ids: ["c1", "c2", "c3"],
      },
      {
        id: "g2",
        slug: "g2",
        name: "G2",
        parent_name: "P2",
        parent_hq_country: "UK",
        cities: ["Hyderabad"],
        sector: "BFSI",
        functions: ["Ops"],
        status: "operating",
        claim_ids: ["c4"],
      },
    ];

    const claims: Claim[] = [
      { id: "c1", subject_type: "gcc", subject_id: "g1", field: "f1", value: 1, as_of: "2026", source_id: "s1", confidence: "A" },
      { id: "c2", subject_type: "gcc", subject_id: "g1", field: "f2", value: 2, as_of: "2026", source_id: "s1", confidence: "A" },
      { id: "c3", subject_type: "gcc", subject_id: "g1", field: "f3", value: 3, as_of: "2026", source_id: "s1", confidence: "A" },
      { id: "c4", subject_type: "gcc", subject_id: "g2", field: "f1", value: 1, as_of: "2026", source_id: "s1", confidence: "A" },
    ];

    const cov = computeCoverage(dummyGccs, claims, 100);
    expect(cov.wellSourcedCount).toBe(1); // only g1 has >= 3 fields
    expect(cov.coveragePercentage).toBe(1.0);
  });

  it("recomputes counts under parent_company, legal_entity, and centre_unit", () => {
    const testGccs: Gcc[] = [
      {
        id: "g1",
        slug: "g1",
        name: "Acme India Tech",
        parent_name: "Acme Corp",
        parent_hq_country: "US",
        india_entity_name: "Acme India Pvt Ltd",
        cin: "U12345KA2020PTC000001",
        cities: ["Bengaluru", "Hyderabad"],
        sector: "Tech",
        functions: ["Engineering"],
        status: "operating",
        claim_ids: [],
      },
      {
        id: "g2",
        slug: "g2",
        name: "Acme India Services",
        parent_name: "Acme Corp", // same parent
        parent_hq_country: "US",
        india_entity_name: "Acme Business Services India Pvt Ltd",
        cin: "U12345KA2021PTC000002",
        cities: ["Pune"],
        sector: "Tech",
        functions: ["Ops"],
        status: "operating",
        claim_ids: [],
      },
      {
        id: "g3",
        slug: "g3",
        name: "Beta Global Solutions",
        parent_name: "Beta Inc",
        parent_hq_country: "Germany",
        india_entity_name: "Beta India Pvt Ltd",
        cin: "U12345MH2022PTC000003",
        cities: ["Mumbai"],
        sector: "Auto",
        functions: ["Embedded"],
        status: "operating",
        claim_ids: [],
      },
    ];

    const parentCount = recomputeCount("parent_company", testGccs);
    expect(parentCount.count).toBe(2); // Acme Corp and Beta Inc

    const entityCount = recomputeCount("legal_entity", testGccs);
    expect(entityCount.count).toBe(3); // 3 distinct CINs

    const centreCount = recomputeCount("centre_unit", testGccs);
    expect(centreCount.count).toBe(4); // g1 has 2 cities, g2 has 1, g3 has 1 -> 4 units
  });
});
