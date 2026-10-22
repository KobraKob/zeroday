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

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

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
    <div className="space-y-12 font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* =========================================================================
          HERO SECTION: Plain-English headline + 2-line explainer + Range-strip chart (Requirement 8)
          ========================================================================= */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="scroll-mt-24 border-b-2 border-ink pb-10 pt-2"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Plain-English headline + 2-line explainer */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-cobalt" />
              <span>Reconciliation Ledger • Edition: May 2026</span>
            </div>

            <h1
              id="hero-heading"
              className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-ink leading-tight tracking-tight"
            >
              Why India&apos;s GCC counts vary between{" "}
              <span className="text-cobalt tabular-nums">
                {minPublished.toLocaleString()}
              </span>{" "}
              and{" "}
              <span className="text-cobalt tabular-nums">
                {maxPublished.toLocaleString()}
              </span>
            </h1>

            <p className="font-body text-base text-muted leading-relaxed">
              Major industry reports disagree because each survey measures an
              unstated, different unit: the global parent corporation, the
              incorporated Indian legal entity, or the multi-city campus operating
              unit.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-muted border-t border-rule-subtle">
              <span>{numericRows.length} publisher benchmarks reconciled</span>
              <span>•</span>
              <span>{gccs.length} parent enterprises in verified registry</span>
              <span>•</span>
              <span className="text-cobalt font-semibold">Reviewed: May 2026</span>
            </div>
          </div>

          {/* Right Column: Range-Strip Chart (One horizontal axis, one dot per publisher, coloured by unit) */}
          <div className="lg:col-span-6 p-5 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_var(--color-ink)] space-y-5">
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Published Counts Range Strip
              </span>
              <span className="font-mono text-xs text-muted">
                Axis: {axisMin.toLocaleString()} – {axisMax.toLocaleString()}
              </span>
            </div>

            {/* Horizontal Axis Chart */}
            <div className="pt-8 pb-10 px-4 relative">
              {/* Main Axis Line */}
              <div className="w-full h-0.5 bg-hairline relative">
                {/* Tick marks */}
                {[1000, 1500, 2000, 2500, 3000].map((tick) => {
                  const leftPct = ((tick - axisMin) / (axisMax - axisMin)) * 100;
                  return (
                    <div
                      key={tick}
                      className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                      style={{ left: `${leftPct}%` }}
                    >
                      <div className="w-0.5 h-2 bg-hairline" />
                      <span className="font-mono text-[10px] text-muted mt-1 tabular-nums">
                        {tick.toLocaleString()}
                      </span>
                    </div>
                  );
                })}

                {/* Publisher Dots */}
                {numericRows.map((row, idx) => {
                  const val = row.count_value || 0;
                  const leftPct = Math.min(
                    98,
                    Math.max(2, ((val - axisMin) / (axisMax - axisMin)) * 100)
                  );
                  const isTop = idx % 2 === 0;
                  const colors = getUnitColorClasses(row.unit_type);

                  // Short publisher label
                  const shortName = row.publisher.includes("Zinnov")
                    ? row.publisher.includes("2025/26")
                      ? "Zinnov FY26"
                      : "Zinnov FY24"
                    : row.publisher.includes("AIM")
                    ? "AIM Research"
                    : row.publisher.includes("Journal")
                    ? "GCC Journal"
                    : "OceanFrogs";

                  return (
                    <div
                      key={row.id}
                      className="absolute top-0 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                      style={{ left: `${leftPct}%` }}
                    >
                      {/* Label above or below to avoid visual collision */}
                      {isTop ? (
                        <div className="absolute bottom-4 flex flex-col items-center whitespace-nowrap pointer-events-none">
                          <span className="font-mono font-bold text-xs text-ink tabular-nums bg-surface px-1 border border-hairline rounded-2xs shadow-2xs">
                            {val.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-muted font-sans font-medium">
                            {shortName}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute top-4 flex flex-col items-center whitespace-nowrap pointer-events-none">
                          <span className="text-[10px] text-muted font-sans font-medium">
                            {shortName}
                          </span>
                          <span className="font-mono font-bold text-xs text-ink tabular-nums bg-surface px-1 border border-hairline rounded-2xs shadow-2xs">
                            {val.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Dot */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 -translate-y-1/2 transition-transform duration-fast group-hover:scale-125 ${
                          row.unit_type === "unknown"
                            ? "bg-paper border-muted"
                            : colors.bar
                        }`}
                        title={`${row.publisher}: ${row.headline_count}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strip Chart Legend */}
            <div className="pt-2 border-t-2 border-ink flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-coral inline-block rounded-2xs" />
                <span>Parent Company</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-marigold inline-block rounded-2xs" />
                <span>Legal Entity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-mint inline-block rounded-2xs" />
                <span>Centre Unit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-hatched border border-ink inline-block rounded-2xs" />
                <span>Unstated Unit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: Why the numbers differ (Three side-by-side result cards, Requirement 9, 10, 11)
          ========================================================================= */}
      <section
        id="why-numbers-differ"
        aria-labelledby="why-heading"
        className="scroll-mt-24 space-y-6"
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
        className="scroll-mt-24 space-y-4"
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
