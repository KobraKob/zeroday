# ZeroDay — Grounded Intelligence Platform & Capability Centre Ledger

ZeroDay is the independent, citable record of India's Global Capability Centre (GCC) ecosystem. Every figure, headcount, and real estate absorption metric is anchored to an immutable primary statutory filing, registered lease deed, or gazetted government order.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    subgraph IngestionSources["Primary Ingestion Sources"]
        RSS["RSS Feeds (data/feeds.json)"]
        StatePolicies["State Policy Portals (data/policy-sources.json)"]
        FilingDocs["Regulatory Filings (MCA CIN, Lease Deeds)"]
    end

    subgraph Jobs["Automated Ingestion Pipeline (Vercel Cron / GitHub Actions)"]
        NewsJob["news-ingest (Daily)\nURL Hash Dedupe + Verbatim AI Extraction"]
        PolicyJob["policy-monitor (Weekly)\nSHA-256 Snapshot Diff + Alerting"]
        LinkJob["link-check (Weekly)\nHEAD/GET Verification + Downgrade"]
        FreshJob["freshness (Daily)\n24mo Staleness & Press Grade Capping"]
    end

    subgraph Postgres["Supabase PostgreSQL (Drizzle ORM)"]
        SourcesTable[("sources")]
        SnapshotsTable[("source_snapshots")]
        ClaimsTable[("claims (Append-Only Ledger)")]
        EventsTable[("events (Changelog Stream)")]
        AILogTable[("ai_log")]
        ReviewDecisions[("review_decisions")]
    end

    subgraph AdminLayer["Editorial Audit (Neutrality Firewall)"]
        AdminQueue["/admin/review\n(Quote beside Source Snapshot)"]
        Decision["Accept / Edit / Reject"]
    end

    subgraph PublicUI["Public Presentation (ISR + On-Demand Revalidation)"]
        Registry["/registry (GCC Directory)"]
        Reconcile["/reconcile (Unit Counts)"]
        Radar["/radar (Signals)"]
        Changelog["/changelog (Event Stream)"]
        Ask["/ask (Grounded Q&A Engine)"]
    end

    RSS --> NewsJob
    StatePolicies --> PolicyJob
    FilingDocs --> Jobs

    NewsJob -->|Pending Proposals| ClaimsTable
    NewsJob --> AILogTable
    PolicyJob --> SnapshotsTable
    PolicyJob -->|On Hash Diff| EventsTable
    LinkJob --> SourcesTable
    FreshJob --> ClaimsTable

    ClaimsTable -->|Pending Claims| AdminQueue
    SnapshotsTable -->|Raw Snapshots| AdminQueue
    AdminQueue --> Decision
    Decision -->|Approve / Supersede| ClaimsTable
    Decision -->|Log Action| ReviewDecisions
    Decision -->|On-Demand Revalidate| PublicUI

    ClaimsTable -->|RLS: status = 'approved'| PublicUI
    EventsTable --> Changelog
```

---

## 📦 Database & Drizzle Schema

ZeroDay uses **Supabase PostgreSQL** with **Drizzle ORM**.
The schema enforces strict append-only semantics for factual claims and Row Level Security (RLS) to ensure that public queries can read only approved records.

### Core Tables
1. **`sources`**: Authoritative registry of primary filings, press, and state gazettes.
2. **`source_snapshots`**: Verbatim document text with cryptographic SHA-256 `content_hash` and `fetched_at` timestamp.
3. **`claims`**: Immutable append-only ledger (`subject_type`, `subject_id`, `field`, `value`, `unit`, `as_of`, `source_id`, `confidence`, `status`, `valid_from`, `valid_to`, `last_checked_at`, `created_by`).
4. **`entities`**: GCCs, cities, states, and service providers.
5. **`signals`**: Expansion, lease, or incorporation events.
6. **`proof_links`**: Evidentiary links connecting providers to GCCs.
7. **`events`**: System changelog stream (new GCCs, changed claims, policy updates, staleness downgrades).
8. **`ai_log`**: Audit log of verbatim AI parser executions.
9. **`review_decisions`**: Human-in-the-loop audit log of accept, edit, and reject actions.
10. **`cron_job_runs`**: Telemetry and idempotency tracking for pipeline executions.

---

## 🧭 Ask Zero — Groq Retrieval-Augmented Generation

Ask Zero uses Groq with request-time retrieval, not fine-tuning. Each question receives the site guide plus relevant approved claims, GCC/city/state records, provider and proof-link listings, published-count definitions, source metadata, signals, and GCC planning checklists.

- Responses distinguish approved claims from provider-marketed statements, proof links, signals, and seeded/demo records.
- Claim citations are restricted to IDs from the retrieved approved context.
- Site navigation and GCC setup questions can use the site guide and curated checklists even when no claim matches.
- Unsupported factual questions fail closed rather than being answered from model memory.
- The same retrieval module is shared by the Next.js Ask API and the standalone backend.

Set these server-side variables in Vercel and the Render service when backend forwarding is enabled:

```bash
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Keep the API key private. Do not expose it with a `NEXT_PUBLIC_` prefix. Confirm `BACKEND_URL` points to the live Render service before enabling backend forwarding.

---

## 🔁 Append-Only Claim Lifecycle

