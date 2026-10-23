"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PublishedCount,
  CountDefinition,
  Gcc,
  Claim,
  Source,
} from "../../lib/schema";
import { recomputeCount, computeCoverage } from "../../lib/confidence";
import { SourceFootnote } from "../../components/SourceFootnote";
import {
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Shield,
  Clock,
  BookOpen,
} from "lucide-react";

interface ReconcileClientProps {
  publishedCounts: PublishedCount[];
  definitions: CountDefinition[];
  gccs: Gcc[];
  claims: Claim[];
  sources: Source[];
}

// Single-run number count-up hook respecting prefers-reduced-motion
function useCountUp(target: number, duration = 600) {
  const [val, setVal] = useState(target);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVal(target);
      return;
    }

    const startTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return val;
}

export function ReconcileClient({
  publishedCounts,
  definitions,
  gccs,
  claims,
  sources,
}: ReconcileClientProps) {
  const [selectedUnit, setSelectedUnit] = useState<
    "parent_company" | "legal_entity" | "centre_unit"
  >("parent_company");
  const [selectedCity, setSelectedCity] = useState("Bengaluru");
  const [selectedPublisher, setSelectedPublisher] = useState<string | null>(null);
  const [publisherQuery, setPublisherQuery] = useState("");

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const cityPoints = [
    { name: "Delhi NCR", x: 275, y: 70, tone: "coral" },
    { name: "Mumbai", x: 190, y: 150, tone: "cobalt" },
    { name: "Pune", x: 205, y: 172, tone: "cobalt" },
    { name: "Hyderabad", x: 260, y: 185, tone: "mint" },
    { name: "Chennai", x: 282, y: 235, tone: "coral" },
    { name: "Bengaluru", x: 230, y: 220, tone: "mint" },
    { name: "Kochi", x: 208, y: 268, tone: "cobalt" },
    { name: "Kolkata", x: 350, y: 135, tone: "coral" },
  ] as const;
  const matchesCity = (gcc: Gcc, cityName: string) => gcc.cities.some((city) => {
    const normalised = city.toLowerCase();
    return cityName === "Delhi NCR"
      ? /delhi|gurugram|gurgaon|noida/i.test(normalised)
      : normalised.includes(cityName.toLowerCase());
  });
  const cityStats = useMemo(() => cityPoints.map((point) => ({
    ...point, count: gccs.filter((gcc) => matchesCity(gcc, point.name)).length,
  })), [gccs]);
  const selectedCityStats = cityStats.find((city) => city.name === selectedCity) || cityStats[5];
  const cityGccs = useMemo(() => gccs.filter((gcc) => matchesCity(gcc, selectedCity)), [gccs, selectedCity]);
  const sectorStats = useMemo(() => {
    const counts = new Map<string, number>();
    cityGccs.forEach((gcc) => counts.set(gcc.sector || "Unclassified", (counts.get(gcc.sector || "Unclassified") || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [cityGccs]);
  const visibleNumericRows = useMemo(() => numericRows.filter((row) =>
    row.publisher.toLowerCase().includes(publisherQuery.toLowerCase()) ||
    row.headline_count.toLowerCase().includes(publisherQuery.toLowerCase())
  ), [numericRows, publisherQuery]);
  const selectedPublisherRow = numericRows.find((row) => row.id === selectedPublisher) || numericRows[0];
  const chartMax = Math.max(1, ...numericRows.map((row) => row.count_value || 0));

  // Separate concrete numeric published reports from commentary meta-reviews (Requirement 4)
  const { numericRows, commentaryRows } = useMemo(() => {
    const numeric: PublishedCount[] = [];
    const commentary: PublishedCount[] = [];

    publishedCounts.forEach((p) => {
      // Flexiple or items without direct numeric counts are treated as commentary
      if (
        p.id === "pub-flexiple-stats" ||
        !p.count_value ||
        p.headline_count.toLowerCase().includes("review") ||
        p.headline_count.toLowerCase().includes("meta")
      ) {
        commentary.push(p);
      } else {
        numeric.push(p);
      }
    });

    return { numericRows: numeric, commentaryRows: commentary };
  }, [publishedCounts]);

  // Dynamic calculation of headline and finding values (Requirement 1)
  const minPublished = useMemo(() => {
    if (numericRows.length === 0) return 1400;
    return Math.min(...numericRows.map((r) => r.count_value || 0));
  }, [numericRows]);

  const maxPublished = useMemo(() => {
    if (numericRows.length === 0) return 2975;
    return Math.max(...numericRows.map((r) => r.count_value || 0));
  }, [numericRows]);

  // Compute coverage against baseline benchmark
  const coverageResult = useMemo(() => {
    return computeCoverage(gccs, claims, 2117);
  }, [gccs, claims]);

  // Recomputed counts under each definition rule for the 3 side-by-side cards (Requirement 9)
  const parentRecompute = useMemo(
    () => recomputeCount("parent_company", gccs),
    [gccs]
  );
  const entityRecompute = useMemo(
    () => recomputeCount("legal_entity", gccs),
    [gccs]
  );
  const campusRecompute = useMemo(
    () => recomputeCount("centre_unit", gccs),
    [gccs]
  );

  const activeRecompute =
    selectedUnit === "parent_company"
      ? parentRecompute
      : selectedUnit === "legal_entity"
      ? entityRecompute
      : campusRecompute;

  const animatedCount = useCountUp(activeRecompute.count, 650);

  // Range strip axis bounds
  const axisMin = 1000;
  const axisMax = 3000;

  // Helper for bar and dot colors by unit type (Requirement 5)
  const getUnitColorClasses = (unitType?: string) => {
    switch (unitType) {
      case "parent_company":
        return {
          bar: "bg-coral",
          dot: "bg-coral border-surface text-coral",
          badge: "text-coral border-coral/40 bg-coral/10 font-bold",
          label: "Parent Company",
        };
      case "legal_entity":
        return {
          bar: "bg-marigold",
          dot: "bg-marigold border-surface text-marigold",
          badge: "text-ink border-marigold/60 bg-marigold/20 font-bold",
          label: "Legal Entity",
        };
      case "centre_unit":
        return {
          bar: "bg-mint",
          dot: "bg-mint border-surface text-mint",
          badge: "text-ink border-mint/60 bg-mint/20 font-bold",
          label: "Centre Unit",
        };
      default:
        return {
          bar: "bg-hatched border-2 border-ink",
          dot: "bg-paper border-2 border-ink text-muted",
          badge: "text-muted border-2 border-ink bg-paper/60",
          label: "Unstated Unit",
        };
    }
  };

  return (
    <div className="atlas-home atlas-reconcile space-y-10 md:space-y-14 font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* =========================================================================
          HERO SECTION: Plain-English headline + 2-line explainer + Range-strip chart (Requirement 8)
          ========================================================================= */}
      <section id="hero" aria-labelledby="hero-heading" className="atlas-reconcile-hero">
        <div className="atlas-reconcile-hero-grid">
          <div className="atlas-reconcile-copy">
            <div className="atlas-eyebrow">
              <span className="atlas-live-dot" aria-hidden="true" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-mint">ZeroDay / Reconciliation engine</span>
              <span className="atlas-edition">Evidence workspace</span>
            </div>
            <h1 id="hero-heading" className="atlas-hero-title">One market. <span className="atlas-title-accent">Different counting rules.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">Explore how published India GCC totals diverge, switch counting definitions, and trace the evidence behind every benchmark.</p>
            <div className="atlas-reconcile-proof">
              <span><Shield size={15} className="text-mint" /> Evidence-linked comparisons</span>
              <span><Layers size={15} className="text-coral" /> Three counting definitions</span>
              <span><BookOpen size={15} className="text-cobalt" /> Source-traceable reports</span>
            </div>
          </div>
          <div className="atlas-reconcile-hero-metrics">
            <div className="atlas-reconcile-kpi atlas-reconcile-kpi--cobalt"><span>Published numeric benchmarks</span><strong>{numericRows.length}</strong><small>Direct count values</small></div>
            <div className="atlas-reconcile-kpi atlas-reconcile-kpi--mint"><span>Registry enterprises</span><strong>{gccs.length.toLocaleString()}</strong><small>Current page dataset</small></div>
            <div className="atlas-reconcile-kpi atlas-reconcile-kpi--coral"><span>Range between reports</span><strong>{minPublished.toLocaleString()}–{maxPublished.toLocaleString()}</strong><small>Published counts, not a verified market total</small></div>
            <div className="atlas-reconcile-kpi atlas-reconcile-kpi--gold"><span>Well-sourced records</span><strong>{coverageResult.wellSourcedCount.toLocaleString()}</strong><small>3+ statutory filings</small></div>
          </div>
        </div>
        <div className="atlas-reconcile-workspace">
          <div className="atlas-map-panel atlas-reconcile-map-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="atlas-section-kicker"><MapPin size={14} /> Registry footprint</div><h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">Where the registry clusters</h2><p className="mt-1 text-sm text-muted">Select a city node. Counts and sector mix update from the supplied registry records.</p></div>
              <span className="atlas-map-badge">SCHEMATIC / NOT TO SCALE</span>
            </div>
            <div className="atlas-map-stage">
              <svg className="atlas-network h-[260px] w-full sm:h-[300px]" viewBox="80 20 330 280" role="group" aria-label="Interactive schematic map of Indian GCC clusters">
                <path className="atlas-map-land" d="M214 22 L250 34 L282 56 L306 77 L328 92 L349 112 L338 140 L315 157 L308 188 L292 216 L280 245 L258 275 L236 294 L218 267 L202 235 L180 214 L157 198 L140 169 L145 143 L154 118 L170 91 L187 65 Z" />
                <path className="atlas-map-internal" d="M214 22 L230 100 L260 185 L230 220 L258 275 M154 118 L205 172 L260 185 L315 157 L349 112 M145 143 L230 220 L282 235 L292 216 M187 65 L275 70 L315 157" />
                <path className="atlas-map-route atlas-route-trace" d="M190 150 Q220 160 205 172 T260 185 T230 220 T282 235" />
                {cityStats.map((point) => {
                  const active = selectedCity === point.name;
                  const radius = active ? 8 : Math.max(4, Math.min(7, 3.5 + point.count / 10));
                  return <g key={point.name} role="button" tabIndex={0} aria-label={"Select " + point.name + ", " + point.count + " registry records"} aria-pressed={active}
                    onClick={() => setSelectedCity(point.name)}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedCity(point.name); } }}
                    className={"atlas-city-node atlas-city-node--" + point.tone + (active ? " is-active" : "")}>
                    {active && <circle cx={point.x} cy={point.y} r="19" className="atlas-city-pulse" />}
                    <circle cx={point.x} cy={point.y} r={radius + 4} className="atlas-city-halo" />
                    <circle cx={point.x} cy={point.y} r={radius} className="atlas-city-core" />
                    <text x={point.x + 11} y={point.y - 9} className="atlas-map-label" fontSize="10" fontWeight={active ? "700" : "500"}>{point.name}</text>
                    {active && <text x={point.x + 11} y={point.y + 5} className="atlas-map-sub-label" fontSize="10">{point.count} records</text>}
                  </g>;
                })}
              </svg>
            </div>
            <div className="atlas-map-footer">
              <div><span className="atlas-reconcile-overline">Selected cluster</span><h3 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{selectedCity}</h3><p className="mt-1 text-sm text-muted">{selectedCityStats?.count ?? 0} matching registry records</p></div>
              <div className="atlas-reconcile-city-pills">
                {cityStats.map((city) => <button key={city.name} type="button" onClick={() => setSelectedCity(city.name)} aria-pressed={selectedCity === city.name} className={"atlas-city-pill" + (selectedCity === city.name ? " is-active" : "")}><span>{city.name}</span><strong>{city.count}</strong></button>)}
              </div>
            </div>
          </div>
          <div className="atlas-insight-panel atlas-reconcile-sector-panel rounded-[1.4rem] border p-6 sm:p-7">
            <div className="atlas-section-kicker"><Activity size={14} /> Cluster intelligence</div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">Sector composition</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Ranked by matching registry records in {selectedCity}. Select another city to recompute.</p>
            <div className="atlas-reconcile-sector-total"><strong>{cityGccs.length}</strong><span>records in selected cluster</span></div>
            {sectorStats.length ? <div className="mt-5 space-y-5">{sectorStats.map(([sector, count], index) => <div key={sector} className="atlas-sector-row"><div className="mb-2 flex items-center justify-between gap-3"><span className="font-semibold text-ink">{sector}</span><span className="font-mono text-xs text-muted">{count} · {Math.round((count / Math.max(1, cityGccs.length)) * 100)}%</span></div><div className="atlas-chart-track h-3 overflow-hidden rounded-full"><div className={"atlas-chart-fill atlas-chart-fill--" + (index % 4)} style={{ width: ((count / Math.max(1, cityGccs.length)) * 100) + "%" }} /></div></div>)}</div> : <div className="atlas-empty-state mt-5">No matching records for this city in the current registry dataset.</div>}
            <div className="atlas-callout mt-6 flex items-start gap-3 rounded-xl border p-4"><Activity size={17} className="mt-0.5 shrink-0 text-mint" /><p className="text-sm leading-6 text-muted">This is a city-tagged registry view, not a complete estimate of the city market. Multi-city companies may appear in more than one cluster.</p></div>
          </div>
        </div>
        <div className="atlas-reconcile-benchmark-panel atlas-benchmark-panel rounded-[1.4rem] border p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="atlas-section-kicker"><ChartNoAxesCombined size={14} /> Benchmark comparison</div><h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">Published counts, side by side</h2><p className="mt-1 text-sm text-muted">Choose a publisher to inspect its unit definition and source.</p></div>
            <label className="atlas-reconcile-search"><span className="sr-only">Filter publishers</span><Search size={15} aria-hidden="true" /><input value={publisherQuery} onChange={(event) => setPublisherQuery(event.target.value)} placeholder="Filter publishers…" /></label>
          </div>
          <div className="atlas-reconcile-benchmark-grid">
            <div className="atlas-reconcile-benchmark-bars">
              {visibleNumericRows.map((row, index) => {
                const active = selectedPublisher === row.id || (!selectedPublisher && index === 0);
                const count = row.count_value || 0;
                return <button type="button" key={row.id} onClick={() => setSelectedPublisher(row.id)} aria-pressed={active} className={"atlas-reconcile-benchmark-row" + (active ? " is-active" : "")}>
                  <span className="atlas-reconcile-benchmark-meta"><strong>{row.publisher}</strong><small>{row.unit_claimed || getUnitColorClasses(row.unit_type).label}</small></span>
                  <span className="atlas-chart-track atlas-reconcile-benchmark-track"><span className={"atlas-chart-fill atlas-chart-fill--" + (index % 4)} style={{ width: Math.max(3, (count / chartMax) * 100) + "%" }} /></span>
                  <strong className="atlas-reconcile-benchmark-value">{count.toLocaleString()}</strong>
                </button>;
              })}
              {!visibleNumericRows.length && <div className="atlas-empty-state">No published benchmark matches that filter.</div>}
            </div>
            {selectedPublisherRow && <div className="atlas-reconcile-source-detail"><span className="atlas-reconcile-overline">Selected evidence record</span><h3 className="mt-2 font-display text-xl font-bold text-ink">{selectedPublisherRow.publisher}</h3><p className="mt-2 text-sm leading-6 text-muted">{selectedPublisherRow.note}</p>
              <dl className="atlas-reconcile-detail-list"><div><dt>Reported count</dt><dd>{selectedPublisherRow.headline_count}</dd></div><div><dt>Claimed unit</dt><dd>{getUnitColorClasses(selectedPublisherRow.unit_type).label}</dd></div><div><dt>As of</dt><dd>{selectedPublisherRow.as_of}</dd></div><div><dt>Definition</dt><dd>{selectedPublisherRow.definition_known ? "Explicitly stated" : "Not stated"}</dd></div></dl>
              {sourcesMap.get(selectedPublisherRow.source_id) && <SourceFootnote marker={numericRows.findIndex((row) => row.id === selectedPublisherRow.id) + 1} source={sourcesMap.get(selectedPublisherRow.source_id)!} fieldLabel={selectedPublisherRow.publisher + " — Reported GCC Count"} definitionRule={selectedPublisherRow.note} />}
            </div>}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: Why the numbers differ (Three side-by-side result cards, Requirement 9, 10, 11)
          ========================================================================= */}
      <section
        id="why-numbers-differ"
        aria-labelledby="why-heading"
        className="atlas-reconcile-section scroll-mt-24 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b-2 border-ink pb-3">
          <div>
            <h2
              id="why-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-ink"
            >
              Why the numbers differ
            </h2>
            <p className="font-body text-base text-muted mt-1">
              Selecting a counting rule harmonizes published figures into an
              empirically verifiable baseline.
            </p>
          </div>
          <span className="font-mono text-xs text-muted">
            Click any definition to recompute
          </span>
        </div>

        {/* Three Side-by-Side Result Cards with smooth pill animation & selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Parent Companies */}
          <button
            type="button"
            onClick={() => setSelectedUnit("parent_company")}
            className={`text-left p-5 border-2 transition-all duration-normal flex flex-col justify-between space-y-3 rounded-xs relative cursor-pointer ${
              selectedUnit === "parent_company"
                ? "border-coral bg-surface shadow-[3px_3px_0px_var(--color-ink)]"
                : "border-ink bg-surface/50 hover:bg-surface"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted font-bold">
                  Rule 01
                </span>
                {selectedUnit === "parent_company" && (
                  <span className="font-mono text-xs uppercase font-bold text-coral px-2 py-0.5 border border-coral/40 bg-coral/10 rounded-full">
                    Active Rule
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-lg text-ink">
                Parent Companies
              </h3>
              <p className="font-body text-sm text-muted leading-relaxed">
                Distinct multinational parent corporations having one or more
                captive centres in India.
              </p>
            </div>

            <div className="pt-3 border-t border-rule-subtle grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-muted block text-xs uppercase">
                  Registry Count
                </span>
                <span className="font-bold text-ink text-base tabular-nums">
                  {parentRecompute.count}
                </span>
              </div>
              <div>
                <span className="text-muted block text-xs uppercase">
                  Benchmark Est.
                </span>
                <span className="font-bold text-coral text-base tabular-nums">
                  ~1,430
                </span>
              </div>
            </div>
          </button>

          {/* Card 2: Legal Entities */}
          <button
            type="button"
            onClick={() => setSelectedUnit("legal_entity")}
            className={`text-left p-5 border-2 transition-all duration-normal flex flex-col justify-between space-y-3 rounded-xs relative cursor-pointer ${
              selectedUnit === "legal_entity"
                ? "border-marigold bg-surface shadow-[3px_3px_0px_var(--color-ink)]"
                : "border-ink bg-surface/50 hover:bg-surface"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted font-bold">
                  Rule 02
                </span>
                {selectedUnit === "legal_entity" && (
                  <span className="font-mono text-xs uppercase font-bold text-ink px-2 py-0.5 border border-marigold/60 bg-marigold/20 rounded-full">
                    Active Rule
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-lg text-ink">
                Legal Entities
              </h3>
              <p className="font-body text-sm text-muted leading-relaxed">
                Corporate entities incorporated in India under the Companies Act
                with unique Corporate Identification Numbers (CIN).
              </p>
            </div>

            <div className="pt-3 border-t border-rule-subtle grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-muted block text-xs uppercase">
                  Registry Count
                </span>
                <span className="font-bold text-ink text-base tabular-nums">
                  {entityRecompute.count}
                </span>
              </div>
              <div>
                <span className="text-muted block text-xs uppercase">
                  Benchmark Est.
                </span>
                <span className="font-bold text-marigold text-base tabular-nums">
                  ~1,920
                </span>
              </div>
            </div>
          </button>

          {/* Card 3: Centre Units (Campuses) */}
          <button
            type="button"
            onClick={() => setSelectedUnit("centre_unit")}
            className={`text-left p-5 border-2 transition-all duration-normal flex flex-col justify-between space-y-3 rounded-xs relative cursor-pointer ${
              selectedUnit === "centre_unit"
                ? "border-mint bg-surface shadow-[3px_3px_0px_var(--color-ink)]"
                : "border-ink bg-surface/50 hover:bg-surface"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted font-bold">
                  Rule 03
                </span>
                {selectedUnit === "centre_unit" && (
                  <span className="font-mono text-xs uppercase font-bold text-ink px-2 py-0.5 border border-mint/60 bg-mint/20 rounded-full">
                    Active Rule
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-lg text-ink">
                Operational Centre Units
              </h3>
              <p className="font-body text-sm text-muted leading-relaxed">
                Physical operational campuses or distinct municipal city
                footprints established by a GCC entity.
              </p>
            </div>

            <div className="pt-3 border-t border-rule-subtle grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-muted block text-xs uppercase">
                  Registry Count
                </span>
                <span className="font-bold text-ink text-base tabular-nums">
                  {campusRecompute.count}
                </span>
              </div>
              <div>
                <span className="text-muted block text-xs uppercase">
                  Benchmark Est.
                </span>
                <span className="font-bold text-mint text-base tabular-nums">
                  2,117 – 3,728
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* One Citable Sentence & Audit Details (Requirement 9 & 3) */}
        <div className="p-4 border-2 border-ink bg-surface rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="font-body text-ink/90 text-sm">
            &ldquo;{gccs.length} parent companies sourced;{" "}
            {coverageResult.wellSourcedCount} have 3+ statutory filings.&rdquo;
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted flex-shrink-0">
            <span>Reviewed: May 2026</span>
            <span>•</span>
            <span>Edition: May 2026</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: Compare the published counts (Ruled table + proportional bars, Requirement 4, 5, 10)
          ========================================================================= */}
      <section
        id="compare-counts"
        aria-labelledby="compare-heading"
        className="atlas-reconcile-section scroll-mt-24 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b-2 border-ink pb-3">
          <div>
            <h2
              id="compare-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-ink"
            >
              Compare the published counts
            </h2>
            <p className="font-body text-sm text-muted mt-1">
              Side-by-side audit of major research publications reporting India&apos;s
              GCC totals.
            </p>
          </div>

          {/* Unit Legend (Requirement 5) */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-coral inline-block rounded-2xs" />
              <span>Parent Company</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-marigold inline-block rounded-2xs" />
              <span>Legal Entity</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-mint inline-block rounded-2xs" />
              <span>Centre Unit</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-hatched border border-ink inline-block rounded-2xs" />
              <span>Unstated</span>
            </span>
          </div>
        </div>

        {/* Desktop Table View (>=640px) */}
        <div className="hidden sm:block border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_var(--color-ink)] overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <caption className="sr-only">
              Comparison of published India GCC counts from major industry research bodies
            </caption>
            <thead>
              <tr className="border-b-2 border-ink bg-paper font-mono text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="py-3 px-4 min-w-[220px]">
                  Publisher &amp; Survey
                </th>
                <th scope="col" className="py-3 px-4 min-w-[260px]">
                  Reported Count &amp; Proportional Scale
                </th>
                <th scope="col" className="py-3 px-3 min-w-[130px]">
                  Claimed Unit
                </th>
                <th scope="col" className="py-3 px-3 min-w-[110px]">
                  As Of Date
                </th>
                <th scope="col" className="py-3 px-3 min-w-[130px]">
                  Rule Definition
                </th>
                <th scope="col" className="py-3 px-3 text-right min-w-[80px]">
                  Footnote
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink/10">
              {numericRows.map((row, idx) => {
                const source = sourcesMap.get(row.source_id);
                const countVal = row.count_value || 0;
                const barPct = Math.min(
                  100,
                  Math.max(6, (countVal / maxPublished) * 100)
                );
                const colors = getUnitColorClasses(row.unit_type);

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-paper/40 transition-colors duration-fast"
                  >
                    {/* Publisher */}
                    <td className="py-3.5 px-4 text-ink">
                      <div className="font-bold text-sm text-ink font-display">
                        {row.publisher}
                      </div>
                      <div className="text-xs text-muted font-body line-clamp-1 mt-0.5">
                        {row.note}
                      </div>
                    </td>

                    {/* Proportional Bar coloured by unit (Requirement 5) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between font-mono">
                          <span className="font-bold text-sm text-ink tabular-nums">
                            {row.headline_count}
                          </span>
                          <span className="text-xs text-muted">
                            {Math.round(barPct)}% of max
                          </span>
                        </div>
                        {/* Bar */}
                        <div className="w-full h-3 bg-paper border border-ink overflow-hidden rounded-xs">
                          <div
                            className={`h-full transition-all duration-slow ease-ledger ${
                              row.unit_type === "unknown"
                                ? "bg-hatched"
                                : colors.bar
                            }`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Claimed Unit Badge */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-mono text-xs uppercase tracking-wider px-2 py-0.5 border rounded-xs inline-block ${colors.badge}`}
                      >
                        {colors.label}
                      </span>
                    </td>

                    {/* As of */}
                    <td className="py-3.5 px-3 font-mono text-muted text-xs tabular-nums">
                      {row.as_of}
                    </td>

                    {/* Rule Definition Known */}
                    <td className="py-3.5 px-3 font-mono text-xs">
                      {row.definition_known ? (
                        <span className="inline-flex items-center gap-1 text-xs text-cobalt font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Explicit Rule</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <HelpCircle className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                          <span>Unstated</span>
                        </span>
                      )}
                    </td>

                    {/* Sourced Footnote */}
                    <td className="py-3.5 px-3 text-right">
                      {source ? (
                        <SourceFootnote
                          marker={idx + 1}
                          source={source}
                          fieldLabel={`${row.publisher} — Reported GCC Count`}
                          definitionRule={row.note}
                          showMarkerOnly={true}
                        />
                      ) : (
                        <span className="text-muted font-mono text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (<640px, Requirement 14) */}
        <div className="sm:hidden space-y-3">
          {numericRows.map((row, idx) => {
            const source = sourcesMap.get(row.source_id);
            const countVal = row.count_value || 0;
            const barPct = Math.min(
              100,
              Math.max(6, (countVal / maxPublished) * 100)
            );
            const colors = getUnitColorClasses(row.unit_type);

            return (
              <div
                key={row.id}
                className="p-4 border border-hairline bg-surface space-y-3 rounded-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-ink">{row.publisher}</h3>
                    <span className="text-[11px] font-mono text-muted">
                      As of {row.as_of}
                    </span>
                  </div>
                  {source && (
                    <SourceFootnote
                      marker={idx + 1}
                      source={source}
                      fieldLabel={`${row.publisher} — Reported Count`}
                      definitionRule={row.note}
                      showMarkerOnly={true}
                    />
                  )}
                </div>

                {/* Bar */}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="font-bold text-base text-ink tabular-nums">
                      {row.headline_count}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.2 border rounded-2xs ${colors.badge}`}
                    >
                      {colors.label}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-paper border border-hairline overflow-hidden rounded-2xs">
                    <div
                      className={`h-full ${
                        row.unit_type === "unknown"
                          ? "bg-hatched"
                          : colors.bar
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted font-serif italic border-t border-hairline-subtle pt-2">
                  {row.note}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: Four reasons counts differ (Rewritten without unsourced figures, labelled Editorial, Requirement 2, 10)
          ========================================================================= */}
      <section
        id="four-reasons"
        aria-labelledby="reasons-heading"
        className="scroll-mt-24 space-y-4"
      >
        <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
          <div>
            <h2
              id="reasons-heading"
              className="font-serif text-2xl sm:text-3xl font-bold text-ink"
            >
              Four reasons counts differ
            </h2>
            <p className="font-sans text-sm text-muted mt-1">
              Structural drivers that explain variance across analyst reports.
            </p>
          </div>
          <span className="font-mono text-xs text-muted uppercase">
            Editorial Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Factor 1 */}
          <div className="p-4 border border-hairline bg-surface space-y-2 rounded-xs">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-cobalt">Factor 01</span>
              <span className="text-[10px] uppercase px-1 border border-hairline bg-paper/60 text-muted rounded-2xs">
                Editorial
              </span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Parent Enterprise vs Regional Campus
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Multi-campus enterprises operating across multiple cities are
              enumerated by some researchers as a single parent corporation,
              whereas commercial real estate reports count each municipal facility
              as an independent unit.
            </p>
          </div>

          {/* Factor 2 */}
          <div className="p-4 border border-hairline bg-surface space-y-2 rounded-xs">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-cobalt">Factor 02</span>
              <span className="text-[10px] uppercase px-1 border border-hairline bg-paper/60 text-muted rounded-2xs">
                Editorial
              </span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Captive Scale Thresholds
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Institutional economic studies filter for substantial enterprise
              captives with verified intellectual property generation, while
              commercial real estate lists frequently include small representative
              liaison offices.
            </p>
          </div>

          {/* Factor 3 */}
          <div className="p-4 border border-hairline bg-surface space-y-2 rounded-xs">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-cobalt">Factor 03</span>
              <span className="text-[10px] uppercase px-1 border border-hairline bg-paper/60 text-muted rounded-2xs">
                Editorial
              </span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Captive vs Dedicated Vendor ODC
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Broker surveys often conflate pure wholly-owned captive capability
              centres with third-party offshore dedicated centres (ODCs) managed
              by commercial IT staffing contractors.
            </p>
          </div>

          {/* Factor 4 */}
          <div className="p-4 border border-hairline bg-surface space-y-2 rounded-xs">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-cobalt">Factor 04</span>
              <span className="text-[10px] uppercase px-1 border border-hairline bg-paper/60 text-muted rounded-2xs">
                Editorial
              </span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Statutory Incorporation vs Office Fit-Out
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Ministry of Corporate Affairs incorporation filings precede
              commercial lease execution and public facility inaugurations by
              several quarters, creating systematic timing divergence between
              fiscal year benchmarks.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: Commentary & Meta-Analyses (Requirement 4)
          ========================================================================= */}
      {commentaryRows.length > 0 && (
        <section
          id="commentary"
          aria-labelledby="commentary-heading"
          className="scroll-mt-24 space-y-4 pt-2"
        >
          <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
            <h2
              id="commentary-heading"
              className="font-serif text-xl sm:text-2xl font-bold text-ink"
            >
              Publisher Commentary &amp; Meta-Analyses
            </h2>
            <span className="font-mono text-xs text-muted">
              Non-Numeric Reviews
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commentaryRows.map((item) => {
              const source = sourcesMap.get(item.source_id);
              return (
                <div
                  key={item.id}
                  className="p-5 border border-hairline bg-surface rounded-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-base text-ink">
                        {item.publisher}
                      </h3>
                      <span className="font-mono text-xs text-muted">
                        As of {item.as_of} • {item.unit_claimed}
                      </span>
                    </div>
                    {source && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-cobalt hover:underline min-h-[32px] px-2 py-1 border border-hairline bg-paper/50 rounded-xs"
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <p className="font-sans text-sm text-ink/80 leading-relaxed border-t border-hairline-subtle pt-2">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
