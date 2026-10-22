import { Claim, ProofLink } from "../schema";

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

// In-memory store initialized with seed review items
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

  approveClaim(id: string): boolean {
    const item = PENDING_CLAIMS.find((c) => c.id === id);
    if (item) {
      item.status = "approved";
      item.reviewed_at = new Date().toISOString();
      return true;
    }
    return false;
  },

  rejectClaim(id: string, reason: string): boolean {
    const item = PENDING_CLAIMS.find((c) => c.id === id);
    if (item) {
      item.status = "rejected";
      item.rejection_reason = reason;
      item.reviewed_at = new Date().toISOString();
      return true;
    }
    return false;
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
