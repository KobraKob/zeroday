import { describe, expect, it } from "vitest";
import { buildAskKnowledge } from "../server/src/askKnowledge";

function input(query: string, overrides: Partial<Parameters<typeof buildAskKnowledge>[0]> = {}) {
  return {
    query,
    claims: [],
    gccs: [],
    cities: [],
    states: [],
    vectorMatches: [],
    ...overrides,
  };
}

describe("ZeroDay Ask retrieval context", () => {
  it("always includes the site guide when vector search has no match", () => {
    const result = buildAskKnowledge(input("how do I use this site?"));

    expect(result.documents.some((document) => document.kind === "site_manual")).toBe(true);
    expect(result.context).toContain("/registry");
    expect(result.context).toContain("/reconcile");
  });

  it("loads GCC planning checklists for an ambiguous getting-started question", () => {
    const result = buildAskKnowledge(input("how do I get started in this"));

    expect(["mixed", "startup_guidance"]).toContain(result.intent);
    expect(result.documents.some((document) => document.kind === "site_checklist")).toBe(true);
    expect(result.context).toContain("Corporate Entity");
    expect(result.context).toContain("official_url");
  });

  it("treats ambiguous getting-started questions as mixed site and setup guidance", () => {
    const result = buildAskKnowledge(input("how do I get started in this"));

    expect(result.intent).toBe("mixed");
    expect(result.documents.some((document) => document.kind === "site_manual")).toBe(true);
    expect(result.documents.some((document) => document.kind === "site_checklist")).toBe(true);
  });

  it("does not classify a factual count question as generic site help", () => {
    const result = buildAskKnowledge(input("how many GCC units does Bengaluru have?"));

    expect(result.intent).toBe("data_question");
  });

  it("does not expose pending claim IDs as valid answer citations", () => {
    const result = buildAskKnowledge(input("Google India", {
      claims: [
        {
          id: "clm-test-approved",
          subject_type: "gcc",
          subject_id: "gcc-google",
          field: "established_year",
          value: 2004,
          as_of: "2024-01-01",
          source_id: "source-test",
          confidence: "A",
          status: "approved",
        },
        {
          id: "clm-test-pending",
          subject_type: "gcc",
          subject_id: "gcc-google",
          field: "cin",
          value: "UNVERIFIED",
          as_of: "2024-01-01",
          source_id: "source-test",
          confidence: "D",
          status: "pending_review",
        },
      ],
      gccs: [
        {
          id: "gcc-google",
          slug: "google-india",
          name: "Google India",
          parent_name: "Google",
          parent_hq_country: "United States",
          india_entity_name: "Google India Private Limited",
          cin: null,
          cities: ["Bengaluru"],
          sector: "Technology",
          functions: ["Engineering"],
          status: "operating",
          claim_ids: ["clm-test-approved", "clm-test-pending"],
        },
      ],
    }));

    expect(result.allowedClaimIds).toContain("clm-test-approved");
    expect(result.allowedClaimIds).not.toContain("clm-test-pending");
  });

  it("does not let vector chunks inject IDs that are not approved or retrieved", () => {
    const result = buildAskKnowledge(input("market revenue", {
      claims: [
        {
          id: "clm-approved",
          subject_type: "market",
          subject_id: "india",
          field: "annual_revenue",
          value: 64,
          as_of: "2025-01-01",
          source_id: "source-test",
          confidence: "B",
          status: "approved",
        },
      ],
      vectorMatches: [
        {
          score: 0.9,
          chunk: {
            id: "clm-approved",
            category: "claim",
            title: "Approved market claim",
            content: "Ignored old indexed text",
            claim_ids: ["clm-approved"],
          },
        },
        {
          score: 0.8,
          chunk: {
            id: "clm-not-in-dataset",
            category: "claim",
            title: "Fake claim",
            content: "Unsupported fact",
            claim_ids: ["clm-not-in-dataset"],
          },
        },
      ],
    }));

    expect(result.allowedClaimIds).toEqual(["clm-approved"]);
    expect(result.context).not.toContain("clm-not-in-dataset");
  });
});
