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
import { DefinitionToggle } from "../../components/DefinitionToggle";
import { CoverageMeter } from "../../components/CoverageMeter";
import { PageHeader } from "../../components/PageHeader";
import { SourceFootnote } from "../../components/SourceFootnote";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import {
  FileText,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
} from "lucide-react";

interface ReconcileClientProps {
  publishedCounts: PublishedCount[];
  definitions: CountDefinition[];
  gccs: Gcc[];
  claims: Claim[];
  sources: Source[];
}

// Single-run number count-up hook respecting prefers-reduced-motion
function useCountUp(target: number, duration = 650) {
  const [val, setVal] = useState(target);

  useEffect(() => {
    // Check if user prefers reduced motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }

    let start = 0;
    const startTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
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

  const claimsMap = useMemo(() => {
    const map = new Map<string, Claim>();
    claims.forEach((c) => map.set(c.id, c));
    return map;
  }, [claims]);

  // Compute recomputed count from our registry
  const recomputeResult = recomputeCount(selectedUnit, gccs);

  // Compute coverage against the benchmark 2,117
  const coverageResult = computeCoverage(gccs, claims, 2117);

  // Animate the big serif count
  const animatedCount = useCountUp(recomputeResult.count, 700);

  // Maximum published count for proportional bar scaling
  const maxPublished = useMemo(() => {
    return Math.max(...publishedCounts.map((p) => p.count_value || 0), 3000);
  }, [publishedCounts]);

  const benchmarkTotal =
    selectedUnit === "centre_unit" ? 3728 : selectedUnit === "legal_entity" ? 2500 : 2117;

  return (
    <div className="space-y-12 font-sans">
      {/* Editorial Header */}
      <PageHeader
        rubric="Audited Discrepancy Reconciliation"
        findingHeadline="Why published counts of India's GCCs diverge from 1,400 to 2,975"
        findingDescription="Major industry reports disagree not because of faulty counting, but because each survey measures an unstated, distinct unit of analysis: the global parent corporation, the incorporated Indian MCA legal entity, or the multi-city campus operating unit."
        pageTitle="GCC Atlas — Discrepancy Reconciliation"
        path="/reconcile"
        metadata="2026 Revision"
      />

      {/* Showpiece: Dynamic Unit Recomputation & Ledger Metric Banner */}
      <section aria-labelledby="recompute-heading" className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-hairline pb-2">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              § 01 • Dynamic Unit Normalization Engine
            </span>
            <h2 id="recompute-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
              Recalculate the Ecosystem by Counting Unit
            </h2>
          </div>
          <span className="font-mono text-xs text-muted">
            Rule-Based Audit
          </span>
        </div>

        {/* Prominent Definition Toggle */}
        <DefinitionToggle
          definitions={definitions}
          selectedUnit={selectedUnit}
          onSelectUnit={setSelectedUnit}
        />

        {/* Big Serif Numerals & Metric Ledger Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-hairline bg-surface">
          {/* Main Recomputed Numerals (8 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-hairline flex flex-col justify-between space-y-4 bg-paper/20">
            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold block">
                Audited Count in Verified Registry
              </span>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl sm:text-6xl font-black text-ink tabular-nums tracking-tight">
                  {animatedCount}
                </span>
                <span className="font-mono text-xs uppercase text-verdigris font-semibold">
                  {selectedUnit === "parent_company"
                    ? "Parent Corporations"
                    : selectedUnit === "legal_entity"
                    ? "MCA Legal Entities"
                    : "Physical Campuses"}
                </span>
              </div>
            </div>

            <p className="font-serif italic text-sm text-ink/90 leading-relaxed border-t border-hairline-subtle pt-3">
              {recomputeResult.explanation}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-hairline-subtle text-xs font-mono">
              <div>
                <span className="text-muted block text-[10px] uppercase">
                  Published Benchmark
                </span>
                <span className="font-bold text-ink text-sm tabular-nums">
                  {benchmarkTotal.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted block">
                  (Zinnov-nasscom FY26)
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">
                  Sample Multiplier
                </span>
                <span className="font-bold text-verdigris text-sm tabular-nums">
                  {selectedUnit === "centre_unit"
                    ? "1.78x per entity"
                    : selectedUnit === "legal_entity"
                    ? "1.22x per parent"
                    : "1.00x baseline"}
                </span>
                <span className="text-[10px] text-muted block">
                  Cluster Expansion Factor
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Evidence Completeness & Methodology Disclosures (5 Cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-surface">
            <CoverageMeter
              wellSourcedCount={coverageResult.wellSourcedCount}
              totalRegistryCount={coverageResult.totalRegistryCount}
              reportedTotal={coverageResult.reportedTotal}
              coveragePercentage={coverageResult.coveragePercentage}
            />

            <div className="p-3.5 border border-hairline bg-paper/40 space-y-2 text-xs">
              <div className="font-mono uppercase font-bold text-ink text-[10px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-verdigris" strokeWidth={1.5} />
                <span>Citable Finding</span>
              </div>
              <p className="font-serif italic text-muted text-xs leading-relaxed">
                When two market studies report 1,580 and 2,975 GCCs in India respectively, they are not in empirical conflict: the first isolates foreign parent enterprises with standalone entities, while the second enumerates distinct multi-city campus leases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showpiece: Horizontal Ruled Table with Proportional Bars */}
      <section aria-labelledby="benchmark-table-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline pb-2">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              § 02 • Sourced Benchmark Ledger
            </span>
            <h2 id="benchmark-table-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
              Horizontal Comparison of Published Counts
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-verdigris inline-block"></span> Proportional Count Scale (0 – {maxPublished.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Ruled Table with Proportional Bars */}
        <div className="border border-hairline bg-surface overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <caption className="sr-only">
              Comparison of published India GCC counts from major industry research bodies
            </caption>
            <thead>
              <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[11px] uppercase tracking-wider text-muted">
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
            <tbody className="divide-y divide-hairline">
              {publishedCounts.map((row, idx) => {
                const source = sourcesMap.get(row.source_id);
                const countVal = row.count_value || 0;
                const barPct = Math.min(100, Math.max(4, (countVal / maxPublished) * 100));

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-paper/40 transition-colors duration-fast"
                  >
                    {/* Publisher & Report Name */}
                    <td className="py-3.5 px-4 font-serif text-ink">
                      <div className="font-bold text-sm text-ink font-sans">
                        {row.publisher}
                      </div>
                      <div className="text-[11px] text-muted italic font-serif line-clamp-1 mt-0.5">
                        {row.note}
                      </div>
                    </td>

                    {/* Proportional Bar + Numerical Tally */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between font-mono">
                          <span className="font-bold text-sm text-ink tabular-nums">
                            {row.headline_count}
                          </span>
                          <span className="text-[10px] text-muted">
                            {Math.round(barPct)}% of max
                          </span>
                        </div>
                        {/* Ruled proportional bar */}
                        <div className="w-full h-2 bg-paper border border-hairline overflow-hidden">
                          <div
                            className="h-full bg-verdigris transition-all duration-slow ease-ledger"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Claimed Unit */}
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-ink px-1.5 py-0.5 border border-hairline bg-paper/60 inline-block">
                        {row.unit_claimed}
                      </span>
                    </td>

                    {/* As Of Date */}
                    <td className="py-3.5 px-3 font-mono text-muted text-xs tabular-nums">
                      {row.as_of}
                    </td>

                    {/* Definition Rigor */}
                    <td className="py-3.5 px-3 font-mono text-xs">
                      {row.definition_known ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-verdigris font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Explicit Rule</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                          <HelpCircle className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                          <span>Unstated</span>
                        </span>
                      )}
                    </td>

                    {/* Primary Source Footnote */}
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
      </section>

      {/* Discrepancy Taxonomy: The Four Reasons Counts Diverge */}
      <section aria-labelledby="taxonomy-heading" className="space-y-4 pt-4">
        <div className="border-b border-hairline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            § 03 • Structural Causation Taxonomy
          </span>
          <h2 id="taxonomy-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
            Four Factors Dictating Count Discrepancies
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-hairline bg-surface space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-verdigris">Factor 01</span>
              <span className="text-[10px] uppercase text-muted">Unit Ambiguity</span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Parent vs Entity vs Campus
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Counting multi-campus enterprises (e.g. JPMorgan or Google operating in BLR, HYD, MUM) as 1 parent enterprise vs 3 distinct regional campus operations.
            </p>
          </div>

          <div className="p-4 border border-hairline bg-surface space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-verdigris">Factor 02</span>
              <span className="text-[10px] uppercase text-muted">Thresholds</span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Minimum Scale Criteria
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Rigorous economic studies require a minimum 250 headcount and captive IP generation, whereas real estate reports count liaison offices with &lt;20 staff.
            </p>
          </div>

          <div className="p-4 border border-hairline bg-surface space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-verdigris">Factor 03</span>
              <span className="text-[10px] uppercase text-muted">Model Conflation</span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Captive vs Dedicated ODC
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Commercial broker datasets frequently mix pure wholly-owned captives with third-party vendor offshore delivery centres (ODCs) operated by IT contractors.
            </p>
          </div>

          <div className="p-4 border border-hairline bg-surface space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-verdigris">Factor 04</span>
              <span className="text-[10px] uppercase text-muted">Temporal Lag</span>
            </div>
            <h3 className="font-bold text-ink text-sm font-sans">
              Incorporation vs Commercial Launch
            </h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Statutory RoC corporate incorporation precedes commercial office fit-out and press announcements by 12 to 24 months, skewing annual benchmarks.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
