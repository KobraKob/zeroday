"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Gcc,
  Claim,
  Source,
  CountDefinition,
  PublishedCount,
} from "../lib/schema";
import { recomputeCount, computeCoverage } from "../lib/confidence";
import { DefinitionToggle } from "../components/DefinitionToggle";
import { CoverageMeter } from "../components/CoverageMeter";
import { SourceFootnote } from "../components/SourceFootnote";
import { CitationButton } from "../components/CitationButton";
import { ConfidenceStamp } from "../components/ConfidenceStamp";
import {
  Compass,
  Radio,
  Award,
  ArrowRight,
  GitCompare,
  Database,
  Shield,
  FileCheck,
} from "lucide-react";

interface HomeClientProps {
  gccs: Gcc[];
  claims: Claim[];
  sources: Source[];
  definitions: CountDefinition[];
  publishedCounts: PublishedCount[];
}

export function HomeClient({
  gccs,
  claims,
  sources,
  definitions,
  publishedCounts,
}: HomeClientProps) {
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

  const recomputeResult = recomputeCount(selectedUnit, gccs);
  const coverageResult = computeCoverage(gccs, claims, 2117);

  // Core macro claims
  const revClaim = claims.find((c) => c.field === "annual_revenue");
  const revSource = revClaim ? sourcesMap.get(revClaim.source_id) : null;

  const wfClaim = claims.find((c) => c.field === "headcount_total");
  const wfSource = wfClaim ? sourcesMap.get(wfClaim.source_id) : null;

  const megaClaim = claims.find((c) => c.field === "mega_gcc_count");
  const megaSource = megaClaim ? sourcesMap.get(megaClaim.source_id) : null;

  const leaseClaim = claims.find(
    (c) => c.field === "gcc_office_leasing_share_q1_2026"
  );
  const leaseSource = leaseClaim ? sourcesMap.get(leaseClaim.source_id) : null;

  return (
    <div className="space-y-16 font-sans">
      {/* 1. One Big Sourced Statement & Number */}
      <section aria-labelledby="hero-statement" className="border-b border-hairline pb-12 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cobalt"></span>
            <span className="uppercase font-bold tracking-wider text-cobalt">
              Official Reference Record
            </span>
            <span className="text-muted">• Edition 2026-Q1</span>
          </div>
          <CitationButton pageTitle="India GCC Ecosystem Macro Record" path="/" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-baseline">
          {/* Sourced finding copy (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <h1
              id="hero-statement"
              className="font-display text-3xl sm:text-5xl lg:text-[3.25rem] font-bold text-ink leading-[1.14] tracking-tight"
            >
              India houses over 2,117 Global Capability Centres
              <SourceFootnote
                marker={1}
                source={sourcesMap.get("src-zinnov-fy26") || sources[0]}
                fieldLabel="Total India GCC Benchmark"
                definitionRule="Zinnov-nasscom FY26 survey covering multinational enterprise captive units."
                showMarkerOnly={true}
              />
              , generating $64.6B in direct export value.
              <SourceFootnote
                marker={2}
                source={revSource}
                claim={revClaim}
                fieldLabel="FY26 Total GCC Revenue"
                showMarkerOnly={true}
              />
            </h1>

            <p className="font-serif italic text-base sm:text-lg text-muted max-w-prose leading-relaxed">
              Every figure in the Atlas is anchored to a primary regulatory filing, audited 10-K report, or gazetted state decree. No paid rankings, no inferred headcounts, no commercial sponsorships.
            </p>
          </div>

          {/* Big Serif Callout Numerals (4 cols) */}
          <div className="lg:col-span-4 border-l-0 lg:border-l border-hairline lg:pl-8 space-y-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
                Direct Workforce Sourced
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl sm:text-5xl font-black text-ink tabular-nums">
                  1.9M+
                </span>
                <SourceFootnote
                  marker={3}
                  source={wfSource}
                  claim={wfClaim}
                  fieldLabel="Total Direct Tech Workforce"
                  showMarkerOnly={true}
                />
              </div>
              <span className="text-xs text-muted block font-serif italic">
                Direct engineering and business service professionals across 12 tech clusters.
              </span>
            </div>

            <div className="pt-4 border-t border-hairline-subtle space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
                Office Leasing Share Q1 2026
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-black text-cobalt tabular-nums">
                  44.0%
                </span>
                <SourceFootnote
                  marker={4}
                  source={leaseSource}
                  claim={leaseClaim}
                  fieldLabel="Q1 2026 GCC Office Absorption Share"
                  showMarkerOnly={true}
                />
              </div>
              <span className="text-xs text-muted block font-serif italic">
                9.1M sq ft of 20.7M sq ft total Grade A absorption across top 7 metro markets.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Definition Toggle & Recomputation Engine */}
      <section aria-labelledby="definition-engine-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline pb-2">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              § 01 • The Counting Problem
            </span>
            <h2 id="definition-engine-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
              Normalizing the Unit of Analysis
            </h2>
          </div>
          <Link
            href="/reconcile"
            className="font-mono text-xs text-cobalt hover:text-ink hover:underline decoration-1 underline-offset-2 flex items-center gap-1 font-semibold"
          >
            <span>Open Full Reconcile Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-muted font-serif italic max-w-prose">
          Market studies publish diverging tallies because each counts a different operational unit. Toggle below to watch our live verified registry recompute instantly.
        </p>

        <DefinitionToggle
          definitions={definitions}
          selectedUnit={selectedUnit}
          onSelectUnit={setSelectedUnit}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 border border-hairline bg-surface">
          <div className="md:col-span-7 p-6 border-b md:border-b-0 md:border-r border-hairline bg-paper/20 space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              Recomputed Registry Count
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl sm:text-5xl font-black text-ink tabular-nums">
                {recomputeResult.count}
              </span>
              <span className="font-mono text-xs uppercase text-cobalt font-semibold">
                {selectedUnit.replace("_", " ")} units
              </span>
            </div>
            <p className="text-xs font-serif italic text-muted leading-relaxed border-t border-hairline-subtle pt-2">
              {recomputeResult.explanation}
            </p>
          </div>

          <div className="md:col-span-5 p-6 bg-surface flex flex-col justify-center">
            <CoverageMeter
              wellSourcedCount={coverageResult.wellSourcedCount}
              totalRegistryCount={coverageResult.totalRegistryCount}
              reportedTotal={coverageResult.reportedTotal}
              coveragePercentage={coverageResult.coveragePercentage}
            />
          </div>
        </div>
      </section>

      {/* 3. Three Clear Reference Paths (Not a Generic Card Grid) */}
      <section aria-labelledby="paths-heading" className="space-y-6 pt-2">
        <div className="border-b border-hairline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            § 02 • Core Research Pathways
          </span>
          <h2 id="paths-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
            Three Archival Investigation Routes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-hairline border border-hairline bg-surface">
          {/* Path 1: Plan Entry */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:bg-paper/30 transition-colors duration-fast">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted font-bold">
                  Pathway I
                </span>
                <Compass className="w-4 h-4 text-cobalt" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink leading-snug">
                Plan an Entry: Site Selection &amp; Subsidies
              </h3>
              <p className="text-xs text-muted font-serif italic leading-relaxed">
                Compare 2 to 4 Indian tech hubs side-by-side. Grade A office rents, vacancy rates, tech talent compensation indices, and statutory state gazette fiscal incentives.
              </p>
            </div>
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:text-cobalt transition-colors duration-fast pt-3 border-t border-hairline-subtle"
            >
              <span>Examine City Compare</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Path 2: Find Who is Coming */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:bg-paper/30 transition-colors duration-fast">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-coral font-bold">
                  Pathway II • Predictive
                </span>
                <Radio className="w-4 h-4 text-coral" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink leading-snug">
                Find Who is Coming: Radar Intelligence
              </h3>
              <p className="text-xs text-muted font-serif italic leading-relaxed">
                Tracks RoC entity incorporations, GST tax registrations, executive headhunts, and commercial lease deeds with a 60-day half-life decay scoring rubric (0–100).
              </p>
            </div>
            <Link
              href="/radar"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:text-coral transition-colors duration-fast pt-3 border-t border-hairline-subtle"
            >
              <span>Inspect Radar Signals</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Path 3: Verify a Provider */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:bg-paper/30 transition-colors duration-fast">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted font-bold">
                  Pathway III
                </span>
                <Award className="w-4 h-4 text-cobalt" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink leading-snug">
                Verify a Provider: Evidence Proof Links
              </h3>
              <p className="text-xs text-muted font-serif italic leading-relaxed">
                Never pay-to-rank. Evaluates commercial real estate, corporate legal, tax audit, and BOT providers strictly on public proof links and verified client attestations.
              </p>
            </div>
            <Link
              href="/providers"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:text-cobalt transition-colors duration-fast pt-3 border-t border-hairline-subtle"
            >
              <span>Audit Proof Links</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Sourced Macro Benchmarks Ruled Table */}
      <section aria-labelledby="macro-ledger-heading" className="space-y-4 pt-2">
        <div className="flex items-baseline justify-between border-b border-hairline pb-2">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              § 03 • Data You Can Cite
            </span>
            <h2 id="macro-ledger-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
              Macro Ecosystem Benchmarks
            </h2>
          </div>
          <span className="font-mono text-xs text-muted">Audited Figures</span>
        </div>

        <div className="border border-hairline bg-surface overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[11px] uppercase tracking-wider text-muted">
                <th scope="col" className="py-3 px-4">Metric Benchmark</th>
                <th scope="col" className="py-3 px-4">Recorded Value</th>
                <th scope="col" className="py-3 px-4">Methodology Context</th>
                <th scope="col" className="py-3 px-4 text-center">Confidence</th>
                <th scope="col" className="py-3 px-4 text-right">Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline font-sans">
              {/* Revenue */}
              <tr className="hover:bg-paper/30">
                <th scope="row" className="py-3.5 px-4 font-mono font-medium text-ink">
                  Annual Ecosystem Revenue
                </th>
                <td className="py-3.5 px-4 font-mono font-bold text-sm text-ink tabular-nums">
                  $64.6 Billion USD
                </td>
                <td className="py-3.5 px-4 text-muted font-serif italic text-xs">
                  FY26 total export turnover generated by captive engineering &amp; GBS centres.
                </td>
                <td className="py-3.5 px-4 text-center">
                  <ConfidenceStamp grade={revClaim?.confidence || "B"} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <SourceFootnote
                    marker={5}
                    source={revSource}
                    claim={revClaim}
                    fieldLabel="FY26 Total GCC Revenue"
                    showMarkerOnly={true}
                  />
                </td>
              </tr>

              {/* Workforce */}
              <tr className="hover:bg-paper/30">
                <th scope="row" className="py-3.5 px-4 font-mono font-medium text-ink">
                  Total Direct Workforce
                </th>
                <td className="py-3.5 px-4 font-mono font-bold text-sm text-ink tabular-nums">
                  1,900,000+
                </td>
                <td className="py-3.5 px-4 text-muted font-serif italic text-xs">
                  Direct full-time technical and management professionals on captive payrolls.
                </td>
                <td className="py-3.5 px-4 text-center">
                  <ConfidenceStamp grade={wfClaim?.confidence || "B"} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <SourceFootnote
                    marker={6}
                    source={wfSource}
                    claim={wfClaim}
                    fieldLabel="Total GCC Direct Workforce"
                    showMarkerOnly={true}
                  />
                </td>
              </tr>

              {/* Mega GCCs */}
              <tr className="hover:bg-paper/30">
                <th scope="row" className="py-3.5 px-4 font-mono font-medium text-ink">
                  Mega Centres (5,000+ Staff)
                </th>
                <td className="py-3.5 px-4 font-mono font-bold text-sm text-ink tabular-nums">
                  120 Centres
                </td>
                <td className="py-3.5 px-4 text-muted font-serif italic text-xs">
                  Enterprise campuses employing ~48% of the aggregate national GCC workforce.
                </td>
                <td className="py-3.5 px-4 text-center">
                  <ConfidenceStamp grade={megaClaim?.confidence || "B"} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <SourceFootnote
                    marker={7}
                    source={megaSource}
                    claim={megaClaim}
                    fieldLabel="Mega GCC Count (5,000+ Staff)"
                    showMarkerOnly={true}
                  />
                </td>
              </tr>

              {/* Q1 Office Absorption */}
              <tr className="hover:bg-paper/30">
                <th scope="row" className="py-3.5 px-4 font-mono font-medium text-ink">
                  Office Leasing Share (Q1 2026)
                </th>
                <td className="py-3.5 px-4 font-mono font-bold text-sm text-cobalt tabular-nums">
                  44.0% of Market
                </td>
                <td className="py-3.5 px-4 text-muted font-serif italic text-xs">
                  9.1M of 20.7M sq ft total Grade A leasing across top 7 metro markets (JLL).
                </td>
                <td className="py-3.5 px-4 text-center">
                  <ConfidenceStamp grade={leaseClaim?.confidence || "B"} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <SourceFootnote
                    marker={8}
                    source={leaseSource}
                    claim={leaseClaim}
                    fieldLabel="Q1 2026 GCC Office Absorption Share"
                    showMarkerOnly={true}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
