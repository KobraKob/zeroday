import { describe, it, expect } from "vitest";
import { runPolicyMonitor } from "../lib/jobs/policy-monitor";
import { eventsRepo } from "../lib/repo/eventsRepo";
import { reviewsRepo } from "../lib/repo/reviewsRepo";
import { claimsRepo } from "../lib/repo/claimsRepo";

describe("Live Ingestion Pipeline Integration Test", () => {
  it("detects changed policy page, creates event and pending claim, ensures nothing appears publicly until approved", async () => {
    const policyUrl = "https://karnataka.gov.in/policies/gcc-policy-2024-2029";

    // 1. Initial baseline run (establishes initial snapshot hash)
    const initialDoc = `
      GOVERNMENT OF KARNATAKA
      KARNATAKA GCC POLICY 2024-2029
      Section 3.1: Mega GCC facilities established in 2024 receive standard IT exemptions.
    `;
    await runPolicyMonitor({ [policyUrl]: initialDoc });

    const baselineEventsCount = eventsRepo.getAll().length;

    // 2. State government amends policy document online
    const amendedDoc = `
      GOVERNMENT OF KARNATAKA
      KARNATAKA GCC POLICY 2024-2029 (AMENDED 2026)
      Section 3.1: Eligible Global Capability Centres leased 300,000 sq ft in Bengaluru shall receive 25% capex reimbursement.
    `;

    // Run policy monitor pipeline against the updated document
    const result = await runPolicyMonitor({ [policyUrl]: amendedDoc });

    expect(result.changesDetected).toBe(1);
    expect(result.eventsCreated).toBe(1);

    // 3. Verify an event was logged in the public events ledger
    const recentEvents = eventsRepo.getAll();
    expect(recentEvents.length).toBe(baselineEventsCount + 1);
    const policyEvent = recentEvents[0];
    expect(policyEvent.type).toBe("policy_change");
    expect(policyEvent.summary).toContain("Karnataka");

    // 4. Verify a pending claim proposal was created in the review queue
    const pendingQueue = reviewsRepo.getPendingClaims();
    const proposedItem = pendingQueue.find(
      (item) => item.exact_quote && item.exact_quote.includes("leased 300,000 sq ft in Bengaluru")
    );
    expect(proposedItem).toBeDefined();
    expect(proposedItem?.status).toBe("pending");

    // 5. Epistemic Firewall Check: Verify nothing appears in public claims repository!
    const publicClaimsBeforeApproval = claimsRepo.getAll();
    const publicMatchBefore = publicClaimsBeforeApproval.find(
      (c) => c.value === "300,000 sq ft" && c.subject_id === "state-ka"
    );
    expect(publicMatchBefore).toBeUndefined();

    // 6. Admin reviewer verifies and approves the claim
    const approved = reviewsRepo.approveClaim(proposedItem!.id, "lead-editor");
    expect(approved).toBe(true);

    // 7. Verify the claim is now published and queryable in the public repository
    const publicClaimsAfterApproval = claimsRepo.getAll();
    const publicMatchAfter = publicClaimsAfterApproval.find(
      (c) => c.value === "300,000 sq ft" && c.subject_id === "state-ka"
    );
    expect(publicMatchAfter).toBeDefined();
    expect(publicMatchAfter?.status).toBe("approved");
    expect(publicMatchAfter?.created_by).toBe("human");
  });
});
