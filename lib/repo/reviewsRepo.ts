import { Claim } from "../schema";
import { claimsRepo } from "./claimsRepo";
import { eventsRepo } from "./eventsRepo";
import { getDb, schema } from "../db/client";

export interface PendingReviewClaim {
  id: string;
  claim: Claim;
  exact_quote: string;
  source_context: string;
  source_url: string;
  extracted_at: string;
  model: string;
  status: "pending" | "approved" | "rejected";
  reviewed_at?: string;
  rejection_reason?: string;
  reviewer?: string;
}

export interface SubmittedAttestation {
  id: string;
  provider_id: string;
  gcc_name: string;
  service_category: string;
  attester_name: string;
  attester_role: string;
  attester_email: string;
  year: number;
  project_summary: string;
  submitted_at: string;
  status: "pending_verification" | "verified" | "rejected";
}

const PENDING_CLAIMS: PendingReviewClaim[] = [
  {
    id: "rev-claim-1",
    claim: {
      id: "clm-prop-nvidia-pune",
      subject_type: "gcc",
      subject_id: "gcc-nvidia",
      field: "office_expansion_sqft",
      value: "500,000 sq ft",
      as_of: "2026-08-10",
      source_id: "src-cw-office-2026",
      confidence: "C",
      status: "pending_review",
      exact_quote: "NVIDIA committed to leasing an additional 500,000 square feet of high-performance computing lab space in Pune.",
      demo: true,
    },
    exact_quote: "NVIDIA committed to leasing an additional 500,000 square feet of high-performance computing lab space in Pune.",
    source_context: "Commercial real estate absorption roundup covering Tier-1 and Tier-2 AI chip design hubs.",
    source_url: "https://www.cushmanwakefield.com/en/india/insights/gcc-office-leasing-india-2026",
    extracted_at: "2026-10-15T11:20:00Z",
    model: "claude-3-5-sonnet",
    status: "pending",
  },
  {
    id: "rev-claim-2",
    claim: {
      id: "clm-prop-bengaluru-ai-share",
      subject_type: "city",
      subject_id: "city-blr",
      field: "ai_talent_concentration",
      value: "42% of India's GenAI developer base",
      as_of: "2026-07-22",
      source_id: "src-teamlease-gcc-hiring",
      confidence: "C",
      status: "pending_review",
      exact_quote: "Bengaluru accounts for 42% of the active generative AI specialist engineering roles in Indian capability centers.",
      demo: true,
    },
    exact_quote: "Bengaluru accounts for 42% of the active generative AI specialist engineering roles in Indian capability centers.",
    source_context: "TeamLease Digital Annual GCC Tech Talent and Compensation Survey 2026.",
    source_url: "https://www.teamleasegroup.com/reports/gcc-talent-salary-benchmark-2026",
    extracted_at: "2026-10-17T09:45:00Z",
    model: "claude-3-5-sonnet",
    status: "pending",
  },
];

const SUBMITTED_ATTESTATIONS: SubmittedAttestation[] = [
  {
    id: "attest-seed-1",
    provider_id: "prov-ansr",
    gcc_name: "Lowe's Services India",
    service_category: "bot",
    attester_name: "Anand Rangarajan",
    attester_role: "Former Director of Workplace Strategy",
    attester_email: "anand.r@example.com",
    year: 2023,
    project_summary: "ANSR managed facility lease restructuring and turnkey lab buildout.",
    submitted_at: "2026-10-10T14:30:00Z",
    status: "pending_verification",
  },
];

