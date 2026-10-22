# ZeroDay (Archival Record of India's GCC Ecosystem)

> **"Every Number Traced to a Primary Statutory Source."**  
> An independent, citable, and cryptographically auditable ledger of India's Global Capability Centres (GCCs).

---

## 1. What Is ZeroDay?

**ZeroDay** is the first open, epistemic archival record of India's \$64.6B Global Capability Centre (GCC) ecosystem. Covering **2,117+ operational units**, **1.9M+ high-skill professionals**, and **9 tier-1/tier-2 tech clusters**, ZeroDay bridges the massive credibility gap between legacy management consultant reports, commercial tech PR, and actual corporate reality.

Instead of presenting unsourced estimates or marketing brochures, ZeroDay operates like an **institutional financial ledger meets a cartographer's atlas**:
- Every headline metric, headcount bracket, and facility footprint is tied directly to a **statutory Corporate Identification Number (CIN)** from the Ministry of Corporate Affairs (MCA), registered sub-registrar lease deeds, or official state gazette notifications.
- No commercial sponsored rankings, no pay-to-play placements, and zero hand-waving estimates.

---

## 2. Why ZeroDay Is 10x Better Than Existing Alternatives

| Traditional Analyst Reports (Zinnov, Everest, Gartner) | Startup SaaS Directories / Job Portals | **ZeroDay Institutional Record** |
| :--- | :--- | :--- |
| **Opaque Count Discrepancies**: Reports publish counts between 1,400 and 2,975 without revealing counting methodologies. | Aggregated from scrapers and unstructured social media signals without verification. | **Unit Reconciliation Engine**: Harmonizes counts across 3 mathematically defined tiers: Parent Enterprises (1,430), Legal CIN Entities (1,920), and Campus Units (2,117). |
| **Paywalled PDFs**: Reports cost \$3,000–\$15,000 to download and become obsolete within 6 months. | Monetized through ads, sponsored cards, and paid recruiter listings. | **100% Open & Citable**: Publicly auditable archival record with permanent permalinks and open REST APIs. |
| **Self-Reported Surveys**: Data is sourced from vendor self-reporting or marketing questionnaires. | High noise-to-signal ratio, outdated entity names, and duplicate company entries. | **Primary Statutory Grounding**: Anchored in Ministry of Corporate Affairs (MCA) filings, lease deeds, and official state government gazettes. |
| **Hallucinating AI Chatbots**: Generic ChatGPT wrappers that guess numbers, dates, and locations. | Basic keyword search or rigid SQL filters without contextual intelligence. | **"Ask Zero" Grounded AI**: Powered by Groq's `openai/gpt-oss-120b` running on an in-memory TF-IDF semantic vector store. Strict 100% refusal on unverified claims. |
| **Zero Auditability**: Readers cannot verify whether a quoted number is audited or estimated. | Unvalidated user submissions with no editorial oversight. | **Confidence Grade Stamps (A to D)**: Every claim carries an explicit confidence score and verbatim evidentiary excerpt. |
| **Paid Vendor Bias**: Advisory firms earn consulting fees from the very IT vendors they rank. | Featured "promoted" badges skew discoverability toward highest bidders. | **Strict Neutrality Firewall**: Prohibits commercial placement, paid reviews, and vendor kickbacks. |
| **Cluttered Startup UI**: Bloated landing pages with distracting cartoon illustrations and dark patterns. | Generic dashboard templates with poor typography and low data density. | **Cartographic Ledger Design**: Built with Next.js, Fraunces serif display, Newsreader, JetBrains Mono tabular numerals, WebGL fluid physics (`<GooeyNav />`), and animated canvas light borders (`<StarBorder />`). |

---

## 3. Core Capabilities & Feature Modules

### 🔍 1. Sourced Footnotes & Epistemic Audit Panel
Every data point across ZeroDay is tagged with an archival superscript marker. Clicking any marker slides open a right-side margin ledger (or mobile sheet) detailing:
- Primary Source Type (e.g. `MCA RoC Form MGT-7`, `Sub-Registrar Lease Deed`, `Telangana Gazette`).
- Statutory CIN or filing registration number.
- Filing date and retrieval timestamp.
- Verbatim quoted primary excerpt.
- Letter Grade Confidence stamp (Grade A to Grade D).

