# ZeroDay (Prototype)

> **"The independent, citable record of India's GCC ecosystem. Every number traced to a source."**

ZeroDay is an evidence-backed platform tracking India's 2,000+ Global Capability Centres (GCCs). Rather than presenting unsourced aggregate claims, ZeroDay models every data point as an immutable claim anchored to a primary public source with a confidence grade (A/B/C/D), retrieved timestamp, and direct URL.

---

## What It Does

1. **Reconcile (`/reconcile`)**: Solves the central market riddle: *"Why do reports disagree on how many GCCs India has?"* Compares published benchmark counts (Zinnov-nasscom, AIM Research, GCC Journal, OceanFrogs), visualizes discrepancies by unit type (parent vs legal entity vs centre unit), and dynamically recomputes our registry tally under each rule.
2. **Registry (`/registry` & `/gcc/[slug]`)**: Searchable, filterable database of 50 verified GCCs (Google, Microsoft, Amazon, Boeing, Bosch, JPMorgan, Goldman Sachs, etc.) with verified Ministry of Corporate Affairs (MCA) Corporate Identification Numbers (CIN), functional mandates, and provenance drawer triggers for every number.
3. **Radar (`/radar`)**: Predictive signal detection tracking high-intent corporate milestones (RoC entity incorporations, GST tax circle registrations, leadership appointments, state MoUs, and commercial lease executions). Uses a 60-day half-life exponential decay model to output a 0–100 likelihood score.
4. **City & State Compare (`/compare`)**: Side-by-side comparison across 9 cities (Bengaluru, Hyderabad, Pune, Chennai, Gurugram, Noida, Mumbai, Coimbatore, Ahmedabad) displaying Grade A rents, vacancy rates, talent salary indices, and official state government subsidies (Karnataka, Tamil Nadu, Telangana, Maharashtra, Gujarat, Uttar Pradesh).
5. **Proof & Providers (`/providers`, `/provider/[slug]`, `/submit`)**: Separates marketed vendor claims from evidenced engagements. Scores providers transparently based on verified public proof links (attestation = 3, lease/filing = 3, press = 2, case study = 1).
6. **Entry Advisor (`/advisor`)**: Interactive guided intake generating a tailored, printable India Entry Briefing grounded purely in verified claims.
7. **Ask ZeroDay (`/ask`)**: Grounded question-answering assistant with server-side citation verification; strictly drops or refuses unanswerable or uncited queries.
8. **Admin Review Queue (`/admin/review`)**: Human-in-the-loop review buffer where AI-proposed claims are audited against exact verbatim quotes before promotion to the public registry.

---

## Real vs Demo Data Breakdown

| Dataset | Real Sourced Data | Demo / Prototype Data |
|---|---|---|
| **Published Benchmark Counts** | 100% Real (Zinnov-nasscom FY26, FY24, AIM, GCC Journal, OceanFrogs) | None |
| **Market Claims** | 100% Real ($98.4B rev, 2.36M staff, 88 Mega GCCs, 44% Q1 leasing) | None |
| **GCC Registry (50 Entities)** | 100% Real (Real parent names, Indian entities, MCA CINs, cities, sectors) | Headcounts left null if undisclosed; never guessed |
| **City Rents & Vacancies** | 100% Real (JLL, CBRE, Cushman & Wakefield Q1 2026 reports) | Tier-2 market shares pending primary release |
| **State IT & GCC Policies** | 100% Real (Karnataka 2024-29, Tamil Nadu, Telangana, Maharashtra, Gujarat) | None |
| **Proof Links** | 10 Real links with joint press / SRO lease citations | 2 Flagged `demo: true` links for UI demonstration |
| **Radar Signals** | 22 Real press, MCA, and lease announcements | 2 Flagged `demo: true` signals |

---

## Quickstart & Installation

### Prerequisites
- Node.js 18+ (tested on Node v24.13.0)
- npm 10+

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Data Validation
Validates all JSON files against strict Zod schemas, verifying source URLs, proof link evidence, and referential integrity:
```bash
npm run validate
```

### 3. Run Unit Tests (Vitest)
Executes scoring, radar exponential decay, and count recomputation unit tests:
```bash
npm run test
```

### 4. Run Grounded AI Evaluation Suite
Evaluates 32 test cases (answerable, unanswerable, trick questions, and prompt injection attempts):
```bash
npm run evals
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production
```bash
npm run build
npm start
```

---

## Known Gaps & Production Roadmap

In this prototype, data is stored in validated JSON files behind a repository layer (`/lib/repo/*.ts`). In production, these files will be superseded by continuous statutory ingestion pipelines:
1. **MCA RoC Live Stream:** Automated webhooks listening to Ministry of Corporate Affairs incorporation filings under IT & R&D NIC codes.
2. **State Property Registration (SRO) Deeds:** Ingesting registered commercial office leases to establish verified move-in dates.
3. **EPFO Headcount Filings:** Validating enterprise headcount brackets using Employee Provident Fund compliance records.
4. **State Policy Gazette Monitors:** Automated tracking of government notifications for capital subsidies and power duty waivers.

---

## Neutrality Firewall

Paid commercial tiers may buy verified profile badges, alerts, or buyer introductions. They **never** alter evidence depth scores, radar rankings, inclusion in lists, or search ordering.
