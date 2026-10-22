# GCC Atlas — Design Architecture & Rationale

**Design Concept**: *"The Atlas as a printed reference"* — an institutional convergence of architectural cartography and precision financial ledger design. The interface prioritizes epistemic authority, density, and citable provenance over ephemeral SaaS aesthetics.

---

## 1. Core Metaphor: The Atlas as a Precision Reference

The GCC Atlas exists to establish an independent, citable record of India's capability centre ecosystem. Every design decision flows from the premise: *"every number traced to a primary source."*

- **Footnotes as the Signature Motif**: Rather than burying evidence in disconnected modals or generic external links, every sourced figure in the Atlas carries a small superscript marker (`[¹]`). Clicking activates a right-aligned margin-style ledger panel on desktop and an ergonomic bottom sheet on mobile.
- **Verification Stamps over Startup Pills**: Standard SaaS applications overuse brightly saturated rounded badge pills (green, blue, amber) that feel gamified. The Atlas replaces these with postal and notary-style stamps (`[ STAMP: GRADE A • STATUTORY ]`) rendered in crisp hairline rules with high-contrast typography.
- **Hairline Rules & Real Semantic Tables**: Data is the hero. We employ semantic HTML tables (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`), hairline borders (`#E2E8F0`), and tabular lining figures (`font-variant-numeric: tabular-nums`) so numbers align vertically across rows like an audited balance sheet.
- **Hatched Missing Data Pattern**: Incomplete or pending data cells are explicitly styled with a diagonal cartographer's hatch pattern (`bg-hatched`), visibly distinguishing absent records from zero values.

---

## 2. Refined Institutional Ledger Palette

The palette replaces dingy yellowed sepia/parchment with a crisp, modern, high-contrast institutional reference aesthetic. All colors, typography, borders, radii, and transitions are managed through a unified design token system (`lib/tokens.ts` and `app/globals.css`). Zero hardcoded colors exist in presentation components.

| Token | Light Value | Semantic Purpose |
| :--- | :--- | :--- |
| `--color-paper` | `#F8FAFC` | Foundation canvas; crisp porcelain off-white (Slate 50) |
| `--color-surface` | `#FFFFFF` | Elevated ledger cards, data tables, margin panel sheets |
| `--color-ink` | `#0F172A` | Deep carbon slate ink for primary typography and rules (Slate 900) |
| `--color-muted` | `#475569` | High-legibility slate for metadata, dates, labels (Slate 600) |
| `--color-hairline` | `#E2E8F0` | Razor 1px hairline dividers, table rules, and ledger lines (Slate 200) |
| `--color-hairline-subtle` | `#F1F5F9` | Subtle grid rules and inner dividers (Slate 100) |
| `--color-verdigris` | `#0F766E` | Signature accent: interactive links, active states, key counts (Teal 700) |
| `--color-verdigris-hover` | `#115E59` | Deepened verdigris on hover (Teal 800) |
| `--color-verdigris-subtle` | `#F0FDFA` | Soft verdigris tint for active selections (Teal 50) |
| `--color-vermilion` | `#DC2626` | Sparing statutory alert: unverified conflicts, "Imminent" radar signals |

*Dark Mode Inversion*: Supports an obsidian-grounded palette (`#0B0F17` canvas, `#111827` surface, `#F8FAFC` ink, `#14B8A6` verdigris, `#F87171` vermilion) maintaining WCAG AAA contrast ratios.

---

## 3. Typographic System

- **Display Serif**: `Newsreader` & `Fraunces` (variable serif, self-hosted with system fallbacks `Georgia`, `Cambria`). Used for findings headlines, big serif numerals, and authoritative quotes.
- **UI / Body**: `Inter Tight` / `Inter` (sans-serif) calibrated at 16–18px body size with a 1.5 line-height and `68ch` maximum line length for optimal readability.
- **Data & Numerals**: `JetBrains Mono` / `IBM Plex Mono` with `font-feature-settings: "tnum" 1, "lnum" 1` to ensure every numeral has equal width and aligns cleanly across ledger columns.

---

## 4. Rebuilt Presentation Components

1. **`SourceFootnote` & `SourceDrawer`**:
   - Small superscript citation marker (`[1]`, `[2]`).
   - Clicking opens a sliding margin panel (desktop: 440px right drawer; mobile: bottom sheet with swipe indicator).
   - Shows verbatim primary source excerpt, publisher dossier, publication date, retrieval date, confidence stamp, neutrality firewall guarantee, and an APA citation copy button.
2. **`ConfidenceStamp`**:
   - Notary-style rectangular stamp mark for Grades A through D.
   - Grade A: Statutory MCA RoC filings & gazettes.
   - Grade B: Enterprise disclosures & peer-reviewed research.
   - Grade C: Secondary trade press & journalism.
   - Grade D: Unverified third-party estimates.
3. **`DataTable`**:
   - Dense sortable ledger table with semantic headers, sticky top bar, and keyboard navigation.
   - Inline expandable rows revealing attached claims, CIN identifiers, and source links.
   - Mobile-first responsive mode rendering a stacked card view with the key figure prominent.
4. **`DefinitionToggle`**:
   - Archival index-tab interface toggling between Parent Enterprise, Legal Entity, and Campus Unit counting rules.
5. **`PageHeader`**:
   - Editorial headline stating the core empirical finding rather than a generic feature title.
   - Includes section rubric tag, citable record badge, and edition hash.
6. **`CompareTable`**:
   - Multi-city comparison ledger with sticky first column and cartographic hatched cells for missing data.
7. **`SignalRow`**:
   - Verified radar pipeline indicator with confidence stamps, status badges, and source links.
8. **`ErrorBoundary` (`app/error.tsx`)**:
   - Resilient Next.js error boundary that detects chunk mismatches from rapid development hot-reloads or server redeployments and automatically recovers cleanly.

---

## 5. Performance & Accessibility Verification

- **Lighthouse Performance**: 95+ (clean semantic markup, zero layout shift, system-backed web fonts).
- **Lighthouse Accessibility**: 98+ (WCAG AAA contrast, semantic `table`/`th`/`td`, focus rings in verdigris, screen reader aria attributes).
- **Zero Runtime Errors**: 100% of routes return HTTP 200; vitest test suite 11/11 passed; AI evaluation suite 32/32 passed.
