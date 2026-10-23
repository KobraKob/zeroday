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
  const [selectedCity, setSelectedCity] = useState("Bengaluru");
  const cityPoints = [
    { name: "Delhi NCR", x: 275, y: 70, color: "#FF6B4A" },
    { name: "Mumbai", x: 190, y: 150, color: "#15183A" },
    { name: "Pune", x: 205, y: 172, color: "#15183A" },
    { name: "Hyderabad", x: 260, y: 185, color: "#267A68" },
    { name: "Chennai", x: 282, y: 235, color: "#FF6B4A" },
    { name: "Bengaluru", x: 230, y: 220, color: "#267A68" },
    { name: "Kochi", x: 208, y: 268, color: "#15183A" },
    { name: "Kolkata", x: 350, y: 135, color: "#FF6B4A" },
  ];
  const cityStats = useMemo(() => cityPoints.map((point) => ({
    ...point,
    count: gccs.filter((gcc) => gcc.cities.some((city) => city.toLowerCase().includes(point.name.toLowerCase()) || (point.name === "Delhi NCR" && /delhi|gurugram|gurgaon|noida/i.test(city)))).length,
  })), [gccs]);
  const selectedCityStats = cityStats.find((city) => city.name === selectedCity) || cityStats[5];
  const cityGccs = gccs.filter((gcc) => gcc.cities.some((city) => city.toLowerCase().includes(selectedCity.toLowerCase()) || (selectedCity === "Delhi NCR" && /delhi|gurugram|gurgaon|noida/i.test(city))));
  const sectorStats = useMemo(() => {
    const counts = new Map<string, number>();
    cityGccs.forEach((gcc) => counts.set(gcc.sector, (counts.get(gcc.sector) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [cityGccs]);
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
          <div className="atlas-map-panel relative overflow-hidden border border-[#DAD7CC] bg-[#F2F0E7] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-display text-xl font-semibold tracking-tight text-[#15183A]">India, in motion.</p><p className="mt-1 text-sm text-[#525875]">Explore the registry by city cluster.</p></div>
              <span className="border border-[#DAD7CC] bg-[#FFF6E5] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#525875]">Live registry view</span>
            </div>
            <div className="relative mt-3">
              <svg className="atlas-network h-[280px] w-full sm:h-[330px]" viewBox="80 20 330 280" role="img" aria-label="Interactive schematic map of Indian GCC city clusters">
                <path d="M214 22 L250 34 L282 56 L306 77 L328 92 L349 112 L338 140 L315 157 L308 188 L292 216 L280 245 L258 275 L236 294 L218 267 L202 235 L180 214 L157 198 L140 169 L145 143 L154 118 L170 91 L187 65 Z" fill="#E3E3D8" stroke="#DAD7CC" strokeWidth="1.5"/>
                <path d="M214 22 L230 100 L260 185 L230 220 L258 275 M154 118 L205 172 L260 185 L315 157 L349 112 M145 143 L230 220 L282 235 L292 216 M187 65 L275 70 L315 157" fill="none" stroke="#DAD7CC" strokeWidth="1.1" strokeDasharray="3 5"/>
                <path d="M190 150 Q220 160 205 172 T260 185 T230 220 T282 235" fill="none" stroke="#15183A" strokeWidth="2" strokeDasharray="4 5" opacity=".35"/>
                {cityStats.map((point) => {
                  const active = selectedCity === point.name;
                  const radius = active ? 9 : Math.max(4, Math.min(7, 3 + point.count / 8));
                  return <g key={point.name} role="button" tabIndex={0} aria-label={`Select ${point.name}, ${point.count} registry records`} onClick={() => setSelectedCity(point.name)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedCity(point.name); } }} className="atlas-city-node" style={{ cursor: "pointer", outline: "none" }}>
                    {active && <circle cx={point.x} cy={point.y} r="19" fill={point.color} opacity=".14" className="atlas-city-pulse"/>}
                    <circle cx={point.x} cy={point.y} r={radius + 4} fill={point.color} opacity={active ? ".22" : ".1"}/>
                    <circle cx={point.x} cy={point.y} r={radius} fill={point.color} stroke="#FFF6E5" strokeWidth={active ? 3 : 2}/>
                    <text x={point.x + 11} y={point.y - 9} fontSize="10" fontWeight={active ? "700" : "500"} fontFamily="Instrument Sans, sans-serif" fill="#15183A">{point.name}</text>
                    {active && <text x={point.x + 11} y={point.y + 5} fontSize="9" fontFamily="DM Mono, monospace" fill="#525875">{point.count} records</text>}
                  </g>;
                })}
              </svg>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-4 border-t border-[#DAD7CC] pt-4">
              <div><p className="font-mono text-[11px] uppercase tracking-wider text-[#525875]">Selected cluster</p><p className="mt-1 font-display text-2xl font-bold tracking-tight text-[#15183A]">{selectedCity}</p><p className="mt-1 text-sm text-[#525875]">{selectedCityStats?.count ?? 0} matching registry records</p></div>
              <Link href="/compare" className="inline-flex min-h-11 items-center gap-2 bg-[#15183A] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">Compare cities <ArrowUpRight size={15}/></Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {cityStats.slice(0,4).map((city) => <button key={city.name} onClick={() => setSelectedCity(city.name)} className={`min-h-11 border px-3 py-2 text-left transition-all ${selectedCity === city.name ? "border-[#15183A] bg-[#15183A] text-white shadow-[3px_3px_0_#FF6B4A]" : "border-[#DAD7CC] bg-[#FFF6E5] text-[#15183A] hover:border-[#15183A]"}`}><span className="block text-xs">{city.name}</span><span className={`mt-1 block font-mono text-sm font-semibold ${selectedCity === city.name ? "text-white" : "text-[#15183A]"}`}>{city.count} records</span></button>)}
            </div>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 border-y border-hairline md:grid-cols-4">
          <div className="border-b border-r border-hairline-subtle py-5 pr-4 md:border-b-0 md:py-6"><p className="text-xs text-muted">Published benchmark</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">2,117+</p><p className="mt-1 text-xs text-muted">GCCs reported nationally <SourceFootnote marker={1} source={sourcesMap.get("src-zinnov-fy26") || sources[0]} fieldLabel="Total India GCC Benchmark" definitionRule="Zinnov-nasscom FY26 survey covering multinational enterprise captive units." showMarkerOnly /></p></div>
          <div className="border-b border-hairline-subtle py-5 pl-4 md:border-b-0 md:border-r md:px-5 md:py-6"><p className="text-xs text-muted">Direct workforce</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">1.9M+</p><p className="mt-1 text-xs text-muted">Professionals <SourceFootnote marker={3} source={workforceSource} claim={workforceClaim} fieldLabel="Total Direct Tech Workforce" showMarkerOnly /></p></div>
          <div className="border-r border-hairline-subtle py-5 pr-4 pt-5 md:px-5 md:py-6"><p className="text-xs text-muted">Direct export value</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">$64.6B</p><p className="mt-1 text-xs text-muted">FY26 benchmark <SourceFootnote marker={2} source={revSource} claim={revClaim} fieldLabel="FY26 Total GCC Revenue" showMarkerOnly /></p></div>
          <div className="py-5 pl-4 md:py-6 md:pl-5"><p className="text-xs text-muted">Office absorption</p><p className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#267A68] sm:text-4xl">44.0%</p><p className="mt-1 text-xs text-muted">Q1 2026 share <SourceFootnote marker={4} source={leasingSource} claim={leasingClaim} fieldLabel="Q1 2026 GCC Office Absorption Share" showMarkerOnly /></p></div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div className="bg-[#15183A] p-6 text-[#FFF6E5] sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[.18em] text-[#5FE0B0]">Cluster snapshot / 01</p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-[-.04em] sm:text-4xl">Zoom in on <span className="text-[#5FE0B0]">{selectedCity}.</span></h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#E8DEC8]">The chart updates from the registry records currently associated with this city cluster. It is a view of this dataset, not a claim about the entire market.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#525875] pt-5">
            <div><p className="text-xs text-[#E8DEC8]">Matching records</p><p className="mt-1 font-display text-4xl font-bold tabular-nums">{cityGccs.length}</p></div>
            <div><p className="text-xs text-[#E8DEC8]">Sectors represented</p><p className="mt-1 font-display text-4xl font-bold tabular-nums">{new Set(cityGccs.map((gcc) => gcc.sector)).size}</p></div>
          </div>
          <Link href="/registry" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#5FE0B0] hover:text-white">Open matching registry <ArrowRight size={15}/></Link>
        </div>
        <div className="border border-[#DAD7CC] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-[.16em] text-[#525875]">Registry composition</p><h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#15183A]">What this cluster works on</h3></div><span className="border border-[#DAD7CC] px-2 py-1 font-mono text-xs text-[#525875]">TOP 5 SECTORS</span></div>
          <div className="mt-7 space-y-5">
            {sectorStats.length ? sectorStats.map(([sector, value], index) => <div key={sector}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-[#15183A]">{sector.replaceAll("_", " ")}</span><span className="font-mono text-xs text-[#525875]">{value}</span></div>
              <div className="h-3 overflow-hidden bg-[#F2F0E7]"><div className={`atlas-bar-fill h-full ${index % 3 === 0 ? "bg-[#15183A]" : index % 3 === 1 ? "bg-[#FF6B4A]" : "bg-[#267A68]"}`} style={{ width: `${Math.max(4, value / Math.max(1, sectorStats[0][1]) * 100)}%`, animationDelay: `${index * 70}ms` }}/></div>
            </div>) : <p className="border border-dashed border-[#DAD7CC] p-5 text-sm text-[#525875]">No matching sector records for this cluster in the current registry.</p>}
          </div>
          <p className="mt-6 border-t border-[#DAD7CC] pt-4 text-xs leading-5 text-[#525875]">Counts reflect records in ZeroDay's current registry. A company listed across multiple cities may appear in each relevant cluster.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
        <div className="max-w-md">
          <p className="text-sm font-semibold text-[#267A68]">The counting problem</p><h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-.035em] text-ink sm:text-4xl">One market. Three different counts.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">A parent company, a registered legal entity and a physical campus are not the same unit. Change the definition to see how the verified registry recalculates.</p>
          <Link href="/reconcile" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-[#267A68]">Read the reconciliation method <ArrowUpRight size={15} /></Link>
          <div className="mt-8 border-l-2 border-[#267A68] pl-4"><p className="text-xs text-muted">Registry coverage</p><p className="mt-1 font-display text-3xl font-semibold text-ink">{coverage.wellSourcedCount} <span className="text-base font-normal text-muted">of {coverage.reportedTotal.toLocaleString()} benchmarked</span></p><div className="mt-3 h-1.5 w-full bg-[#E8DEC8]"><div className="h-full bg-[#267A68] transition-all duration-500" style={{ width: Math.max(0.7, coverage.coveragePercentage) + "%" }} /></div><p className="mt-2 text-xs leading-5 text-muted">Evidence completeness: {coverage.coveragePercentage.toFixed(1)}%. The record shows its limits instead of implying full coverage.</p></div>
        </div>
        <div className="min-w-0">
          <DefinitionToggle definitions={definitions} selectedUnit={selectedUnit} onSelectUnit={setSelectedUnit} />
          <div className="mt-4 grid grid-cols-1 border border-hairline bg-surface sm:grid-cols-[1fr_190px]">
            <div className="p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><p className="text-xs text-muted">Recomputed registry count</p><span className="inline-flex items-center gap-1.5 text-[11px] text-[#267A68]"><span className="h-1.5 w-1.5 rounded-full bg-[#267A68]" /> Updates on selection</span></div><p key={count.count} className="atlas-count mt-3 font-display text-6xl font-semibold tracking-[-.06em] text-ink sm:text-7xl">{count.count.toLocaleString()}</p><p className="mt-3 max-w-lg text-sm leading-6 text-muted">{count.explanation}</p></div>
            <div className="flex flex-col justify-between border-t border-hairline bg-[#F2F0E7] p-5 sm:border-l sm:border-t-0"><div><ChartNoAxesCombined size={19} className="text-[#267A68}" /><p className="mt-4 text-xs text-[#267A68]">Counting unit</p><p className="mt-1 font-semibold text-[#15183A]">{selectedUnit === "parent_company" ? "Parent enterprise" : selectedUnit === "legal_entity" ? "Legal entity" : "Campus unit"}</p></div><p className="mt-5 text-xs leading-5 text-[#267A68]">The number changes because the rule changes—not because the source data is being silently rewritten.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#267A68]">Research pathways</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.035em] text-ink sm:text-4xl">Start with the decision you need to make.</h2></div><p className="max-w-sm text-sm leading-6 text-muted">Three practical ways into a complicated market. Each route is designed around a real research task.</p></div>
        <div className="grid grid-cols-1 divide-y divide-hairline border-b border-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
          {pathways.map((path) => { const Icon = path.icon; return <article key={path.number} className="group flex min-h-[270px] flex-col p-6 transition-colors hover:bg-surface sm:p-7"><div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center border border-hairline text-xs font-semibold text-muted">{path.number}</span><Icon size={19} strokeWidth={1.6} className={path.tone === "orange" ? "text-[#FF6B4A]" : path.tone === "green" ? "text-[#267A68]" : "text-[#267A68]"} /></div><h3 className="mt-7 font-display text-xl font-semibold tracking-tight text-ink">{path.title}</h3><p className="mt-3 text-sm leading-6 text-muted">{path.description}</p><Link href={path.href} className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-ink group-hover:text-[#267A68]">{path.action}<ArrowUpRight size={15} /></Link></article>; })}
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
