"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Gcc, Claim, Source, CountDefinition, PublishedCount } from "../lib/schema";
import { recomputeCount, computeCoverage } from "../lib/confidence";
import { DefinitionToggle } from "../components/DefinitionToggle";
import { SourceFootnote } from "../components/SourceFootnote";
import { CitationButton } from "../components/CitationButton";
import { ConfidenceStamp } from "../components/ConfidenceStamp";
import { ArrowUpRight, ArrowRight, MapPin, RadioTower, Scale, FileCheck2, ShieldCheck, Database, ChartNoAxesCombined } from "lucide-react";

interface HomeClientProps {
  gccs: Gcc[];
  claims: Claim[];
  sources: Source[];
  definitions: CountDefinition[];
  publishedCounts: PublishedCount[];
}

const pathways = [
  { number: "A", title: "Choose where to build", description: "Compare office costs, talent depth, vacancy and state incentives across India's technology hubs.", href: "/compare", action: "Compare cities", icon: MapPin, tone: "blue" },
  { number: "B", title: "Spot expansion signals", description: "Follow public filings, registrations, leadership moves and leasing signals before they become headlines.", href: "/radar", action: "Explore radar", icon: RadioTower, tone: "orange" },
  { number: "C", title: "Verify a provider", description: "Inspect the evidence behind a service provider's claims. Commercial placement never changes the score.", href: "/providers", action: "Review evidence", icon: ShieldCheck, tone: "green" },
];