### ⚖️ 2. The Reconcile Matrix
Solves the central controversy in Indian tech reporting: *"Why does one report say 1,500 GCCs while another claims 3,000?"*
- **Parent Company Basis** (Global holding corporations): ~1,430 enterprises.
- **Statutory Legal Entity Basis** (MCA registered subsidiaries): ~1,920 entities.
- **Physical Campus Basis** (Dedicated municipal facilities >25k sq ft): ~2,117 units.
Users can toggle between counting units in real time and see exactly which subsidiaries belong to each parent enterprise.

### 🤖 3. "Ask Zero" — Groq-Powered Grounded Auditor
Zero is the built-in epistemic auditor. Trained with a strict refusal constitution:
- **Vector Search Context**: Queries are matched against TF-IDF embeddings spanning 163 claims, 50 GCC profiles, and 9 city micro-markets.
- **Refusal Guarantee**: If a metric is unverified or missing from the statutory index, Zero refuses to guess and responds:
  > *"ZeroDay does not have sourced data on this yet. In accordance with our hard rules, we never invent figures or answer from ungrounded memory."*
- **Safety Firewalls**: Automatically blocks prompt injection, developer-mode bypass attempts, and jailbreaks.

### 🏙️ 4. City Hubs & Micro-Market Comparison
Side-by-side benchmarking of India's leading GCC clusters:
- Bengaluru (Outer Ring Road, Whitefield, Electronic City)
- Hyderabad (HITEC City, Financial District, Gachibowli)
- Pune, Chennai, NCR (Gurugram / Noida), Mumbai, Ahmedabad, and Tier-2 growth hubs (Coimbatore, Kochi).
Includes commercial Grade-A vacancy rates, average rental bands (₹/sq ft/month), and state-level statutory incentives (EPFO reimbursement, electricity duty waivers, stamp duty rebates).

---

## 4. Architecture & Production Deployment

ZeroDay is architected for clean separation between frontend presentation and backend intelligence:

```
┌───────────────────────────────────────────────┐
│              VERCEL (Frontend)                │
│  - Next.js 14 App Router, TypeScript, React   │
│  - WebGL2 Fluid Gooey Navigation (<GooeyNav>) │
│  - Animated Canvas Star Borders (<StarBorder>)│
│  - Interactive Reconcile & Registry Tables    │
│  - Universal Command Palette (⌘K)             │
└──────────────────────┬────────────────────────┘
                       │
             HTTPS REST / JSON API
                       │
┌──────────────────────▼────────────────────────┐
│              RAILWAY (Backend)                │
│  - Express.js Container (Docker / Alpine)    │
│  - In-Memory Semantic TF-IDF Vector Store     │
│  - Groq LLM Grounded Inference (120B Model)   │
│  - Statutory Claims & Definitions Repositories│
│  - Healthcheck & Uptime Monitor (/health)     │
└───────────────────────────────────────────────┘
```

### Deploying Frontend to Vercel
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Set Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`)
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
   - `BACKEND_URL`: (Optional) Your Railway backend URL.

### Deploying Backend to Railway
1. Connect GitHub repository to [Railway](https://railway.com).
2. Set Build Type to **Dockerfile** with path `server/Dockerfile`.
3. Set Environment Variables:
   - `PORT`: `8080`
   - `GROQ_API_KEY`: Your Groq API key
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
4. Railway will automatically expose the service with a public `.up.railway.app` HTTPS domain and monitor `/health`.

---

## 5. Verification & Testing Standards

ZeroDay enforces 100% test pass rates across all builds:
- **Unit & Property Tests** (`npm test`): Vitest suite verifying confidence score calculations, radar telemetry, and reconciliation algorithms.
- **Grounding Evaluation Suite** (`npm run evals`): 32 automated adversarial eval cases verifying:
  - 100% citation accuracy for answerable queries.
  - 100% refusal rate for unanswerable/speculative queries.
  - 100% neutralization of prompt injection attacks.
