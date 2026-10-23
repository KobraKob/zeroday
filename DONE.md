# ZeroDay: Complete Architectural Overview & Project Deliverables

## 1. What This Project Is

**ZeroDay** is an institutional-grade, citable reference platform and grounded intelligence engine for India's Global Capability Centre (GCC) ecosystem. It transforms an epistemic landscape previously dominated by opaque marketing reports, unverifiable analyst headcounts, and commercial pay-to-play directories into a **cryptographically auditable, primary-source-anchored ledger**.

Every figure in ZeroDay—from corporate establishment years and registered office lease square footage to state capex subsidies—is backed by a statutory regulatory filing (MCA Corporate Identification Numbers), registered lease deed, or gazetted state decree.

---

## 2. Why ZeroDay Was Built

Before ZeroDay, the India GCC market suffered from a systemic credibility and reconciliation crisis:
1. **Conflicting Counts**: Major analyst firms and consultancies published widely divergent numbers (ranging from 1,400 to nearly 3,000 centres) without disclosing whether they counted parent global corporations, Indian legal entities, or distributed office delivery units.
2. **Ungrounded Hallucinations**: Standard LLMs and search engines frequently invent GCC facts, synthesize false headcounts, or echo stale PR releases.
3. **Commercial Bias**: Vendor rankings and awards were routinely sold to service providers under commercial sponsorship agreements.
4. **Data Staleness**: Outdated news articles remained cited years after leases expired or corporate reorganizations took place.

ZeroDay resolves this through:
- **Strict Unit Reconciliation**: Disaggregates published figures across three clear counting units: *Parent Company*, *Legal Entity*, and *Centre Unit*.
- **Append-Only Immutability**: Values never silently overwrite historical records; superseded claims close cleanly with validity timestamps (`valid_to`), preserving a complete queryable audit trail.
- **Autonomous Ingestion with Human-in-the-Loop Verification**: Scheduled jobs track RSS feeds, monitor state gazettes via cryptographic SHA-256 diffs, check source health weekly, and downgrade stale claims. New AI-extracted data enters as `pending` and is blocked by Row Level Security (RLS) until peer-reviewed against verbatim primary quotes.
- **Permanent High-Density Dark Theme**: An institutional cartographic ledger aesthetic engineered for epistemological authority and high data density.

---

## 3. Core Components Implemented

### A. Database Layer (Supabase PostgreSQL + Drizzle ORM)
- **`lib/db/schema.ts`**: Complete Drizzle schema with tables:
  - `sources`: Primary provenance records with statuses (`active`, `dead`, `unverified`) and health timestamps.
  - `source_snapshots`: Verbatim document snapshots with SHA-256 `content_hash` and `fetched_at` timestamps.
  - `claims`: Append-only ledger with `subject_type`, `subject_id`, `field`, `value`, `unit`, `as_of`, `source_id`, `confidence`, `status`, `valid_from`, `valid_to`, `last_checked_at`, `created_by`.
  - `entities`: Harmonized directory of GCCs, cities, states, and service providers.
  - `signals`: Market indicators and real estate expansions.
  - `proof_links`: Evidentiary proof links connecting providers to enterprise GCC clients.
  - `events`: System-wide immutable changelog stream.
  - `ai_log`: Execution telemetry for verbatim AI parsers.
  - `review_decisions`: Administrative decisions log (`approved`, `rejected`, `edited`).
  - `cron_job_runs`: Execution telemetry and idempotency logger.
- **`supabase/migrations/0001_initial_schema.sql`**: Full PostgreSQL migration with indexes, triggers, and Row Level Security (RLS) policies guaranteeing public queries see only approved claims (`status = 'approved'`).

### B. Ingestion Pipeline & Automated Jobs
1. **`news-ingest` (`lib/jobs/news-ingest.ts`)**: Daily RSS feed fetcher with URL deduplication via SHA-256 hashes, polite parsing, verbatim quote validation, and insertion into the pending review queue.
2. **`policy-monitor` (`lib/jobs/policy-monitor.ts`)**: Weekly state policy monitor fetching gazetted portals (`data/policy-sources.json`), comparing SHA-256 content hashes, storing snapshots, and generating public changelog events and pending re-extractions on change.
3. **`link-check` (`lib/jobs/link-check.ts`)**: Weekly probe of source URLs via `HEAD`/`GET`. Marks dead URLs (`404`/`410`), creates public audit events, and automatically downgrades linked claim confidence grades.
4. **`freshness` (`lib/jobs/freshness.ts`)**: Daily staleness auditor enforcing hard epistemic rules:
   - Claims older than 24 months downgrade one grade (A -> B, B -> C, C -> D).
   - Claims backed solely by press reports are permanently capped at Grade C.