export const reviewsRepo = {
  getPendingClaims(): PendingReviewClaim[] {
    return PENDING_CLAIMS;
  },

  addPendingClaim(item: PendingReviewClaim): void {
    const existingIndex = PENDING_CLAIMS.findIndex((c) => c.id === item.id);
    if (existingIndex >= 0) {
      PENDING_CLAIMS[existingIndex] = item;
    } else {
      PENDING_CLAIMS.unshift(item);
    }
  },

  approveClaim(id: string, reviewer: string = "admin"): boolean {
    const item = PENDING_CLAIMS.find((c) => c.id === id);
    if (!item) return false;

    item.status = "approved";
    item.reviewed_at = new Date().toISOString();
    item.reviewer = reviewer;

    // Insert as approved into public claims repository
    claimsRepo.createClaim({
      ...item.claim,
      status: "approved",
      created_by: "human",
    });

    // Create public event
    eventsRepo.createEvent(
      "claim_change",
      `${item.claim.subject_id} (${item.claim.field})`,
      `Editorial review approved claim "${item.claim.field}: ${String(item.claim.value)}" against primary document.`
    );

    // Record decision in PostgreSQL
    const database = getDb();
    if (database) {
      try {
        database.insert(schema.reviewDecisions).values({
          id: `dec-${Date.now()}-${id}`,
          claim_id: item.claim.id,
          decision: "approved",
          reviewer,
          reason: "Verified verbatim against primary source snapshot",
          created_at: new Date(),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return true;
  },

  editClaim(
    id: string,
    updatedField: string,
    updatedValue: any,
    reason: string = "Edited during review",
    reviewer: string = "admin"
  ): boolean {
    const item = PENDING_CLAIMS.find((c) => c.id === id);
    if (!item) return false;

    item.status = "approved";
    item.reviewed_at = new Date().toISOString();
    item.reviewer = reviewer;
    item.claim.field = updatedField;
    item.claim.value = updatedValue;

    // Check if an existing approved claim exists to supersede, or create new
    const existingClaims = claimsRepo.getBySubject(item.claim.subject_type, item.claim.subject_id);
    const existingTarget = existingClaims.find((c) => c.field === updatedField);

    if (existingTarget) {
      claimsRepo.supersedeClaim(existingTarget.id, {
        value: updatedValue,
        source_id: item.claim.source_id,
        exact_quote: item.exact_quote,
        confidence: item.claim.confidence,
        created_by: "human",
      });
    } else {
      claimsRepo.createClaim({
        ...item.claim,
        status: "approved",
        created_by: "human",
      });
    }

    // Create event
    eventsRepo.createEvent(
      "claim_change",
      `${item.claim.subject_id} (${updatedField})`,
      `Editorial review edited & approved claim: ${String(updatedValue)} (${reason})`
    );

    // Record review decision in DB
    const database = getDb();
    if (database) {
      try {
        database.insert(schema.reviewDecisions).values({
          id: `dec-${Date.now()}-${id}`,
          claim_id: item.claim.id,
          decision: "edited",
          reviewer,
          reason,
          edited_value: { field: updatedField, value: updatedValue },
          created_at: new Date(),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return true;
  },

  rejectClaim(id: string, reason: string, reviewer: string = "admin"): boolean {
    const item = PENDING_CLAIMS.find((c) => c.id === id);
    if (!item) return false;

    item.status = "rejected";
    item.rejection_reason = reason;
    item.reviewed_at = new Date().toISOString();
    item.reviewer = reviewer;

    const database = getDb();
    if (database) {
      try {
        database.insert(schema.reviewDecisions).values({
          id: `dec-${Date.now()}-${id}`,
          claim_id: item.claim.id,
          decision: "rejected",
          reviewer,
          reason,
          created_at: new Date(),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return true;
  },

  getAttestations(): SubmittedAttestation[] {
    return SUBMITTED_ATTESTATIONS;
  },

  addAttestation(attestation: Omit<SubmittedAttestation, "id" | "submitted_at" | "status">): SubmittedAttestation {
    const record: SubmittedAttestation = {
      ...attestation,
      id: `attest-${Date.now()}`,
      submitted_at: new Date().toISOString(),
      status: "pending_verification",
    };
    SUBMITTED_ATTESTATIONS.unshift(record);
    return record;
  },
};