export function HomeClient({ gccs, claims, sources, definitions }: HomeClientProps) {
  const [selectedUnit, setSelectedUnit] = useState<"parent_company" | "legal_entity" | "centre_unit">("parent_company");
  const sourcesMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const revClaim = claims.find((claim) => claim.field === "annual_revenue");
  const workforceClaim = claims.find((claim) => claim.field === "headcount_total");
  const leasingClaim = claims.find((claim) => claim.field === "gcc_office_leasing_share_q1_2026");
  const megaClaim = claims.find((claim) => claim.field === "mega_gcc_count");
  const revSource = revClaim ? sourcesMap.get(revClaim.source_id) : undefined;
  const workforceSource = workforceClaim ? sourcesMap.get(workforceClaim.source_id) : undefined;
  const leasingSource = leasingClaim ? sourcesMap.get(leasingClaim.source_id) : undefined;
  const coverage = computeCoverage(gccs, claims, 2117);
  const count = recomputeCount(selectedUnit, gccs);

  return (
    <div className="atlas-home space-y-20 md:space-y-28">
      <section className="atlas-hero relative overflow-hidden border-b border-hairline pb-12 pt-5 md:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline-subtle pb-4 text-xs">
          <div className="flex items-center gap-2 text-muted">
            <span className="h-2 w-2 rounded-full bg-[#267A68] animate-atlas-pulse" />
            <span>Independent reference record</span><span className="text-hairline">/</span><span>Edition 2026-Q1</span>
          </div>
          <CitationButton pageTitle="India GCC Ecosystem Macro Record" path="/" />
        </div>
        <div className="grid grid-cols-1 gap-10 pt-9 lg:grid-cols-[1.15fr_.85fr] lg:gap-14 lg:pt-14">
          <div className="relative z-10">
            <p className="mb-5 text-sm font-semibold text-[#267A68]">India's Global Capability Centre ecosystem</p>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.99] tracking-[-.055em] text-ink sm:text-6xl lg:text-[5.35rem]">Better decisions start with <span className="text-[#267A68]">better evidence.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg">A citable record of the companies, locations and signals shaping India's GCC market. Each benchmark carries its source, method and confidence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registry" className="inline-flex min-h-12 items-center gap-3 bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-[#267A68]">Explore the registry <ArrowUpRight size={16} /></Link>
              <Link href="/reconcile" className="inline-flex min-h-12 items-center gap-2 border border-hairline px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface">Why counts disagree <Scale size={16} /></Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline-subtle pt-4 text-xs text-muted">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-[#267A68]" /> No paid rankings</span>
              <span className="inline-flex items-center gap-2"><FileCheck2 size={14} className="text-[#267A68]" /> Primary-source trail</span>
              <span className="inline-flex items-center gap-2"><Database size={14} className="text-[#267A68]" /> Explicit confidence grades</span>
            </div>
          </div>
          <div className="atlas-map-panel relative min-h-[330px] overflow-hidden border border-hairline bg-[#EAEDE4] p-5 sm:min-h-[390px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold text-[#3B514B]">The ecosystem, at a glance</p><p className="mt-1 text-xs text-[#63736C]">Major GCC research clusters</p></div>
              <span className="border border-[#B9C8BD] bg-[#F4F5EF] px-2 py-1 text-[10px] text-[#3B514B]">INDIA / 2026</span>
            </div>
            <svg className="atlas-network mt-3 h-[220px] w-full sm:h-[255px]" viewBox="0 0 440 280" role="img" aria-label="Schematic network connecting India's major GCC research clusters">
              <path d="M221 24 L270 49 L300 83 L321 120 L307 156 L282 182 L268 220 L228 250 L191 238 L161 211 L131 194 L105 158 L119 120 L135 86 L171 59 Z" fill="#DDE4D8" stroke="#9EADA0" strokeWidth="1.5" />
              <path d="M221 24 L210 85 L245 115 L221 153 L228 250 M135 86 L180 126 L161 211 M300 83 L245 115 L307 156 L228 153 L131 194 M119 120 L180 126 L282 182" fill="none" stroke="#BAC8BC" strokeWidth="1" strokeDasharray="3 5" />
              <g stroke="#267A68" strokeWidth="1.5" opacity=".7"><path d="M180 126 L245 115 L221 153 L161 211 L228 250" /><path d="M245 115 L307 156 M245 115 L300 83 M180 126 L135 86 M221 153 L282 182" /></g>
              {[
                {x:180,y:126,r:7,label:"Bengaluru",tx:137,ty:113},
                {x:245,y:115,r:6,label:"Hyderabad",tx:253,ty:107},
                {x:221,y:153,r:5,label:"Chennai",tx:229,ty:171},
                {x:161,y:211,r:4,label:"Pune",tx:129,ty:228},
                {x:228,y:250,r:4,label:"Coimbatore",tx:237,ty:268},
                {x:300,y:83,r:4,label:"Gurugram",tx:307,ty:72},
                {x:307,y:156,r:4,label:"Mumbai",tx:315,ty:171}
              ].map((p) => <g key={p.label} className="atlas-node"><circle cx={p.x} cy={p.y} r={p.r + 6} fill="#267A68" opacity=".10" /><circle cx={p.x} cy={p.y} r={p.r} fill="#267A68" stroke="#F4F5EF" strokeWidth="2" /><text x={p.tx} y={p.ty} fontSize="10" fontFamily="Instrument Sans, sans-serif" fill="#354C44">{p.label}</text></g>)}
              <circle cx="180" cy="126" r="14" fill="none" stroke="#267A68" strokeWidth="1" opacity=".6" className="atlas-ripple" />
              <circle cx="245" cy="115" r="11" fill="none" stroke="#267A68" strokeWidth="1" opacity=".5" className="atlas-ripple atlas-ripple-delay" />
            </svg>
            <div className="flex items-center justify-between border-t border-[#C7D1C5] pt-3 text-[11px] text-[#52655B]"><span>Cluster network schematic</span><Link href="/compare" className="inline-flex items-center gap-1 font-semibold hover:text-[#267A68]">Compare locations <ArrowRight size={13} /></Link></div>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 border-y border-hairline md:grid-cols-4">
          <div className="border-b border-r border-hairline-subtle py-5 pr-4 md:border-b-0 md:py-6"><p className="text-xs text-muted">Published benchmark</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">2,117+</p><p className="mt-1 text-xs text-muted">GCCs reported nationally <SourceFootnote marker={1} source={sourcesMap.get("src-zinnov-fy26") || sources[0]} fieldLabel="Total India GCC Benchmark" definitionRule="Zinnov-nasscom FY26 survey covering multinational enterprise captive units." showMarkerOnly /></p></div>
          <div className="border-b border-hairline-subtle py-5 pl-4 md:border-b-0 md:border-r md:px-5 md:py-6"><p className="text-xs text-muted">Direct workforce</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">1.9M+</p><p className="mt-1 text-xs text-muted">Professionals <SourceFootnote marker={3} source={workforceSource} claim={workforceClaim} fieldLabel="Total Direct Tech Workforce" showMarkerOnly /></p></div>
          <div className="border-r border-hairline-subtle py-5 pr-4 pt-5 md:px-5 md:py-6"><p className="text-xs text-muted">Direct export value</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">$64.6B</p><p className="mt-1 text-xs text-muted">FY26 benchmark <SourceFootnote marker={2} source={revSource} claim={revClaim} fieldLabel="FY26 Total GCC Revenue" showMarkerOnly /></p></div>
          <div className="py-5 pl-4 md:py-6 md:pl-5"><p className="text-xs text-muted">Office absorption</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#267A68] sm:text-4xl">44.0%</p><p className="mt-1 text-xs text-muted">Q1 2026 share <SourceFootnote marker={4} source={leasingSource} claim={leasingClaim} fieldLabel="Q1 2026 GCC Office Absorption Share" showMarkerOnly /></p></div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
        <div className="max-w-md">
          <p className="text-sm font-semibold text-[#267A68]">The counting problem</p><h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-.035em] text-ink sm:text-4xl">One market. Three different counts.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">A parent company, a registered legal entity and a physical campus are not the same unit. Change the definition to see how the verified registry recalculates.</p>
          <Link href="/reconcile" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-[#267A68]">Read the reconciliation method <ArrowUpRight size={15} /></Link>
          <div className="mt-8 border-l-2 border-[#267A68] pl-4"><p className="text-xs text-muted">Registry coverage</p><p className="mt-1 font-display text-3xl font-semibold text-ink">{coverage.wellSourcedCount} <span className="text-base font-normal text-muted">of {coverage.reportedTotal.toLocaleString()} benchmarked</span></p><div className="mt-3 h-1.5 w-full bg-[#DCE3D9]"><div className="h-full bg-[#267A68] transition-all duration-500" style={{ width: Math.max(0.7, coverage.coveragePercentage) + "%" }} /></div><p className="mt-2 text-xs leading-5 text-muted">Evidence completeness: {coverage.coveragePercentage.toFixed(1)}%. The record shows its limits instead of implying full coverage.</p></div>
        </div>
        <div className="min-w-0">
          <DefinitionToggle definitions={definitions} selectedUnit={selectedUnit} onSelectUnit={setSelectedUnit} />
          <div className="mt-4 grid grid-cols-1 border border-hairline bg-surface sm:grid-cols-[1fr_190px]">
            <div className="p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><p className="text-xs text-muted">Recomputed registry count</p><span className="inline-flex items-center gap-1.5 text-[11px] text-[#267A68]"><span className="h-1.5 w-1.5 rounded-full bg-[#267A68]" /> Updates on selection</span></div><p key={count.count} className="atlas-count mt-3 font-display text-6xl font-semibold tracking-[-.06em] text-ink sm:text-7xl">{count.count.toLocaleString()}</p><p className="mt-3 max-w-lg text-sm leading-6 text-muted">{count.explanation}</p></div>
            <div className="flex flex-col justify-between border-t border-hairline bg-[#F0F2EB] p-5 sm:border-l sm:border-t-0"><div><ChartNoAxesCombined size={19} className="text-[#267A68}" /><p className="mt-4 text-xs text-[#52655B]">Counting unit</p><p className="mt-1 font-semibold text-[#203A32]">{selectedUnit === "parent_company" ? "Parent enterprise" : selectedUnit === "legal_entity" ? "Legal entity" : "Campus unit"}</p></div><p className="mt-5 text-xs leading-5 text-[#52655B]">The number changes because the rule changes—not because the source data is being silently rewritten.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#267A68]">Research pathways</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.035em] text-ink sm:text-4xl">Start with the decision you need to make.</h2></div><p className="max-w-sm text-sm leading-6 text-muted">Three practical ways into a complicated market. Each route is designed around a real research task.</p></div>
        <div className="grid grid-cols-1 divide-y divide-hairline border-b border-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
          {pathways.map((path) => { const Icon = path.icon; return <article key={path.number} className="group flex min-h-[270px] flex-col p-6 transition-colors hover:bg-surface sm:p-7"><div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center border border-hairline text-xs font-semibold text-muted">{path.number}</span><Icon size={19} strokeWidth={1.6} className={path.tone === "orange" ? "text-[#B75B35]" : path.tone === "green" ? "text-[#267A68]" : "text-[#4568A5]"} /></div><h3 className="mt-7 font-display text-xl font-semibold tracking-tight text-ink">{path.title}</h3><p className="mt-3 text-sm leading-6 text-muted">{path.description}</p><Link href={path.href} className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-ink group-hover:text-[#267A68]">{path.action}<ArrowUpRight size={15} /></Link></article>; })}
        </div>
      </section>

      <section>
        <div className="flex flex-col justify-between gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#267A68]">The evidence ledger</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.035em] text-ink sm:text-4xl">Numbers worth citing.</h2></div><Link href="/registry" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-[#267A68]">Open full registry <ArrowRight size={15} /></Link></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] border-collapse text-left text-sm"><thead><tr className="border-b border-hairline text-xs text-muted"><th className="py-3 pr-4 font-medium">Benchmark</th><th className="py-3 pr-4 font-medium">Recorded value</th><th className="py-3 pr-4 font-medium">Confidence</th><th className="py-3 text-right font-medium">Source</th></tr></thead><tbody>
          <tr className="border-b border-hairline-subtle"><th className="py-4 pr-4 font-medium text-ink">Annual ecosystem exports</th><td className="py-4 pr-4 font-display text-xl font-semibold">$64.6B</td><td className="py-4 pr-4"><ConfidenceStamp grade={revClaim?.confidence || "B"} size="sm" /></td><td className="py-4 text-right"><SourceFootnote marker={5} source={revSource} claim={revClaim} fieldLabel="FY26 Total GCC Revenue" showMarkerOnly /></td></tr>
          <tr className="border-b border-hairline-subtle"><th className="py-4 pr-4 font-medium text-ink">Direct workforce</th><td className="py-4 pr-4 font-display text-xl font-semibold">1.9M+</td><td className="py-4 pr-4"><ConfidenceStamp grade={workforceClaim?.confidence || "B"} size="sm" /></td><td className="py-4 text-right"><SourceFootnote marker={6} source={workforceSource} claim={workforceClaim} fieldLabel="Total GCC Direct Workforce" showMarkerOnly /></td></tr>
          <tr className="border-b border-hairline-subtle"><th className="py-4 pr-4 font-medium text-ink">Mega centres (5,000+ staff)</th><td className="py-4 pr-4 font-display text-xl font-semibold">120</td><td className="py-4 pr-4"><ConfidenceStamp grade={megaClaim?.confidence || "B"} size="sm" /></td><td className="py-4 text-right"><SourceFootnote marker={7} source={megaClaim ? sourcesMap.get(megaClaim.source_id) : undefined} claim={megaClaim} fieldLabel="Mega GCC Count (5,000+ Staff)" showMarkerOnly /></td></tr>
          <tr className="border-b border-hairline-subtle"><th className="py-4 pr-4 font-medium text-ink">Office leasing share · Q1 2026</th><td className="py-4 pr-4 font-display text-xl font-semibold text-[#267A68]">44.0%</td><td className="py-4 pr-4"><ConfidenceStamp grade={leasingClaim?.confidence || "B"} size="sm" /></td><td className="py-4 text-right"><SourceFootnote marker={8} source={leasingSource} claim={leasingClaim} fieldLabel="Q1 2026 GCC Office Absorption Share" showMarkerOnly /></td></tr>
        </tbody></table></div>
        <p className="mt-4 max-w-3xl text-xs leading-5 text-muted">Figures reflect the edition and source definitions shown. Published national benchmarks and ZeroDay's verified registry are different measures; do not treat them as interchangeable.</p>
      </section>
    </div>
  );
}
