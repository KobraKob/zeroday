import { z } from "zod";

export const SourceTypeSchema = z.enum([
  "government",
  "company",
  "press",
  "report",
  "policy",
  "attested",
]);

export const ConfidenceGradeSchema = z.enum(["A", "B", "C", "D"]);

export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: SourceTypeSchema,
  url: z.string().url("Source must have a valid URL"),
  publisher: z.string(),
  published_at: z.string().optional(),
  retrieved_at: z.string(),
  license_note: z.string().optional(),
});

export const ClaimSubjectTypeSchema = z.enum([
  "gcc",
  "city",
  "state",
  "provider",
  "market",
]);

export const ClaimStatusSchema = z.enum([
  "pending",
  "approved",
  "superseded",
  "rejected",
  "unverified",
  "verified",
  "pending_review",
]);

export const ClaimCreatedBySchema = z.enum(["human", "ai", "import"]);

export const ClaimSchema = z.object({
  id: z.string(),
  subject_type: ClaimSubjectTypeSchema,
  subject_id: z.string(),
  field: z.string(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.record(z.any()),
  ]),
  unit: z.string().optional(),
  as_of: z.string(),
  source_id: z.string(),
  definition_id: z.string().optional(),
  confidence: ConfidenceGradeSchema,
  note: z.string().optional(),
  demo: z.boolean().optional(),
  status: ClaimStatusSchema.optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().nullable().optional(),
  last_checked_at: z.string().optional(),
  created_by: ClaimCreatedBySchema.optional(),
  exact_quote: z.string().optional(),
});

export const HeadcountBandSchema = z.enum([
  "<500",
  "500-1k",
  "1k-5k",
  "5k+",
]);

export const GccStatusSchema = z.enum([
  "operating",
  "announced",
  "expanding",
]);

export const CinStatusSchema = z.enum(["verified", "unverified"]);

export const GccSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  parent_name: z.string(),
  parent_hq_country: z.string(),
  india_entity_name: z.string().optional().nullable(),
  cin: z.string().optional().nullable(),
  cin_status: CinStatusSchema.optional().nullable(),
  cities: z.array(z.string()),
  sector: z.string(),
  functions: z.array(z.string()),
  established_year: z.number().optional().nullable(),
  headcount_band: HeadcountBandSchema.optional().nullable(),
  status: GccStatusSchema,
  claim_ids: z.array(z.string()),
});

export const IncentiveTypeSchema = z.enum([
  "capex_subsidy",
  "opex_subsidy",
  "stamp_duty",
  "power",
  "rent",
  "skilling",
  "other",
]);

export const IncentiveSchema = z.object({
  type: IncentiveTypeSchema,
  description: z.string(),
  amount_or_rate: z.string().optional().nullable(),
  conditions: z.string().optional().nullable(),
  source_id: z.string(),
});

export const StatePolicySchema = z.object({
  policy_name: z.string(),
  period: z.string(),
  source_id: z.string(),
  incentives: z.array(IncentiveSchema),
  last_checked: z.string(),
});

export const StateSchema = z.object({
  id: z.string(),
  name: z.string(),
  policy: StatePolicySchema,
});

export const CitySchema = z.object({
  id: z.string(),
  name: z.string(),
  state_id: z.string(),
  claim_ids: z.array(z.string()),
});

export const ProviderCategorySchema = z.enum([
  "advisory",
  "legal",
  "audit",
  "real_estate",
  "recruitment",
  "payroll_eor",
  "bot",
  "other",
]);

export const ProviderSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: ProviderCategorySchema,
  cities: z.array(z.string()),
  claim_ids: z.array(z.string()),
  marketed_claims: z.array(z.string()),
});

export const EvidenceKindSchema = z.enum([
  "press",
  "filing",
  "lease",
  "attestation",
  "case_study",
]);

export const EvidenceSchema = z.object({
  kind: EvidenceKindSchema,
  source_id: z.string(),
  excerpt_summary: z.string(),
});

export const ProofLinkStatusSchema = z.enum([
  "public",
  "attested",
  "disputed",
]);

export const ProofLinkSchema = z.object({
  id: z.string(),
  provider_id: z.string(),
  gcc_id: z.string(),
  service: z.string(),
  year: z.number().optional().nullable(),
  evidence: z.array(EvidenceSchema).min(1, "ProofLink must have at least one evidence item"),
  status: ProofLinkStatusSchema,
  demo: z.boolean().optional(),
});

export const SignalTypeSchema = z.enum([
  "incorporation",
  "gst_registration",
  "leadership_hire",
  "hiring_burst",
  "state_mou",
  "lease_announced",
  "press_intent",
  "office_inauguration",
]);

export const SignalSchema = z.object({
  id: z.string(),
  gcc_id: z.string().optional().nullable(),
  company_name: z.string(),
  type: SignalTypeSchema,
  date: z.string(),
  city: z.string().optional().nullable(),
  source_id: z.string(),
  note: z.string(),
  demo: z.boolean().optional(),
});

export const CountUnitSchema = z.enum([
  "parent_company",
  "legal_entity",
  "centre_unit",
]);

export const CountDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  unit: CountUnitSchema,
  rule_text: z.string(),
  includes: z.array(z.string()),
  excludes: z.array(z.string()),
});

export const PublishedCountSchema = z.object({
  id: z.string(),
  publisher: z.string(),
  headline_count: z.string(),
  count_value: z.number().optional().nullable(),
  unit_claimed: z.string(),
  unit_type: z.enum(["parent_company", "legal_entity", "centre_unit", "unknown"]).default("unknown"),
  as_of: z.string(),
  source_id: z.string(),
  note: z.string(),
  definition_known: z.boolean(),
});

export const ChecklistItemSchema = z.object({
  step: z.string(),
  title: z.string(),
  description: z.string(),
  official_url: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  mandatory: z.boolean(),
});

export const ChecklistSchema = z.object({
  id: z.string(),
  stage: z.string(),
  title: z.string(),
  description: z.string(),
  items: z.array(ChecklistItemSchema),
});

// Inferred TypeScript Types
export type Source = z.infer<typeof SourceSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Gcc = z.infer<typeof GccSchema>;
export type City = z.infer<typeof CitySchema>;
export type State = z.infer<typeof StateSchema>;
export type StatePolicy = z.infer<typeof StatePolicySchema>;
export type Incentive = z.infer<typeof IncentiveSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type ProofLink = z.infer<typeof ProofLinkSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type SignalType = z.infer<typeof SignalTypeSchema>;
export type CountDefinition = z.infer<typeof CountDefinitionSchema>;
export type PublishedCount = z.infer<typeof PublishedCountSchema>;
export type Checklist = z.infer<typeof ChecklistSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
