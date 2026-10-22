# BUILD.md: GCC Atlas (prototype)

You are building a working prototype of **GCC Atlas**, the independent, citable record of India's Global Capability Centre (GCC) ecosystem. Read this whole file before writing code. Follow the build order at the end. Ask nothing unless blocked; make reasonable choices and note them in `DECISIONS.md`.

## 1. Product in one paragraph

India has 2,000+ GCCs, but reports disagree on the count, no list shows its working, and newcomers rely on referrals. GCC Atlas is one **evidence graph**: every datapoint is stored as a **claim** with a source, date, definition and confidence grade. On top of it sit four views: **Registry**, **Radar** (who is coming next), **City Compare** (cities, states, incentives), **Proof** (which provider actually worked with which GCC). The centrepiece demo is the **Reconcile** page, which explains why published counts differ and recomputes the count under each definition.

**Positioning line (use in UI copy):** "The independent, citable record of India's GCC ecosystem. Every number traced to a source."

**First user:** a mid-market foreign company planning India entry (India head, CFO, consultant). **First payer (later):** service providers. Money never buys rank or score (neutrality firewall, see section 9).

## 2. Hard rules (do not break)

1. **No fabricated data.** Every record shown in the UI must come from a real public source with a URL, or be flagged `demo: true` and show a visible "Demo data" badge. Unknown values are `null` and render as "Not yet sourced". Never invent headcounts, incentives, rents, salaries, or provider outcomes.
2. **Every displayed fact opens a source drawer** (source name, URL, retrieved date, definition, confidence grade).
3. **No scraping of gated or ToS-restricted sites** (LinkedIn, paywalled reports). Use public government pages, open datasets, press pages, and manual CSV curation. Ingestion scripts are stubs plus CSV importers in this prototype.
4. **Provider scores are never influenced by payment.** Build no paid-ranking feature, not even a placeholder.
5. Mobile-friendly, fast, accessible (keyboard, contrast AA).

## 3. Stack

- Next.js 14+ (App Router), TypeScript strict, Tailwind, shadcn/ui, Recharts. Optional: MapLibre for city map (skip if time is short).
- Data: JSON/CSV files in `/data`, validated with Zod at load, behind a repository layer (`/lib/repo/*.ts`) so Postgres can replace files later without touching pages.
- Search: client-side with `fuse.js` over the registry.
- Deploy target: Vercel. No server database in the prototype.
- Tests: Vitest for scoring, count recompute, and loaders.

## 4. Design direction

Dark navy `#0f1b2d` and warm paper `#f6f3ec`, accents orange `#e8833a` and blue `#2f6fed`. Arial/Helvetica or Inter. Dense, editorial, data-first (think a research terminal for a trade, not a startup landing page). Confidence grades shown as small coloured pills (A green, B blue, C amber, D grey). Every number has a subtle dotted underline that opens the source drawer.

## 5. Data model (Zod schemas in `/lib/schema.ts`)

