"use client";

import React, { useMemo, useState } from "react";
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
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  Database,
  FileCheck2,
  MapPin,
  RadioTower,
  Scale,
  ShieldCheck,
} from "lucide-react";

interface HomeClientProps {
  gccs: Gcc[];
  claims: Claim[];
  sources: Source[];
  definitions: CountDefinition[];
  publishedCounts: PublishedCount[];
}

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

const pathways = [
  {
    number: "01",
    title: "Choose where to build",
    description: "Compare talent, leasing signals, costs and incentives across India's technology hubs.",
    href: "/compare",
    action: "Compare cities",
    icon: MapPin,
    tone: "cobalt",
  },
  {
    number: "02",
    title: "Catch expansion signals",
    description: "Trace registrations, leadership moves and public filings before they become headlines.",
    href: "/radar",
    action: "Open the radar",
    icon: RadioTower,
    tone: "coral",
  },
  {
    number: "03",
    title: "Verify a provider",
    description: "Inspect the evidence behind provider claims. Commercial placement never changes the score.",
    href: "/providers",
    action: "Review evidence",
    icon: ShieldCheck,
    tone: "mint",
  },
];

function matchesCity(gcc: Gcc, cityName: string): boolean {
  return gcc.cities.some((city) => {
    const normalised = city.toLowerCase();
    if (cityName === "Delhi NCR") {
      return /delhi|gurugram|gurgaon|noida/i.test(normalised);
    }
    return normalised.includes(cityName.toLowerCase());
  });
}