When a claim value changes (e.g., via administrative review or updated regulatory filing):
1. The existing active claim is closed:
   - `valid_to = NOW()`
   - `status = 'superseded'`
2. A new claim is inserted:
   - `valid_from = NOW()`
   - `valid_to = NULL`
   - `status = 'approved'`
3. Complete history remains queryable via `claimsRepo.getHistory(subjectType, subjectId, field)` or direct PostgreSQL query ordered by `valid_from DESC`.
4. Public queries (`claimsRepo.getAll()`) automatically filter out superseded, pending, and rejected claims.

---

## 🚀 How to Run Jobs Locally

You can execute any of the background pipeline jobs locally using `tsx`:

```bash
# 1. Run News Ingestion (RSS fetch, URL dedupe, verbatim AI extraction)
npx tsx scripts/jobs/run-job.ts news-ingest

# 2. Run Policy Monitor (State policy URL fetch, SHA-256 snapshot hashing, diff detection)
npx tsx scripts/jobs/run-job.ts policy-monitor

# 3. Run Link Checker (HEAD/GET probe, dead link detection, confidence downgrade)
npx tsx scripts/jobs/run-job.ts link-check

# 4. Run Freshness Audit (24-month staleness rules, single press Grade C capping)
npx tsx scripts/jobs/run-job.ts freshness
```

---

## ➕ How to Add a New Source or Feed

### Adding an RSS Feed
Add a new feed entry to `data/feeds.json`:

```json
{
  "id": "feed-custom-source",
  "name": "Custom Technology Bulletin",
  "url": "https://example.com/rss/gcc-news.xml",
  "category": "press",
  "enabled": true
}
```

### Adding a State Policy Monitor
Add a new policy entry to `data/policy-sources.json`:

```json
{
  "id": "policy-ap-gcc-2026",
  "state_id": "state-ap",
  "state_name": "Andhra Pradesh",
  "policy_name": "Andhra Pradesh Capability Centre Framework",
  "url": "https://it.ap.gov.in/policies/gcc-framework",
  "publisher": "Information Technology Department, Government of Andhra Pradesh",
  "check_interval": "weekly",
  "enabled": true
}
```

### Adding a Primary Source Document
Insert into `data/sources.json` or through the administrative portal:

```json
{
  "id": "src-roc-ka-2026-091",
  "name": "Ministry of Corporate Affairs RoC Bangalore Filing",
  "type": "government",
  "url": "https://www.mca.gov.in/mcafoportal/companyLLPMasterData.do",
  "publisher": "Ministry of Corporate Affairs",
  "published_at": "2026-02-14",
  "retrieved_at": "2026-10-23"
}
```

---

## 🛡️ Security & Robots.txt Compliance

1. **Polite Fetcher**: Strictly respects `robots.txt` Disallow directives.
2. **Contact User-Agent**: Every request sends:
   ```
   User-Agent: ZeroDay-Bot/1.0 (+https://zeroday.in/bot; contact@zeroday.in)
   ```
3. **Domain Rate Limiting**: Enforces a minimum 1000ms delay between consecutive requests to the same origin.
4. **No Gated Scraping**: Strictly prohibits and blocks crawling of LinkedIn, Facebook, Glassdoor, and other gated or login-wall platforms.
5. **Row Level Security (RLS)**: Public client database tokens are restricted to `status = 'approved'` claims.

---

## 🚀 Render Backend Deployment

The standalone Ask API is defined by the root `render.yaml` Blueprint. It builds `server/Dockerfile`, serves `/api/ask`, and exposes `/health` for health checks.

1. In Render, create a **Blueprint** from this repository after the deployment PR is merged. Review the service definition before deploying.
2. Enter `GROQ_API_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` as secret environment variables in Render. Do not commit their values. The Blueprint defaults to the Free web-service plan to avoid silently creating paid infrastructure.
3. Wait until the service is live and `https://<render-service-host>/health` reports healthy.
4. In the Vercel project settings, set the **server-only** environment variable `BACKEND_URL` to the Render service URL, then redeploy the frontend. Do not set `NEXT_PUBLIC_BACKEND_URL`; the backend URL should not be exposed as a client environment variable.
5. Smoke-test `GET /health`, a site-help question such as “How do I get started?”, and a claim-backed GCC question. Confirm citations and source links before routing users to the new backend.

Decommission the old Railway deployment only after the Render health check and Ask smoke tests pass. Removing a Railway URL from source code does not delete the hosted service or its data.

## 🧪 Testing & Verification

Run the full Vitest suite:

```bash
npm test
```

The test suite validates:
- `tests/claim-supersession.test.ts`: Append-only closure of old rows and insertion of new approved rows.
- `tests/hash-change-detection.test.ts`: SHA-256 diffing and change detection.
- `tests/staleness.test.ts`: 24-month staleness downgrade and press capping rules.
- `tests/pipeline-integration.test.ts`: End-to-end integration proving policy updates create events and pending claims, and remain invisible publicly until human-in-the-loop review approves them.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run migration script
npx tsx scripts/migrate-to-postgres.ts

# Start Next.js local server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the dark-mode ZeroDay platform.
Visit [http://localhost:3000/admin/review](http://localhost:3000/admin/review) for the human-in-the-loop review queue.
Visit [http://localhost:3000/changelog](http://localhost:3000/changelog) for the live public event stream.