```ts
Source   { id, name, type: 'government'|'company'|'press'|'report'|'policy'|'attested',
           url, publisher, published_at?, retrieved_at, license_note? }

Claim    { id, subject_type: 'gcc'|'city'|'state'|'provider'|'market',
           subject_id, field, value, unit?, as_of, source_id,
           definition_id?, confidence: 'A'|'B'|'C'|'D', note?, demo?: boolean }

Gcc      { id, slug, name, parent_name, parent_hq_country, india_entity_name?, cin?,
           cities: string[], sector, functions: string[], established_year?,
           headcount_band?: '<500'|'500-1k'|'1k-5k'|'5k+', status: 'operating'|'announced'|'expanding',
           claim_ids: string[] }

City     { id, name, state_id, claim_ids }   // office rent, vacancy, talent cost etc. are claims
State    { id, name, policy: StatePolicy }
StatePolicy { policy_name, period, source_id, incentives: Incentive[], last_checked }
Incentive   { type: 'capex_subsidy'|'opex_subsidy'|'stamp_duty'|'power'|'rent'|'skilling'|'other',
              description, amount_or_rate?, conditions?, source_id }

Provider { id, slug, name, category: 'advisory'|'legal'|'audit'|'real_estate'|'recruitment'|'payroll_eor'|'bot'|'other',
           cities: string[], claim_ids, marketed_claims: string[] }
ProofLink{ id, provider_id, gcc_id, service, year?, evidence: Evidence[], status: 'public'|'attested'|'disputed' }
Evidence { kind: 'press'|'filing'|'lease'|'attestation'|'case_study', source_id, excerpt_summary }

Signal   { id, gcc_id?, company_name, type: SignalType, date, city?, source_id, note }
SignalType = 'incorporation' | 'gst_registration' | 'leadership_hire' | 'hiring_burst'
           | 'state_mou' | 'lease_announced' | 'press_intent' | 'office_inauguration'

CountDefinition { id, label, unit: 'parent_company'|'legal_entity'|'centre_unit',
                  rule_text, includes, excludes }

PublishedCount  { id, publisher, headline_count, unit_claimed, as_of, source_id, note,
                  definition_known: boolean }
```

## 6. Modules and pages

### 6.1 `/reconcile` (build this first and make it excellent)

Title: "Why do reports disagree on how many GCCs India has?"

- Table of **published counts** (seed below), each with publisher, number, unit, year, link, and `definition_known`.
- A bar chart comparing them, with units colour-coded (parent / entity / centre / unknown).
- **Definition toggle** (parent companies, legal entities, centre units). Recompute the count **from our own registry** under each rule and show our count with coverage ("Registry covers N of the reported 2,117; coverage X%"). Be honest that the registry is partial; show coverage, not a claim of completeness.
- Short plain-English explainer: counts differ because of unit (parent vs entity vs centre), inclusion rules (captive vs outsourced, minimum headcount), and date.
- Button: "Cite this page" generating a citation string with date.

**Seed `PublishedCount` rows (real, from public pages; verify and add retrieved_at):**

| Publisher | Count | Unit | As of | Source URL |
|---|---|---|---|---|
| Zinnov-Nasscom India GCC Landscape | 2,117 GCCs (3,728 units) | parent GCCs and centre units | FY26 | https://www.businesstoday.in/amp/technology/news/story/the-big-boom-how-indias-gcc-story-hits-2030-target-4-years-early-530265-2026-05-07 |
| Same report, earlier edition | 1,700+ GCCs (2,975 units), revenue $64.6B | parent GCCs and centre units | FY24 | https://theprint.in/economy/indias-position-as-gcc-capital-of-the-world-nasscom-zinnov-study/2268673/ |
| AIM Research GCC Explorer | ~1,400 | unknown | current | https://reports.aimresearch.co/?p=4006 |
| GCC Journal public directory | 1,700+ in downloadable file | unknown | 2026 | https://gccjournal.in/insights/list-of-global-capability-centers-gcc-in-india/ |
| OceanFrogs | 2,100+ in one page; 2,800+ in another (parent HQ abroad + people in India) | unknown / broader rule | current | https://www.oceanfrogs.com/intel/gcc/ and https://oceanfrogs.com/blogs/gcc-product-modules/ |
| Flexiple statistics page | notes some reports count parents, others centres | n/a (commentary) | Aug 2026 | https://flexiple.com/gcc/statistics |

Also seed **market claims** (grade B, report-sourced): FY26 revenue $98.4B; 2.36M professionals; 88 "Mega GCCs" (5,000+ staff, parent revenue $1B+) are about 5% of centres but employ nearly half the workforce; Q1 2026 India office leasing 20.7M sq ft with GCCs at 44% (9.1M sq ft); over 100 GCCs added or expanded in FY26; North American firms are about two thirds of new setups; GCC pay premium over IT services 15 to 22% (Zinnov, via businessofgcc.com). Sources: freepressjournal.in, communicationstoday.co.in, businessofgcc.com URLs found in research; re-check each before publishing.