function benchmarkNumber(item: PublishedCount): number {
  if (typeof item.count_value === "number") return item.count_value;
  const normalised = item.headline_count.replace(/,/g, "").trim();
  const parsed = Number(normalised.replace(/[^0-9.]/g, ""));
  const suffix = normalised.match(/([kmb])\s*(?:gccs?|centres?|centers?)?$/i)?.[1]?.toLowerCase();
  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : suffix === "b" ? 1_000_000_000 : 1;
  const value = parsed * multiplier;
  return Number.isFinite(value) ? value : Number.NaN;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

export function HomeClient({
  gccs,
  claims,
  sources,
  definitions,
  publishedCounts,
}: HomeClientProps) {
  const [selectedUnit, setSelectedUnit] = useState<"parent_company" | "legal_entity" | "centre_unit">("parent_company");
  const [selectedCity, setSelectedCity] = useState("Bengaluru");

  const cityStats = useMemo(
    () => cityPoints.map((point) => ({
      ...point,
      count: gccs.filter((gcc) => matchesCity(gcc, point.name)).length,
    })),
    [gccs]
  );
  const selectedCityStats = cityStats.find((city) => city.name === selectedCity) || cityStats[5];
  const cityGccs = useMemo(() => gccs.filter((gcc) => matchesCity(gcc, selectedCity)), [gccs, selectedCity]);

  const sectorStats = useMemo(() => {
    const sectorCounts = new Map<string, number>();
    cityGccs.forEach((gcc) => sectorCounts.set(gcc.sector, (sectorCounts.get(gcc.sector) || 0) + 1));
    return [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [cityGccs]);

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((source) => map.set(source.id, source));
    return map;
  }, [sources]);

  const revClaim = claims.find((claim) => claim.field === "annual_revenue");
  const workforceClaim = claims.find((claim) => claim.field === "headcount_total");
  const leasingClaim = claims.find((claim) => claim.field === "gcc_office_leasing_share_q1_2026");
  const megaClaim = claims.find((claim) => claim.field === "mega_gcc_count");
  const revSource = revClaim ? sourcesMap.get(revClaim.source_id) : undefined;
  const workforceSource = workforceClaim ? sourcesMap.get(workforceClaim.source_id) : undefined;
  const leasingSource = leasingClaim ? sourcesMap.get(leasingClaim.source_id) : undefined;
  const coverage = computeCoverage(gccs, claims, 2117);
  const count = recomputeCount(selectedUnit, gccs);

  const benchmarks = useMemo(
    () => publishedCounts
      .map((item) => ({ ...item, numericCount: benchmarkNumber(item) }))
      .filter((item) => Number.isFinite(item.numericCount) && item.numericCount > 0)
      .sort((a, b) => b.numericCount - a.numericCount)
      .slice(0, 5),
    [publishedCounts]
  );
  const maxBenchmark = Math.max(1, ...benchmarks.map((item) => item.numericCount));

  return (
    <div className="atlas-home space-y-16 md:space-y-24">
      <section className="atlas-hero relative">
        <div className="atlas-hero-grid grid grid-cols-1 items-center gap-9 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="atlas-hero-copy relative z-10">
            <div className="atlas-eyebrow mb-6 flex flex-wrap items-center gap-2.5">
              <span className="atlas-live-dot" aria-hidden="true" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-mint">ZeroDay / Grounded intelligence</span>
              <span className="atlas-edition">Edition 2026-Q1</span>
            </div>
            <h1 className="atlas-hero-title max-w-2xl font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
              See the market <span className="atlas-title-accent">beneath the headlines.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
              A living, citable record of India's GCC ecosystem. Explore city clusters, compare conflicting benchmarks, and follow every number back to its source.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registry" className="atlas-primary-cta inline-flex min-h-12 items-center gap-3 rounded-full bg-cobalt px-5 text-sm font-bold text-white transition-all duration-200">
                Explore the registry <ArrowUpRight size={16} />
              </Link>
              <Link href="/compare" className="atlas-secondary-cta inline-flex min-h-12 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold text-ink transition-all duration-200">
                Compare city clusters <ArrowRight size={15} />
              </Link>
            </div>
            <div className="atlas-proof-row mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-hairline-subtle pt-5">
              <span className="inline-flex items-center gap-2 text-xs text-muted"><ShieldCheck size={15} className="text-mint" /> No paid rankings</span>
              <span className="inline-flex items-center gap-2 text-xs text-muted"><FileCheck2 size={15} className="text-coral" /> Source-traceable figures</span>
              <span className="inline-flex items-center gap-2 text-xs text-muted"><Database size={15} className="text-cobalt" /> Explicit confidence grades</span>
            </div>
          </div>

          <div className="atlas-hero-visual relative mx-auto w-full max-w-2xl">
            <div className="atlas-cube-scene" aria-hidden="true">
              <div className="atlas-cube">
                <span className="atlas-cube-face atlas-cube-front">ZD</span>
                <span className="atlas-cube-face atlas-cube-back">01</span>
                <span className="atlas-cube-face atlas-cube-right">DATA</span>
                <span className="atlas-cube-face atlas-cube-left">PROOF</span>
                <span className="atlas-cube-face atlas-cube-top" />
                <span className="atlas-cube-face atlas-cube-bottom" />
              </div>
            </div>
            <div className="atlas-map-panel relative overflow-hidden rounded-[1.4rem] border p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-mint">
                    <Activity size={14} /> Interactive atlas
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">India, cluster by cluster.</h2>
                  <p className="mt-1 text-sm text-muted">Select a city to update the registry view.</p>
                </div>
                <span className="atlas-map-badge">SCHEMATIC / NOT TO SCALE</span>
              </div>

              <div className="atlas-map-stage relative mt-3">
                <svg className="atlas-network h-[258px] w-full sm:h-[302px]" viewBox="80 20 330 280" role="group" aria-label="Interactive schematic map of Indian GCC city clusters">
                  <path className="atlas-map-land" d="M214 22 L250 34 L282 56 L306 77 L328 92 L349 112 L338 140 L315 157 L308 188 L292 216 L280 245 L258 275 L236 294 L218 267 L202 235 L180 214 L157 198 L140 169 L145 143 L154 118 L170 91 L187 65 Z" />
                  <path className="atlas-map-internal" d="M214 22 L230 100 L260 185 L230 220 L258 275 M154 118 L205 172 L260 185 L315 157 L349 112 M145 143 L230 220 L282 235 L292 216 M187 65 L275 70 L315 157" />
                  <path className="atlas-map-route" d="M190 150 Q220 160 205 172 T260 185 T230 220 T282 235" />
                  {cityStats.map((point) => {
                    const active = selectedCity === point.name;
                    const radius = active ? 8 : Math.max(4, Math.min(6.5, 3.5 + point.count / 10));
                    return (
                      <g
                        key={point.name}
                        role="button"
                        tabIndex={0}
                        aria-label={"Select " + point.name + ", " + point.count + " registry records"}
                        aria-pressed={active}
                        onClick={() => setSelectedCity(point.name)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedCity(point.name);
                          }
                        }}
                        className={"atlas-city-node atlas-city-node--" + point.tone + (active ? " is-active" : "")}
                      >
                        {active && <circle cx={point.x} cy={point.y} r="19" className="atlas-city-pulse" />}
                        <circle cx={point.x} cy={point.y} r={radius + 4} className="atlas-city-halo" />
                        <circle cx={point.x} cy={point.y} r={radius} className="atlas-city-core" />
                        <text x={point.x + 11} y={point.y - 9} className="atlas-map-label" fontSize="10" fontWeight={active ? "700" : "500"}>{point.name}</text>
                        {active && <text x={point.x + 11} y={point.y + 5} className="atlas-map-sub-label" fontSize="10">{point.count} records</text>}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="atlas-map-footer flex flex-wrap items-end justify-between gap-4 border-t pt-4">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Selected cluster</p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{selectedCity}</p>
                  <p className="mt-1 text-sm text-muted">{selectedCityStats?.count ?? 0} matching registry records</p>
                </div>
                <Link href="/compare" className="atlas-map-cta inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-paper transition-all duration-200">
                  Compare cities <ArrowUpRight size={15} />
                </Link>
              </div>
              <div className="atlas-city-pills mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {cityStats.slice(0, 4).map((city) => (
                  <button
                    key={city.name}
                    onClick={() => setSelectedCity(city.name)}
                    aria-pressed={selectedCity === city.name}
                    className={"atlas-city-pill min-h-11 rounded-xl border px-3 py-2 text-left transition-all duration-200" + (selectedCity === city.name ? " is-selected" : "")}
                  >
                    <span className="block text-xs font-semibold">{city.name}</span>
                    <span className="mt-1 block font-mono text-xs">{city.count} records</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="atlas-visual-caption mt-3 flex items-center justify-between gap-3 px-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              <span>City-level selection</span><span>Registry-backed · Keyboard accessible</span>
            </div>
          </div>
        </div>

        <div className="atlas-stat-grid mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article className="atlas-stat-card atlas-stat-card--cobalt">
            <div className="flex items-center justify-between gap-2"><span className="atlas-stat-label">National benchmark</span><Database size={16} /></div>
            <p className="atlas-stat-number">2,117+</p>
            <p className="atlas-stat-note">GCCs reported nationally <SourceFootnote marker={1} source={sourcesMap.get("src-zinnov-fy26") || sources[0]} fieldLabel="Total India GCC Benchmark" definitionRule="Zinnov-nasscom FY26 survey covering multinational enterprise captive units." showMarkerOnly={true} /></p>
          </article>
          <article className="atlas-stat-card atlas-stat-card--mint">
            <div className="flex items-center justify-between gap-2"><span className="atlas-stat-label">Direct workforce</span><Building2 size={16} /></div>
            <p className="atlas-stat-number">1.9M+</p>
            <p className="atlas-stat-note">Professionals <SourceFootnote marker={3} source={workforceSource} claim={workforceClaim} fieldLabel="Total Direct Tech Workforce" showMarkerOnly={true} /></p>
          </article>
          <article className="atlas-stat-card atlas-stat-card--coral">
            <div className="flex items-center justify-between gap-2"><span className="atlas-stat-label">Direct export value</span><ChartNoAxesCombined size={16} /></div>
            <p className="atlas-stat-number">$64.6B</p>
            <p className="atlas-stat-note">FY26 benchmark <SourceFootnote marker={2} source={revSource} claim={revClaim} fieldLabel="FY26 Total GCC Revenue" showMarkerOnly={true} /></p>
          </article>
          <article className="atlas-stat-card atlas-stat-card--gold">
            <div className="flex items-center justify-between gap-2"><span className="atlas-stat-label">Office absorption</span><Activity size={16} /></div>
            <p className="atlas-stat-number">44.0%</p>
            <p className="atlas-stat-note">Q1 2026 share <SourceFootnote marker={4} source={leasingSource} claim={leasingClaim} fieldLabel="Q1 2026 GCC Office Absorption Share" showMarkerOnly={true} /></p>
          </article>
        </div>
        <p className="mt-3 max-w-4xl text-xs leading-5 text-muted">Published national benchmarks and ZeroDay's registry count different things. Each figure retains its own source and definition; they should not be treated as interchangeable.</p>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="atlas-insight-panel rounded-[1.4rem] border p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="atlas-section-kicker"><Activity size={14} /> City signal</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">What's building in <span className="text-mint">{selectedCity}?</span></h2></div>
            <span className="atlas-mini-badge">LIVE SELECTION</span>
          </div>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">Sector mix recalculates from the GCC records currently associated with this city. It describes this registry—not the entire market.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="atlas-mini-stat"><span>Registry records</span><strong>{cityGccs.length}</strong></div>
            <div className="atlas-mini-stat"><span>Sectors represented</span><strong>{new Set(cityGccs.map((gcc) => gcc.sector)).size}</strong></div>
          </div>
          <div className="mt-7 space-y-5">
            {sectorStats.length ? sectorStats.map(([sector, value], index) => (
              <div key={sector} className="atlas-sector-row">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-ink">{sector.replace(/_/g, " ")}</span>
                  <span className="font-mono text-xs text-muted">{value} {value === 1 ? "record" : "records"}</span>
                </div>
                <div className="atlas-chart-track h-3 overflow-hidden rounded-full">
                  <div
                    className={"atlas-chart-fill atlas-chart-fill--" + (index % 4) + " h-full rounded-full"}
                    style={{ width: (Math.max(4, value / Math.max(1, sectorStats[0][1]) * 100)) + "%", animationDelay: (index * 70) + "ms" }}
                  />
                </div>
              </div>
            )) : (
              <div className="atlas-empty-state">
                <Database size={19} />
                <p className="mt-3 font-semibold text-ink">No sector records for this cluster yet.</p>
                <p className="mt-1 text-sm text-muted">Try another city on the map to inspect its current registry coverage.</p>
              </div>
            )}
          </div>
          <p className="mt-6 border-t border-hairline-subtle pt-4 text-xs leading-5 text-muted">Companies present in more than one city can appear in multiple cluster views.</p>
        </div>

        <div className="atlas-benchmark-panel rounded-[1.4rem] border p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="atlas-section-kicker"><Scale size={14} /> Why counts disagree</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">One market. Different counts.</h2></div>
            <Link href="/reconcile" className="atlas-text-link inline-flex items-center gap-2 text-sm font-semibold">Reconcile sources <ArrowUpRight size={15} /></Link>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Published estimates often count different things. This comparison uses the numeric values available in ZeroDay's published benchmark records.</p>
          {benchmarks.length ? (
            <div className="mt-8 space-y-5">
              {benchmarks.map((item, index) => (
                <div key={item.id} className="atlas-benchmark-row">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{item.publisher}</p><p className="mt-0.5 truncate text-xs text-muted">{item.unit_claimed}</p></div>
                    <span className="shrink-0 font-mono text-sm font-bold text-ink">{formatCount(item.numericCount)}</span>
                  </div>
                  <div className="atlas-chart-track h-2.5 overflow-hidden rounded-full">
                    <div className={"atlas-chart-fill atlas-chart-fill--" + (index % 4) + " h-full rounded-full"} style={{ width: (Math.max(3, item.numericCount / maxBenchmark * 100)) + "%", animationDelay: (index * 65) + "ms" }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted">As of {item.as_of} · {item.definition_known ? "Definition disclosed" : "Definition unclear"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="atlas-empty-state mt-7">
              <Scale size={19} />
              <p className="mt-3 font-semibold text-ink">No numeric benchmark values loaded.</p>
              <p className="mt-1 text-sm text-muted">Open Reconcile to inspect the comparison framework and definition gaps.</p>
            </div>
          )}
          <div className="atlas-callout mt-7 flex items-start gap-3 rounded-xl border p-4">
            <FileCheck2 size={18} className="mt-0.5 shrink-0 text-mint" />
            <p className="text-sm leading-6 text-muted">The method matters as much as the headline. ZeroDay makes the unit, source and confidence visible instead of blending incompatible counts.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-7 xl:grid-cols-[0.75fr_1.25fr] xl:gap-12">
        <div className="max-w-lg">
          <p className="atlas-section-kicker"><Database size={14} /> Audit the method</p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">Change the rule. Watch the count change.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">A parent enterprise, an Indian legal entity and a physical campus are different units. Switch the definition to see the registry recompute its count.</p>
          <div className="mt-6">
            <CoverageMeter
              wellSourcedCount={coverage.wellSourcedCount}
              totalRegistryCount={coverage.totalRegistryCount}
              reportedTotal={coverage.reportedTotal}
              coveragePercentage={coverage.coveragePercentage}
            />
          </div>
          <Link href="/methodology" className="atlas-text-link mt-5 inline-flex items-center gap-2 text-sm font-semibold">Read the methodology <ArrowUpRight size={15} /></Link>
        </div>
        <div className="min-w-0">
          <DefinitionToggle definitions={definitions} selectedUnit={selectedUnit} onSelectUnit={setSelectedUnit} />
          <div className="atlas-count-panel mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-[1fr_210px]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Recomputed registry count</p><span className="atlas-update-status"><span /> Updates on selection</span></div>
              <p key={count.count + selectedUnit} className="atlas-count-number mt-4 font-display text-6xl font-extrabold tracking-[-0.06em] text-ink sm:text-7xl">{formatCount(count.count)}</p>
              <p className="mt-4 max-w-lg text-sm leading-6 text-muted">{count.explanation}</p>
            </div>
            <div className="atlas-count-side flex flex-col justify-between border-t p-5 sm:border-l sm:border-t-0 sm:p-6">
              <div><ChartNoAxesCombined size={20} className="text-cobalt" /><p className="mt-4 text-xs text-muted">Counting unit</p><p className="mt-1 font-semibold text-ink">{selectedUnit === "parent_company" ? "Parent enterprise" : selectedUnit === "legal_entity" ? "Legal entity" : "Campus unit"}</p></div>
              <p className="mt-5 text-xs leading-5 text-muted">The count changes because the rule changes—not because source data is silently rewritten.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col justify-between gap-4 border-b border-hairline-subtle pb-5 sm:flex-row sm:items-end">
          <div><p className="atlas-section-kicker"><ArrowRight size={14} /> Research pathways</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Start with the decision you need to make.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-muted">Purpose-built routes into a complicated market. Each one answers a different research question.</p>
        </div>
        <div className="atlas-pathway-grid mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {pathways.map((path) => {
            const Icon = path.icon;
            return (
              <Link key={path.number} href={path.href} className={"atlas-pathway atlas-pathway--" + path.tone + " group flex min-h-[255px] flex-col rounded-2xl border p-6 sm:p-7"}>
                <div className="flex items-center justify-between"><span className="atlas-pathway-number font-mono text-xs font-bold">{path.number}</span><Icon size={22} strokeWidth={1.7} /></div>
                <h3 className="mt-7 font-display text-xl font-bold tracking-tight text-ink">{path.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{path.description}</p>
                <span className="atlas-pathway-action mt-auto inline-flex items-center gap-2 pt-7 text-sm font-bold">{path.action}<ArrowUpRight size={15} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-col justify-between gap-4 border-b border-hairline-subtle pb-5 sm:flex-row sm:items-end">
          <div><p className="atlas-section-kicker"><FileCheck2 size={14} /> Evidence ledger</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Numbers worth citing.</h2></div>
          <Link href="/registry" className="atlas-text-link inline-flex items-center gap-2 text-sm font-semibold">Open full registry <ArrowRight size={15} /></Link>
        </div>
        <div className="atlas-ledger-wrap mt-5 overflow-x-auto rounded-2xl border">
          <table className="atlas-ledger w-full min-w-[620px] border-collapse text-left text-sm">
            <thead><tr><th>Benchmark</th><th>Recorded value</th><th>Confidence</th><th className="text-right">Source</th></tr></thead>
            <tbody>
              <tr><th scope="row">Annual ecosystem exports</th><td className="atlas-ledger-value">$64.6B</td><td><ConfidenceStamp grade={revClaim?.confidence || "B"} size="sm" /></td><td className="text-right"><SourceFootnote marker={5} source={revSource} claim={revClaim} fieldLabel="FY26 Total GCC Revenue" showMarkerOnly={true} /></td></tr>
              <tr><th scope="row">Direct workforce</th><td className="atlas-ledger-value">1.9M+</td><td><ConfidenceStamp grade={workforceClaim?.confidence || "B"} size="sm" /></td><td className="text-right"><SourceFootnote marker={6} source={workforceSource} claim={workforceClaim} fieldLabel="Total GCC Direct Workforce" showMarkerOnly={true} /></td></tr>
              <tr><th scope="row">Mega centres (5,000+ staff)</th><td className="atlas-ledger-value">{megaClaim && typeof megaClaim.value === "number" ? formatCount(megaClaim.value) : "120"}</td><td><ConfidenceStamp grade={megaClaim?.confidence || "B"} size="sm" /></td><td className="text-right"><SourceFootnote marker={7} source={megaClaim ? sourcesMap.get(megaClaim.source_id) : undefined} claim={megaClaim} fieldLabel="Mega GCC Count (5,000+ Staff)" showMarkerOnly={true} /></td></tr>
              <tr><th scope="row">Office leasing share · Q1 2026</th><td className="atlas-ledger-value">{leasingClaim && (typeof leasingClaim.value === "number" || typeof leasingClaim.value === "string") ? String(leasingClaim.value) + (leasingClaim.unit || "") : "44.0%"}</td><td><ConfidenceStamp grade={leasingClaim?.confidence || "B"} size="sm" /></td><td className="text-right"><SourceFootnote marker={8} source={leasingSource} claim={leasingClaim} fieldLabel="Q1 2026 GCC Office Absorption Share" showMarkerOnly={true} /></td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-4xl text-xs leading-5 text-muted">Figures reflect the edition and source definitions shown. National benchmarks and the verified ZeroDay registry use different counting rules.</p>
      </section>
    </div>
  );
}
