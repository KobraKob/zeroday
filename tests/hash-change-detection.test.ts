import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("Policy Content Hash Change Detection", () => {
  it("computes SHA-256 hash and detects content modifications accurately", () => {
    const originalPolicyText = `
      GOVERNMENT OF KARNATAKA
      DEPARTMENT OF ELECTRONICS, IT, BT AND S&T
      NOTIFICATION: KARNATAKA GCC POLICY 2024-2029
      Clause 4.1: Eligible Global Capability Centres shall receive a 25% capex subsidy capped at INR 20 Crore.
    `;

    const identicalPolicyText = `
      GOVERNMENT OF KARNATAKA
      DEPARTMENT OF ELECTRONICS, IT, BT AND S&T
      NOTIFICATION: KARNATAKA GCC POLICY 2024-2029
      Clause 4.1: Eligible Global Capability Centres shall receive a 25% capex subsidy capped at INR 20 Crore.
    `;

    const modifiedPolicyText = `
      GOVERNMENT OF KARNATAKA
      DEPARTMENT OF ELECTRONICS, IT, BT AND S&T
      NOTIFICATION: KARNATAKA GCC POLICY 2024-2029 (AMENDED 2026)
      Clause 4.1: Eligible Global Capability Centres shall receive a 30% capex subsidy capped at INR 25 Crore.
    `;

    const hash1 = crypto.createHash("sha256").update(originalPolicyText).digest("hex");
    const hash2 = crypto.createHash("sha256").update(identicalPolicyText).digest("hex");
    const hash3 = crypto.createHash("sha256").update(modifiedPolicyText).digest("hex");

    // Identical content must produce identical hash (idempotency)
    expect(hash1).toBe(hash2);

    // Modified policy content must produce different hash
    expect(hash1).not.toBe(hash3);

    // Difference flags change detection
    const isChangeDetected = hash1 !== hash3;
    expect(isChangeDetected).toBe(true);
  });
});