### 6.2 `/registry` and `/gcc/[slug]`

- Filterable table: parent, India entity, city, sector, headcount band, status, confidence. Filters: city, sector, parent HQ country, headcount band, status, "has CIN".
- Detail page: all claims grouped (identity, footprint, size, functions), each with source drawer and grade. Timeline of signals. "Providers linked" list from Proof.
- Seed **40 to 80 real GCCs** from public, citable sources (company newsrooms, press releases, state announcements). Required fields: parent, city, source URL. Leave others null. Prefer well-documented centres across Bengaluru, Hyderabad, Pune, Chennai, NCR, Mumbai plus a few tier-2 cities. Do not guess headcounts.
- Registry definition of a GCC (document on `/methodology`): an India-incorporated entity or unit whose primary purpose is captive services for an affiliated non-Indian parent or group.

### 6.3 `/radar` ("who is coming next")

- Feed of `Signal` records, newest first, with filters by signal type, city, date range.
- **Likelihood score per company (0 to 100)** from signals in the last 180 days, with exponential decay (half-life 60 days). Weights: incorporation 30, gst_registration 20, leadership_hire 15, hiring_burst 15, state_mou 20, lease_announced 25, press_intent 10, office_inauguration 35 (this one marks "arrived"). Cap at 100. Show the contributing signals ("why this score").
- Status labels: Rumoured (<30), Likely (30 to 60), Imminent (60+), Arrived.
- Seed with 15 to 30 real, cited signals from press; if fewer can be sourced, add clearly flagged `demo: true` items.
- Email alert signup form (UI only, stores nothing).

### 6.4 `/compare` (cities and states)

- Pick 2 to 4 cities. Columns: GCC concentration (claims), office rent range, vacancy, talent cost indicators, state incentives (from state policy), policy last checked.
- Seed cities: Bengaluru, Hyderabad, Pune, Chennai, Delhi-NCR (Gurugram, Noida), Mumbai, plus 2 tier-2 cities. Known claim to include: Bengaluru has over 900 GCC units, about 34 to 39% of India's market (JLL via flexiple.com/gcc/statistics, grade C until a primary JLL page is found).
- State policy objects: research the official GCC or IT policy documents for Karnataka, Tamil Nadu, Telangana, Maharashtra, Gujarat (incl. GIFT City), Uttar Pradesh, Andhra Pradesh. Fill incentives only from the policy text with the PDF/URL; otherwise leave `null` and show "To be sourced". Never paraphrase amounts from memory.
- Output: side-by-side table, plus a "what is missing" strip so gaps are visible, not hidden.

### 6.5 `/providers` and `/provider/[slug]` (Proof)

- Directory of providers by category with two panels: **Marketed** (what they claim) and **Evidenced** (proof links with evidence kinds).
- **Evidence score** per provider (transparent, shown with formula): `sum over ProofLinks of kind_weight`, weights: attestation by GCC 3, lease or filing 3, press naming both parties 2, case study by provider 1; a link with `status: disputed` counts 0. Show count of distinct GCCs and years. Never show a single "best" rank, show evidence depth.
- Seed 10 to 20 real providers (public company pages) and only ProofLinks that have a real citation (press naming both parties). If none can be sourced, create 5 `demo: true` links and label them clearly.
- `/submit`: attestation form (GCC leader confirms "provider X delivered Y for us"). Stored in memory only for the prototype; show a "Pending verification" state.

### 6.6 `/methodology`

Definition of a GCC, confidence grades (A: government or primary filing; B: company-published or reputable press or named report; C: single secondary source; D: inferred or unverified), source types, update cadence, correction policy ("report an error" form, UI only), neutrality policy (section 9), known gaps.

### 6.7 Home `/`

