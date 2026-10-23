import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, index } from "drizzle-orm/pg-core";

/**
 * 1. sources: Provenance registry for all statutory filings, press notices, policies, and reports.
 */
export const sources = pgTable(
  "sources",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    name: text("name").notNull(),
    type: varchar("type", { length: 64 }).notNull(), // 'government' | 'company' | 'press' | 'report' | 'policy' | 'attested'
    url: text("url").notNull(),
    publisher: text("publisher").notNull(),
    published_at: text("published_at"),
    retrieved_at: text("retrieved_at").notNull(),
    license_note: text("license_note"),
    status: varchar("status", { length: 32 }).notNull().default("active"), // 'active' | 'dead' | 'unverified'
    last_checked_at: timestamp("last_checked_at", { withTimezone: true }).defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusIdx: index("sources_status_idx").on(table.status),
    urlIdx: index("sources_url_idx").on(table.url),
  })
);

/**
 * 2. source_snapshots: Raw document content in object storage / database for cryptographic diffs.
 */
export const sourceSnapshots = pgTable(
  "source_snapshots",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    source_id: varchar("source_id", { length: 128 }).references(() => sources.id, { onDelete: "cascade" }),
    raw_content: text("raw_content").notNull(),
    content_hash: varchar("content_hash", { length: 128 }).notNull(),
    fetched_at: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceIdIdx: index("source_snapshots_source_idx").on(table.source_id),
    contentHashIdx: index("source_snapshots_hash_idx").on(table.content_hash),
  })
);

/**
 * 3. claims: Append-only ledger of verified facts with validity intervals and confidence grades.
 */
export const claims = pgTable(
  "claims",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    subject_type: varchar("subject_type", { length: 32 }).notNull(), // 'gcc' | 'city' | 'state' | 'provider' | 'market'
    subject_id: varchar("subject_id", { length: 128 }).notNull(),
    field: varchar("field", { length: 128 }).notNull(),
    value: jsonb("value").notNull(), // string, number, array, or object
    unit: varchar("unit", { length: 64 }),
    as_of: varchar("as_of", { length: 32 }).notNull(),
    source_id: varchar("source_id", { length: 128 }).references(() => sources.id, { onDelete: "set null" }),
    confidence: varchar("confidence", { length: 8 }).notNull(), // 'A' | 'B' | 'C' | 'D'
    status: varchar("status", { length: 32 }).notNull().default("approved"), // 'pending' | 'approved' | 'superseded' | 'rejected' | 'unverified'
    valid_from: timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(),
    valid_to: timestamp("valid_to", { withTimezone: true }),
    last_checked_at: timestamp("last_checked_at", { withTimezone: true }).defaultNow().notNull(),
    created_by: varchar("created_by", { length: 32 }).notNull().default("import"), // 'human' | 'ai' | 'import'
    exact_quote: text("exact_quote"),
    note: text("note"),
    demo: boolean("demo").default(false),
  },
  (table) => ({
    subjectIdx: index("claims_subject_idx").on(table.subject_type, table.subject_id),
    fieldIdx: index("claims_field_idx").on(table.field),
    statusIdx: index("claims_status_idx").on(table.status),
    sourceIdx: index("claims_source_idx").on(table.source_id),
  })
);

/**
 * 4. entities: GCCs, cities, states, providers.
 */
export const entities = pgTable(
  "entities",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    type: varchar("type", { length: 32 }).notNull(), // 'gcc' | 'city' | 'state' | 'provider'
    name: text("name").notNull(),
    slug: varchar("slug", { length: 128 }).notNull(),
    data: jsonb("data").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("entities_type_idx").on(table.type),
    slugIdx: index("entities_slug_idx").on(table.slug),
  })
);

/**
 * 5. signals: Expansion, lease, or incorporation signals.
 */
export const signals = pgTable(
  "signals",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    title: text("title").notNull(),
    type: varchar("type", { length: 64 }).notNull(),
    date: varchar("date", { length: 32 }).notNull(),
    entity_id: varchar("entity_id", { length: 128 }),
    entity_type: varchar("entity_type", { length: 32 }),
    summary: text("summary").notNull(),
    claim_ids: jsonb("claim_ids").default([]),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("signals_entity_idx").on(table.entity_type, table.entity_id),
    dateIdx: index("signals_date_idx").on(table.date),
  })
);

/**
 * 6. proof_links: Evidentiary proof links connecting providers to GCCs.
 */
export const proofLinks = pgTable(
  "proof_links",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    provider_id: varchar("provider_id", { length: 128 }).notNull(),
    gcc_id: varchar("gcc_id", { length: 128 }).notNull(),
    service: varchar("service", { length: 128 }).notNull(),
    year: integer("year"),
    evidence: jsonb("evidence").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("public"), // 'public' | 'attested' | 'disputed'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerIdx: index("proof_links_provider_idx").on(table.provider_id),
    gccIdx: index("proof_links_gcc_idx").on(table.gcc_id),
  })
);

/**
 * 7. events: System changelog stream (new GCCs, changed claims, policy updates, downgrades).
 */
export const events = pgTable(
  "events",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    type: varchar("type", { length: 64 }).notNull(), // 'new_gcc' | 'claim_change' | 'policy_change' | 'staleness_downgrade' | 'source_dead'
    entity: text("entity").notNull(),
    summary: text("summary").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("events_type_idx").on(table.type),
    createdAtIdx: index("events_created_at_idx").on(table.created_at),
  })
);

/**
 * 8. ai_log: Verbatim extraction audit log tracking AI parser executions.
 */
export const aiLog = pgTable("ai_log", {
  id: varchar("id", { length: 128 }).primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  input_hash: varchar("input_hash", { length: 128 }).notNull(),
  model: varchar("model", { length: 64 }).notNull(),
  source_id: varchar("source_id", { length: 128 }),
  accepted_count: integer("accepted_count").notNull().default(0),
  rejected_count: integer("rejected_count").notNull().default(0),
  details: jsonb("details"),
});

/**
 * 9. review_decisions: Audit trail for admin human-in-the-loop decisions.
 */
export const reviewDecisions = pgTable(
  "review_decisions",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    claim_id: varchar("claim_id", { length: 128 }).notNull(),
    decision: varchar("decision", { length: 32 }).notNull(), // 'approved' | 'rejected' | 'edited'
    reviewer: varchar("reviewer", { length: 128 }).notNull().default("admin"),
    reason: text("reason"),
    edited_value: jsonb("edited_value"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    claimIdx: index("review_decisions_claim_idx").on(table.claim_id),
    decisionIdx: index("review_decisions_decision_idx").on(table.decision),
  })
);

/**
 * 10. cron_job_runs: Idempotent execution logs for background pipeline jobs.
 */
export const cronJobRuns = pgTable(
  "cron_job_runs",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    job_name: varchar("job_name", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(), // 'started' | 'success' | 'failed'
    details: jsonb("details"),
    duration_ms: integer("duration_ms"),
    started_at: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finished_at: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => ({
    jobNameIdx: index("cron_job_runs_job_name_idx").on(table.job_name),
  })
);