5. **Polite HTTP Client (`lib/jobs/http-client.ts`)**:
   - Enforces User-Agent: `ZeroDay-Bot/1.0 (+https://zeroday.in/bot; contact@zeroday.in)`.
   - Adheres to `robots.txt` Disallow directives.
   - Enforces per-domain rate limiting (minimum 1,000ms delay).
   - Strictly blocks scraping of gated networks (LinkedIn, Facebook, Glassdoor, etc.).
   - Exponential backoff retry logic.

### C. Repository Layer Swap (Interface Preserved)
The synchronous repository signatures used throughout Next.js Server Components and client drawers were preserved exactly:
- `claimsRepo.getAll()`: Automatically filters to `status = 'approved'` (RLS parity in memory).
- `claimsRepo.supersedeClaim()`: Handles append-only closing of prior rows (`valid_to = NOW()`, `status = 'superseded'`) and insertion of new rows (`valid_from = NOW()`, `status = 'approved'`).
- `claimsRepo.getHistory()`: Queries complete temporal validity history.
- `sourcesRepo.updateStatus()`: Updates health status and timestamps.
- `eventsRepo`: Manages the live public changelog stream.

### D. Administrative Review Queue (`/admin/review`)
- Authenticated with `ADMIN_SECRET` / bearer token protection.
- **Quote beside Source Snapshot**: Side-by-side inspection pane displaying the exact verbatim quote on the left and the raw primary document text on the right.
- **Actions**:
  - `Accept`: Flips status to `approved`, creates public changelog event, logs to `review_decisions`, and triggers on-demand ISR revalidation.
  - `Edit & Supersede`: Edits field/value, supersedes original claim in history, logs to `review_decisions`, and commits new approved claim.
  - `Reject`: Records audit rejection reason in `review_decisions` and marks claim rejected.

### E. Public UI & Identity Overhaul
- **ZeroDay Identity**: The identity was systematically migrated from "GCC Atlas" to "ZeroDay" across wordmarks, logos (`ZD`), metadata, vector store chunks, drawer prompts, and footer.
- **Removed Top Header**: Dismissible ticker strip removed cleanly from the top navigation bar.
- **Instant Loading Time**: Removed the heavy serialization of all claims and sources from the root server component layout into `AskDrawer`, reducing the initial HTML payload and SSR render time significantly. Fonts use non-blocking `display=swap`.
- **Permanent Dark Mode**: Defaulted all CSS tokens in `:root` and `.dark` to the high-contrast dark navy palette (`#0E1026`, `#15183A`, `#FFF6E5`), and removed the light theme.
- **Public Changelog (`/changelog`)**: Real-time event feed tracking new GCC incorporations, claim modifications, policy gazettes, and staleness downgrades.
- **As of & Last Checked Badges**: `ClaimValue` displays `as of [date]` and `last checked [date]` on figures.

---

## 4. Test Verification Summary

The test suite in `tests/` contains 21 automated tests across 8 suites, all passing:
- `tests/claim-supersession.test.ts`: Verifies append-only closure (`valid_to`, `superseded`), new active row insertion, and historical query retrieval.
- `tests/hash-change-detection.test.ts`: Verifies SHA-256 snapshot hashing and change detection.
- `tests/staleness.test.ts`: Verifies 24-month staleness downgrade and press capping rules.
- `tests/pipeline-integration.test.ts`: Verifies end-to-end integration: policy change -> snapshot -> event emitted -> pending claim proposal -> blocked from public query -> admin approval -> published publicly.
- `tests/confidence.test.ts`, `tests/radar.test.ts`, `tests/scoring.test.ts`, `tests/registry.test.ts`: Verify scoring algorithms and registry filters.

---

## 5. Verification Commands

```bash
# Run all tests
npm test

# Run theme & token lint
npm run lint:theme

# Run JSON to Postgres migration
npx tsx scripts/migrate-to-postgres.ts

# Test background jobs locally
npx tsx scripts/jobs/run-job.ts news-ingest
npx tsx scripts/jobs/run-job.ts policy-monitor
npx tsx scripts/jobs/run-job.ts link-check
npx tsx scripts/jobs/run-job.ts freshness
```