Hero with the positioning line, a live count card (headline from Reconcile with definition toggle), three entry cards (Plan an entry: Compare; Find who's coming: Radar; Verify a provider: Proof), a "Data you can cite" strip, and a coverage meter ("Registry coverage: N entities with sources").

## 7. Confidence and quality logic (`/lib/confidence.ts`)

- A claim's grade is stored, but also recomputed and flagged if: source older than 24 months (downgrade one level), only one source and type `press` (cap at C), conflicting claims for the same field (show a "Conflict" badge and list both).
- Export `computeCoverage()` (entities with at least 3 sourced fields / reported total) and `recomputeCount(definition)`; unit-test both.

## 8. Repo layout

```
/app            routes per section 6
/components     SourceDrawer, ConfidencePill, ClaimValue, DefinitionToggle, SignalCard, CompareTable
/data           sources.json claims.json gccs.json cities.json states.json providers.json
                proofLinks.json signals.json definitions.json publishedCounts.json
/lib            schema.ts repo/*.ts confidence.ts scoring.ts radar.ts citation.ts
/scripts        import-csv.ts (CSV to JSON with Zod validation), validate-data.ts
DECISIONS.md    README.md
```

`validate-data.ts` must fail the build if any claim lacks `source_id`, any source lacks a URL, any ProofLink lacks evidence, or any `demo` record lacks the flag.

## 9. Neutrality firewall (copy into `/methodology`)

Paid products (later) may buy verified profile slots, alerts and buyer intros. They never alter evidence score, radar score, inclusion in lists, or ordering. Sponsored items, if ever added, are labelled and separated.

## 10. Build order and acceptance criteria

1. **Scaffold + schema + loaders + SourceDrawer.** Acceptance: a claim renders with a working source drawer and grade.
2. **`/reconcile`** with seed counts, chart, definition toggle, coverage meter. Acceptance: toggling the definition changes the recomputed registry count; coverage % is shown; every number has a source.
3. **Registry + GCC detail** with at least 40 sourced entities, search and filters.
4. **Radar** with decay scoring and "why this score".
5. **Compare** with at least 4 cities and at least 3 states with sourced policy objects (gaps visible).
6. **Providers + Proof + submit form.**
7. **Home, methodology, polish, responsive, a11y pass.** `npm run validate` passes; Vitest passes; Lighthouse performance above 90 on `/`.
8. README with run steps and a "what is real vs demo" table.

## 11. Non-goals (do not build)

Auth, payments, a marketplace or RFP flow, live scrapers, LLM chat, paid ranking, user accounts.

## 12. Nice-to-haves if time remains

"Cite this" button on every table; CSV export of the current filtered view (with source columns); a `/changelog` of data updates; a printable one-page "India entry brief" for a chosen city pair.

## 13. Final checklist for the agent

- [ ] Every number is clickable to a source, or visibly marked demo or unsourced.
- [ ] No invented figures anywhere in code, seed data, or copy.
- [ ] Reconcile page works end to end and is the strongest screen.
- [ ] README states known gaps and what real data pipelines would replace (company registry filings, GST registrations, provident fund data, state policy orders, press monitoring, attested submissions).

---

## 14. AI layer (add after section 10 step 6; keep it grounded)

**Principle:** AI is a tool for finding, structuring and explaining evidence. It is never a source. The product promise is "every number traced to a source", so no AI output may show a fact that is not backed by a stored claim. A model answering from its own memory would break the brand.

### 14.1 Back office: AI-assisted data pipeline (human approves)

Build `/scripts/ai/` jobs that read a document (press page, policy PDF, company newsroom page, CSV row) and propose records. Use the Anthropic API server-side (`ANTHROPIC_API_KEY` in env, never in client code). Use a small, cheap model for bulk extraction and a stronger model for hard cases; confirm current model names in the Anthropic docs, do not hardcode from memory. Use structured output (JSON schema or tool use) validated by the Zod schemas in section 5.

Jobs:
1. **Claim extractor:** document in, list of `Claim` proposals out. Each must include `source_id`, the **exact quoted text span** supporting it, and `as_of`. Reject any proposal whose quote does not appear verbatim in the source text (string check in code).
2. **Policy parser:** state policy PDF in, `Incentive[]` out, each with page number and quote. Amounts and rates only if present in the text; otherwise `null`.
3. **Signal detector:** news item in, `Signal` proposals (type, company, city, date), with the quote.
4. **Entity resolver:** match names like "Acme India Pvt Ltd" to existing parent/GCC records; output match, confidence, reason. Below threshold goes to review.
5. **Classifier:** "is this a GCC under our definition?", sector, functions. Output includes a short reason and the quote used.
6. **Conflict finder:** compare claims on the same field, flag disagreements, propose which is better sourced (suggestion only).

**Rules:** AI-proposed claims are stored with `confidence` capped at `C` and `status: 'pending_review'`. Only a human approval (simple `/admin/review` page: accept, edit, reject, with the quote beside the source) promotes them. Log every AI call (input hash, model, output, reviewer decision) in `/data/ai-log.jsonl`. Track reviewer accept rate per job as a quality metric.

### 14.2 User-facing: "Ask Atlas" (grounded Q&A)

`/ask` chat box (also a side panel on every page). Flow:
- The model gets **tools only**: `search_claims(query, filters)`, `get_gcc(id)`, `compare_cities(ids)`, `list_signals(filters)`, `get_provider(id)`, `get_state_policy(id)`, `get_counts(definition)`. All read from the repository layer.
- Answer must be structured: `{ answer_blocks: [{ text, claim_ids: [...] }], follow_ups: [...], gaps: [...] }`.
- **Server-side citation check:** drop or rewrite any block that has no `claim_ids` or whose numbers do not match the cited claims. If nothing survives, return "Atlas does not have sourced data on this yet" plus what is missing. Never fall back to model memory.
- Render each cited claim as the usual source-drawer link. Show confidence pills.
- Rate limit per IP, cap tokens, block prompt injection from document text by treating all retrieved text as data, never instructions.

### 14.3 User-facing: "Entry Advisor" (for confused companies)

`/advisor` guided intake, 6 to 8 questions: parent HQ country, sector, target headcount in 3 years, functions (engineering, finance, ops), budget sensitivity, timeline, talent needs, any city preferences. Output a **briefing**, grounded the same way:
- Shortlist of 2 to 3 cities with reasons (each reason cites claims), and an explicit "what we could not verify".
- Peer GCCs in the registry that look like them (by sector, size, HQ country).
- Incentives that may apply, from the state policy objects, with conditions.
- A setup checklist by stage (entity, location, vendors, hiring) built from templates you write in `/data/checklists.json` (hand-written, cited to official pages where possible, not generated on the fly).
- Providers with evidence in the chosen city and category, ordered by evidence depth, never by payment.
- "Questions to ask any vendor" and a draft of an RFP outline (clearly marked as a draft, no factual claims inside).
Export as printable page. The model only writes connective prose around retrieved claims.

### 14.4 Evals (required before demoing)

Create `/evals/` with at least 30 questions: answerable (answer must match seed claims), unanswerable (must say "no sourced data"), trick questions (conflicting counts, nonexistent GCC, request for a number we do not have), and injection attempts. Run `npm run evals`; target at least 95% pass on citation correctness and 100% refusal on unanswerable. Show the eval pass rate on `/methodology`.

### 14.5 Acceptance for the AI layer

- [ ] Ask Atlas never shows an uncited number (test with 10 adversarial prompts).
- [ ] An AI-extracted claim cannot appear publicly without human approval.
- [ ] Policy parser output for at least 2 states matches the official text on spot-check (store the quote and page).
- [ ] Advisor briefing for 3 sample company profiles renders with citations and a visible "unverified" section.
- [ ] No API key in client bundle; all AI calls via server routes.
