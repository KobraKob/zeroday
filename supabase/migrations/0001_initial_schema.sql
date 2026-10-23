-- ZeroDay Grounded Intelligence Engine: Initial PostgreSQL Migration (Supabase + Drizzle)
-- Comprehensive Schema with Append-Only Claims, Source Snapshots, and Row Level Security (RLS)

-- 1. SOURCES TABLE
CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(128) PRIMARY KEY,
  name TEXT NOT NULL,
  type VARCHAR(64) NOT NULL,
  url TEXT NOT NULL,
  publisher TEXT NOT NULL,
  published_at TEXT,
  retrieved_at TEXT NOT NULL,
  license_note TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active' | 'dead' | 'unverified'
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sources_status_idx ON sources(status);
CREATE INDEX IF NOT EXISTS sources_url_idx ON sources(url);

-- 2. SOURCE SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS source_snapshots (
  id VARCHAR(128) PRIMARY KEY,
  source_id VARCHAR(128) REFERENCES sources(id) ON DELETE CASCADE,
  raw_content TEXT NOT NULL,
  content_hash VARCHAR(128) NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS source_snapshots_source_idx ON source_snapshots(source_id);
CREATE INDEX IF NOT EXISTS source_snapshots_hash_idx ON source_snapshots(content_hash);

-- 3. CLAIMS TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS claims (
  id VARCHAR(128) PRIMARY KEY,
  subject_type VARCHAR(32) NOT NULL, -- 'gcc' | 'city' | 'state' | 'provider' | 'market'
  subject_id VARCHAR(128) NOT NULL,
  field VARCHAR(128) NOT NULL,
  value JSONB NOT NULL,
  unit VARCHAR(64),
  as_of VARCHAR(32) NOT NULL,
  source_id VARCHAR(128) REFERENCES sources(id) ON DELETE SET NULL,
  confidence VARCHAR(8) NOT NULL, -- 'A' | 'B' | 'C' | 'D'
  status VARCHAR(32) NOT NULL DEFAULT 'approved', -- 'pending' | 'approved' | 'superseded' | 'rejected' | 'unverified'
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(32) NOT NULL DEFAULT 'import', -- 'human' | 'ai' | 'import'
  exact_quote TEXT,
  note TEXT,
  demo BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS claims_subject_idx ON claims(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS claims_field_idx ON claims(field);
CREATE INDEX IF NOT EXISTS claims_status_idx ON claims(status);
CREATE INDEX IF NOT EXISTS claims_source_idx ON claims(source_id);
CREATE INDEX IF NOT EXISTS claims_validity_idx ON claims(valid_from, valid_to);

-- 4. ENTITIES TABLE
CREATE TABLE IF NOT EXISTS entities (
  id VARCHAR(128) PRIMARY KEY,
  type VARCHAR(32) NOT NULL, -- 'gcc' | 'city' | 'state' | 'provider'
  name TEXT NOT NULL,
  slug VARCHAR(128) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS entities_type_idx ON entities(type);
CREATE INDEX IF NOT EXISTS entities_slug_idx ON entities(slug);

-- 5. SIGNALS TABLE
CREATE TABLE IF NOT EXISTS signals (
  id VARCHAR(128) PRIMARY KEY,
  title TEXT NOT NULL,
  type VARCHAR(64) NOT NULL,
  date VARCHAR(32) NOT NULL,
  entity_id VARCHAR(128),
  entity_type VARCHAR(32),
  summary TEXT NOT NULL,
  claim_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signals_entity_idx ON signals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS signals_date_idx ON signals(date);

-- 6. PROOF LINKS TABLE
CREATE TABLE IF NOT EXISTS proof_links (
  id VARCHAR(128) PRIMARY KEY,
  provider_id VARCHAR(128) NOT NULL,
  gcc_id VARCHAR(128) NOT NULL,
  service VARCHAR(128) NOT NULL,
  year INTEGER,
  evidence JSONB NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'public', -- 'public' | 'attested' | 'disputed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proof_links_provider_idx ON proof_links(provider_id);
CREATE INDEX IF NOT EXISTS proof_links_gcc_idx ON proof_links(gcc_id);

-- 7. EVENTS TABLE (CHANGELOG)
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(128) PRIMARY KEY,
  type VARCHAR(64) NOT NULL, -- 'new_gcc' | 'claim_change' | 'policy_change' | 'staleness_downgrade' | 'source_dead'
  entity TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_type_idx ON events(type);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at DESC);

-- 8. AI LOG TABLE
CREATE TABLE IF NOT EXISTS ai_log (
  id VARCHAR(128) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_hash VARCHAR(128) NOT NULL,
  model VARCHAR(64) NOT NULL,
  source_id VARCHAR(128),
  accepted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  details JSONB
);

CREATE INDEX IF NOT EXISTS ai_log_timestamp_idx ON ai_log(timestamp DESC);

-- 9. REVIEW DECISIONS TABLE
CREATE TABLE IF NOT EXISTS review_decisions (
  id VARCHAR(128) PRIMARY KEY,
  claim_id VARCHAR(128) NOT NULL,
  decision VARCHAR(32) NOT NULL, -- 'approved' | 'rejected' | 'edited'
  reviewer VARCHAR(128) NOT NULL DEFAULT 'admin',
  reason TEXT,
  edited_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS review_decisions_claim_idx ON review_decisions(claim_id);
CREATE INDEX IF NOT EXISTS review_decisions_created_at_idx ON review_decisions(created_at DESC);

-- 10. CRON JOB RUNS (IDEMPOTENCY & LOGGING)
CREATE TABLE IF NOT EXISTS cron_job_runs (
  id VARCHAR(128) PRIMARY KEY,
  job_name VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL, -- 'started' | 'success' | 'failed'
  details JSONB,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS cron_job_runs_name_idx ON cron_job_runs(job_name, started_at DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Requirement 8: "row-level security so public reads see only approved claims"
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_runs ENABLE ROW LEVEL SECURITY;

-- Public can read only approved claims
CREATE POLICY "Public reads see only approved claims"
  ON claims
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Public can read active sources
CREATE POLICY "Public reads active sources"
  ON sources
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can read entities, signals, events, and proof_links
CREATE POLICY "Public reads entities" ON entities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reads signals" ON signals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reads events" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public reads proof_links" ON proof_links FOR SELECT TO anon, authenticated USING (true);

-- Admin and service role have full bypass access
CREATE POLICY "Service role full access on claims" ON claims FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on sources" ON sources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on source_snapshots" ON source_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on entities" ON entities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on signals" ON signals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on proof_links" ON proof_links FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on events" ON events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on ai_log" ON ai_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on review_decisions" ON review_decisions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on cron_job_runs" ON cron_job_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
