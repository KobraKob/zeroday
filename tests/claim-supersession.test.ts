import { describe, it, expect, beforeEach } from "vitest";
import { claimsRepo } from "../lib/repo/claimsRepo";

describe("Claim Supersession & Append-Only Ledger", () => {
  it("supersedes an old claim by setting valid_to and status=superseded, and inserts a new approved claim", () => {
    // 1. Create an initial claim
    const initial = claimsRepo.createClaim({
      id: "test-clm-lease-initial",
      subject_type: "gcc",
      subject_id: "gcc-test-hub",
      field: "office_sqft",
      value: "200,000 sq ft",
      as_of: "2025-01-01",
      source_id: "src-test-lease-2025",
      confidence: "A",
      status: "approved",
      last_checked_at: new Date().toISOString(),
      created_by: "human",
    });

    expect(initial.status).toBe("approved");
    expect(initial.valid_to).toBeNull();

    // 2. Supersede the claim with an expanded lease value
    const { oldClaim, newClaim } = claimsRepo.supersedeClaim(initial.id, {
      value: "350,000 sq ft",
      source_id: "src-test-lease-2026",
      confidence: "A",
      note: "Campus expansion lease registered with stamp duty payment",
    });

    // Check old claim is closed
    expect(oldClaim.status).toBe("superseded");
    expect(oldClaim.valid_to).toBeDefined();
    expect(oldClaim.valid_to).not.toBeNull();

    // Check new claim is active
    expect(newClaim.status).toBe("approved");
    expect(newClaim.value).toBe("350,000 sq ft");
    expect(newClaim.valid_from).toBeDefined();
    expect(newClaim.valid_to).toBeNull();

    // 3. Verify public reads exclude superseded claims
    const publicClaims = claimsRepo.getAll();
    const oldFoundInPublic = publicClaims.find((c) => c.id === initial.id);
    const newFoundInPublic = publicClaims.find((c) => c.id === newClaim.id);

    expect(oldFoundInPublic).toBeUndefined();
    expect(newFoundInPublic).toBeDefined();
    expect(newFoundInPublic?.value).toBe("350,000 sq ft");

    // 4. Verify historical query returns the complete immutable timeline
    const history = claimsRepo.getHistory("gcc", "gcc-test-hub", "office_sqft");
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].id).toBe(newClaim.id);
    expect(history[0].status).toBe("approved");
    expect(history[1].id).toBe(initial.id);
    expect(history[1].status).toBe("superseded");
  });
});
