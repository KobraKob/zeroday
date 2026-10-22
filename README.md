# ZeroDay — Archival Record of India's GCC Ecosystem

> **"The independent, citable record of India's GCC ecosystem. Every number traced to a primary statutory source."**

ZeroDay is an evidence-grounded institutional record tracking India's 2,117+ Global Capability Centres (GCCs). Rather than presenting unsourced aggregate claims, ZeroDay models every data point as an immutable claim anchored to a primary public source with a confidence grade (A/B/C/D), retrieved timestamp, verbatim quoted excerpt, and direct URL.

> 📖 **Full System Architecture & Comparison**: See [ZERODAY_OVERVIEW.md](file:///c:/Users/badhu/OneDrive/Desktop/project-hire/testing-me/ZERODAY_OVERVIEW.md) for details on why ZeroDay is 10x better than existing analyst PDFs and directory lists.

---

## What It Does

1. **Reconcile (`/reconcile`)**: Solves the central market riddle: *"Why do reports disagree on how many GCCs India has?"* Compares published benchmark counts (Zinnov-nasscom, AIM Research, GCC Journal, OceanFrogs), visualizes discrepancies by unit type (Parent Company vs Legal Entity vs Campus Unit), and dynamically recomputes our registry tally under each rule.
2. **Registry (`/registry` & `/gcc/[slug]`)**: Searchable, filterable database of 50 verified GCCs (Google, Microsoft, Amazon, Boeing, Bosch, JPMorgan, Goldman Sachs, etc.) with verified Ministry of Corporate Affairs (MCA) Corporate Identification Numbers (CIN), functional mandates, and provenance drawer triggers for every number.
3. **Radar (`/radar`)**: Predictive signal detection tracking high-intent corporate milestones (RoC entity incorporations, GST tax circle registrations, leadership appointments, state MoUs, and commercial lease executions). Uses a 60-day half-life exponential decay model to output a 0–100 likelihood score.
4. **City & State Compare (`/compare`)**: Side-by-side comparison across 9 cities (Bengaluru, Hyderabad, Pune, Chennai, Gurugram, Noida, Mumbai, Coimbatore, Ahmedabad) displaying Grade A rents, vacancy rates, talent salary indices, and official state government subsidies (Karnataka, Tamil Nadu, Telangana, Maharashtra, Gujarat, Uttar Pradesh).
5. **Proof & Providers (`/providers`, `/provider/[slug]`, `/submit`)**: Separates marketed vendor claims from evidenced engagements. Scores providers transparently based on verified public proof links (attestation = 3, lease/filing = 3, press = 2, case study = 1).
6. **Entry Advisor (`/advisor`)**: Interactive guided intake generating a tailored, printable India Entry Briefing grounded purely in verified claims.
7. **Ask Zero AI (`/ask`)**: Grounded question-answering assistant powered by **Groq's `openai/gpt-oss-120b`** and an in-memory TF-IDF semantic vector store; strictly refuses unverified queries without hallucinating.
8. **Admin Review Queue (`/admin/review`)**: Human-in-the-loop review buffer where AI-proposed claims are audited against exact verbatim quotes before promotion to the public registry.

---

## Interactive Design & Components

- **`<GooeyNav />` (from React Bits)**: Fluid WebGL2 physics droplets navbar with custom shaders, dynamic pill transitions, and smooth SPA Next.js routing.
- **`<StarBorder />` (from React Bits)**: Animated canvas perimeter light tracing around the primary "Ask Zero" action button.
- **Cartographer & Ledger Aesthetics**: Fraunces display serif, Newsreader, JetBrains Mono tabular numerals, paper `#F8FAFC` and verdigris `#0F766E` palette, with accessible contrast in both Day Ledger and Obsidian Dark modes.
- **Footnote Margins**: Clicking any superscript number opens a margin audit drawer displaying statutory source details, confidence grade, and verbatim filing quotes.

---

## Architecture & Deployment Setup

### Frontend (Next.js) -> Vercel
- Production Next.js 14 App Router application.
- Configured with `app/api/ask/route.ts` which automatically proxies to the Railway backend if `BACKEND_URL` is set, or executes directly with local fallback.

### Backend (Express + Docker) -> Railway
- Located in `/server/` directory with its own `Dockerfile` and `railway.json`.
- Exposes:
  - `GET /health`: Healthcheck & record counts.
  - `POST /api/ask`: Grounded Groq LLM + vector store answering.
  - `GET /api/claims`, `GET /api/gccs`, `GET /api/cities`: Structured repositories.
  - `GET /api/vector/search`: TF-IDF semantic vector query.

---

## Quickstart & Installation

### Prerequisites
- Node.js 18+ (tested on Node v20/v22/v24)
- npm 10+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Groq API key:
```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
```

### 3. Run Validation & Tests
```bash
# Validate data schemas
npm run validate

# Run unit tests (11 passing tests)
npm test

# Run AI grounding evaluation suite (32/32 passing tests)
npm run evals
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## Neutrality Firewall

Paid commercial tiers may buy verified profile badges, alerts, or buyer introductions. They **never** alter evidence depth scores, radar rankings, inclusion in lists, or search ordering.
