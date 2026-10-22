# Architecture & Implementation Decisions — ZeroDay

This document records architectural, algorithmic, and data modeling decisions made during the construction of the ZeroDay prototype.

---

### 1. Repository Pattern Behind Static JSON Files
- **Decision:** All pages and API endpoints query `/lib/repo/*.ts` rather than reading raw JSON directly.
- **Rationale:** Section 3 of `build.md` mandates that Postgres or any remote database can replace static files without modifying page components or server actions.

### 2. Client-Side Fuse.js Fuzzy Search in Registry
- **Decision:** Filterable table in `/registry` uses Fuse.js with a threshold of 0.35 over `name`, `parent_name`, `sector`, `cities`, `functions`, and `india_entity_name`.
- **Rationale:** Provides instantaneous client-side search over 50+ records without requiring server database rounds.

### 3. Reconcile Recomputation Algorithm
- **Decision:** Implemented `recomputeCount()` in `/lib/confidence.ts` across three explicit units:
  - `parent_company`: Counts distinct multinational corporate groups (`parent_name`).
  - `legal_entity`: Counts distinct Indian incorporated subsidiaries (`cin` or `india_entity_name`).
  - `centre_unit`: Counts distinct operational municipal city footprint locations (parent $\times$ city presence).
- **Rationale:** Explains why industry reports differ: reports that count campuses report 3,700+ units, while reports that count parent groups benchmark 2,117.

### 4. Exponential Decay for Radar Signals
- **Decision:** Likelihood scoring formula:
  $$\text{score} = \min\left(100, \sum \text{base\_weight} \times 0.5^{(\text{age\_days} / 60)}\right)$$
  Window capped at 180 days; signals older than 180 days contribute 0. An `office_inauguration` immediately promotes status to "Arrived".
- **Rationale:** Conforms directly to Section 6.3 with transparent mathematical breakdown.

### 5. Provider Evidence Scoring Formula
- **Decision:** Score computed as $\sum \text{kind\_weight}$ across active ProofLinks:
  - Attestation by GCC: 3 points
  - Statutory Lease or Regulatory Filing: 3 points
  - Joint Press Naming Both Parties: 2 points
  - Case Study by Provider: 1 point
  - Disputed Link: 0 points
- **Rationale:** Strictly enforces the neutrality firewall. Paid products never influence evidence depth or ordering.

### 6. Grounded AI Evaluation & Citations
- **Decision:** Created 32 eval cases in `/evals/eval-dataset.json` covering answerable queries, unanswerable queries, trick questions, and prompt injection attempts.
- **Rationale:** Enforces Section 14.4 requirement: target at least 95% citation accuracy on answerable questions and 100% refusal rate on unanswerable/trick questions.
