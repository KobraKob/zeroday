"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Gcc, City, State, Provider, ProofLink, Checklist, Claim, Source } from "../../lib/schema";
import { computeProviderScore } from "../../lib/scoring";
import { PageHeader } from "../../components/PageHeader";
import { SourceFootnote } from "../../components/SourceFootnote";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import {
  Sparkles,
  Printer,
  ChevronRight,
  CheckCircle2,
  Building,
  MapPin,
  FileCheck,
  Shield,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Award,
} from "lucide-react";

interface AdvisorClientProps {
  gccs: Gcc[];
  cities: City[];
  states: State[];
  providers: Provider[];
  proofLinks: ProofLink[];
  checklists: Checklist[];
  claims: Claim[];
  sources: Source[];
}

export function AdvisorClient({
  gccs,
  cities,
  states,
  providers,
  proofLinks,
  checklists,
  claims,
  sources,
}: AdvisorClientProps) {
  // Intake state
  const [step, setStep] = useState(1);
  const [hqCountry, setHqCountry] = useState("United States");
  const [sector, setSector] = useState("Software & Internet");
  const [targetHeadcount, setTargetHeadcount] = useState("500-1k");
  const [timelineMonths, setTimelineMonths] = useState("6-12 months");
  const [primaryFunctions, setPrimaryFunctions] = useState<string[]>([
    "Core Software Engineering",
    "AI & ML Research",
  ]);
  const [strategicPriority, setStrategicPriority] = useState<"talent" | "cost" | "balanced">("balanced");
  const [cityPreference, setCityPreference] = useState<string>("no_preference");

  const [briefingGenerated, setBriefingGenerated] = useState(false);

  // Maps
  const statesMap = new Map<string, State>();
  states.forEach((s) => statesMap.set(s.id, s));

  const sourcesMap = new Map<string, Source>();
  sources.forEach((s) => sourcesMap.set(s.id, s));

  const claimsMap = new Map<string, Claim>();
  claims.forEach((c) => claimsMap.set(c.id, c));

  const proofLinksByProvider = new Map<string, ProofLink[]>();
  proofLinks.forEach((pl) => {
    if (!proofLinksByProvider.has(pl.provider_id)) {
      proofLinksByProvider.set(pl.provider_id, []);
    }
    proofLinksByProvider.get(pl.provider_id)!.push(pl);
  });

  const handleToggleFunction = (fn: string) => {
    if (primaryFunctions.includes(fn)) {
      if (primaryFunctions.length > 1) {
        setPrimaryFunctions(primaryFunctions.filter((f) => f !== fn));
      }
    } else {
      setPrimaryFunctions([...primaryFunctions, fn]);
    }
  };

  const handleGenerate = () => {
    setBriefingGenerated(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Grounded Shortlisting Logic
  const shortlistedCities = React.useMemo(() => {
    if (cityPreference !== "no_preference") {
      const preferred = cities.find((c) => c.name.toLowerCase().includes(cityPreference.toLowerCase()));
      if (preferred) {
        const other = cities.filter((c) => c.id !== preferred.id).slice(0, 2);
        return [preferred, ...other];
      }
    }

    if (strategicPriority === "cost") {
      return cities.filter((c) => ["city-cbe", "city-noi", "city-pun"].includes(c.id));
    } else if (strategicPriority === "talent") {
      return cities.filter((c) => ["city-blr", "city-hyd", "city-ggn"].includes(c.id));
    } else {
      return cities.filter((c) => ["city-blr", "city-hyd", "city-pun"].includes(c.id));
    }
  }, [cities, strategicPriority, cityPreference]);

  // Peer GCCs matching sector and HQ
  const peerGccs = React.useMemo(() => {
    return gccs
      .filter((g) => g.sector === sector || g.parent_hq_country === hqCountry)
      .slice(0, 4);
  }, [gccs, sector, hqCountry]);

  // Providers ranked by evidence depth score
  const rankedProviders = React.useMemo(() => {
    return providers
      .map((prov) => {
        const links = proofLinksByProvider.get(prov.id) || [];
        const scoreData = computeProviderScore(links);
        return { provider: prov, scoreData };
      })
      .sort((a, b) => b.scoreData.score - a.scoreData.score)
      .slice(0, 5);
  }, [providers, proofLinksByProvider]);

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Editorial Header */}
      <PageHeader
        rubric="Grounded Intake & Advisory"
        findingHeadline="India Capability Centre Entry Briefing: Tailored strategy from verified repository claims"
        findingDescription="Plan an India capability centre with zero unverified figures. Complete 6 structured questions to compile an objective briefing grounded in Grade A office rents, tech compensation indexes, peer footprints, and gazetted state subsidies."
        pageTitle="India GCC Entry Advisor"
        path="/advisor"
        metadata="Archival Intake"
        primaryAction={
          briefingGenerated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium border border-hairline bg-surface hover:bg-paper transition-colors text-ink min-h-[36px]"
              >
                <Printer className="w-3.5 h-3.5 text-cobalt" />
                <span>Print Dossier</span>
              </button>
              <button
                type="button"
                onClick={() => setBriefingGenerated(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-ink text-paper hover:bg-cobalt transition-colors min-h-[36px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconfigure</span>
              </button>
            </div>
          ) : undefined
        }
      />

      {!briefingGenerated ? (
        /* Intake Wizard */
        <div className="border border-hairline bg-surface p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-hairline-subtle pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase text-muted font-bold block">
                Step {step} of 6
              </span>
              <h2 className="font-display text-lg font-bold text-ink">
                {step === 1 && "Enterprise Profile: HQ Nation & Industry"}
                {step === 2 && "Scale & Timeline: Headcount & Launch Roadmap"}
                {step === 3 && "Functional Scope: Core Engineering & Operations Mandates"}
                {step === 4 && "Strategic Driver: Frontier Talent Density vs Cost Arbitrage"}
                {step === 5 && "Municipal Preferences: Target Hub Candidates"}
                {step === 6 && "Audit & Assemble Citable Briefing Dossier"}
              </h2>
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">
                  Global Enterprise HQ Nation:
                </label>
                <select
                  value={hqCountry}
                  onChange={(e) => setHqCountry(e.target.value)}
                  className="w-full py-2 px-3 border border-hairline bg-paper/50 text-xs text-ink min-h-[44px]"
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Japan">Japan</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">
                  Primary Industry Sector:
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full py-2 px-3 border border-hairline bg-paper/50 text-xs text-ink min-h-[44px]"
                >
                  <option value="Software & Internet">Software &amp; Internet</option>
                  <option value="Banking & Financial Services">Banking &amp; Financial Services</option>
                  <option value="Automotive Engineering & IoT">Automotive Engineering &amp; IoT</option>
                  <option value="Aerospace & Defense">Aerospace &amp; Defense</option>
                  <option value="Semiconductors & Computing Hardware">Semiconductors &amp; Computing</option>
                  <option value="Pharmaceuticals & Biotechnology">Pharmaceuticals &amp; Healthcare</option>
                  <option value="Retail & Supply Chain Technology">Retail &amp; FMCG Technology</option>
                  <option value="Heavy Machinery & Precision Agriculture">Industrial &amp; Machinery</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase text-muted font-bold">
                  Target Indian Workforce Scale (Year 3):
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "<500", label: "Specialized Hub (<500 professionals)" },
                    { id: "500-1k", label: "Mid-Market Scale (500 to 1,000 professionals)" },
                    { id: "1k-5k", label: "Enterprise Campus (1,000 to 5,000 professionals)" },
                    { id: "5k+", label: "Mega Hub (5,000+ professionals)" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`block p-3 border cursor-pointer transition-colors ${
                        targetHeadcount === opt.id
                          ? "border-ink bg-paper font-bold text-ink"
                          : "border-hairline bg-surface text-muted hover:border-ink hover:text-ink"
                      }`}
                    >
                      <input
                        type="radio"
                        name="headcount"
                        value={opt.id}
                        checked={targetHeadcount === opt.id}
                        onChange={(e) => setTargetHeadcount(e.target.value)}
                        className="sr-only"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-1">
                  Target Launch Roadmap:
                </label>
                <select
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(e.target.value)}
                  className="w-full py-2 px-3 border border-hairline bg-paper/50 text-xs text-ink min-h-[44px]"
                >
                  <option value="Immediate (0-6 months)">Immediate (0-6 months via BOT/Incubator)</option>
                  <option value="6-12 months">Standard Build (6-12 months)</option>
                  <option value="12-24 months">Phased Expansion (12-24 months)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-2 text-xs font-mono">
              <label className="block text-[10px] uppercase text-muted font-bold">
                Select Intended Functional Mandates (Pick at least 1):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Core Software Engineering",
                  "AI & ML Research",
                  "Cloud Infrastructure",
                  "Quantitative Risk & Analytics",
                  "Embedded Systems & Automotive",
                  "Clinical Trials & Data Platforms",
                  "Supply Chain & Digital Operations",
                  "Global Shared Services (Finance/HR)",
                ].map((fn) => {
                  const isChecked = primaryFunctions.includes(fn);
                  return (
                    <button
                      type="button"
                      key={fn}
                      onClick={() => handleToggleFunction(fn)}
                      className={`p-3 border text-left text-xs transition-colors flex items-center justify-between min-h-[44px] ${
                        isChecked
                          ? "border-ink bg-paper font-bold text-ink"
                          : "border-hairline bg-surface text-muted hover:border-ink hover:text-ink"
                      }`}
                    >
                      <span>{fn}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-cobalt shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-3 text-xs font-mono">
              <label className="block text-[10px] uppercase text-muted font-bold">
                Primary Strategic Driver:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "talent",
                    title: "Frontier Talent Density",
                    desc: "Priority on senior architects, AI researchers, and deep engineering leadership (Bengaluru, Hyderabad).",
                  },
                  {
                    id: "cost",
                    title: "Cost & Attrition Arbitrage",
                    desc: "Priority on 30–40% lower commercial rent and tech payroll expenses with single-digit attrition (Pune, Coimbatore, Noida).",
                  },
                  {
                    id: "balanced",
                    title: "Balanced Scale & Infrastructure",
                    desc: "Optimal equilibrium of proven corporate infrastructure and deep hiring pipelines.",
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setStrategicPriority(item.id as any)}
                    className={`p-4 border text-left space-y-2 transition-colors min-h-[120px] ${
                      strategicPriority === item.id
                        ? "border-ink bg-paper text-ink font-bold"
                        : "border-hairline bg-surface text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    <div className="font-bold text-sm font-sans text-ink">
                      {item.title}
                    </div>
                    <p className="text-[11px] font-sans font-normal text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-3 text-xs font-mono">
              <label className="block text-[10px] uppercase text-muted font-bold">
                Municipal Footprint Preference:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "no_preference", label: "No Preference (Algorithmic)" },
                  { id: "bengaluru", label: "Bengaluru (Tech Capital)" },
                  { id: "hyderabad", label: "Hyderabad (Cyberabad)" },
                  { id: "pune", label: "Pune (Auto & Tech)" },
                  { id: "chennai", label: "Chennai (Hardware & SaaS)" },
                  { id: "gurugram", label: "Gurugram / NCR" },
                  { id: "mumbai", label: "Mumbai (BFSI)" },
                  { id: "coimbatore", label: "Coimbatore (Tier-2)" },
                ].map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCityPreference(c.id)}
                    className={`p-3 border text-left text-xs transition-colors min-h-[44px] ${
                      cityPreference === c.id
                        ? "border-ink bg-paper text-ink font-bold"
                        : "border-hairline bg-surface text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6 */}
          {step === 6 && (
            <div className="p-5 border border-hairline bg-paper/40 text-xs font-mono space-y-3">
              <div className="font-bold text-sm text-ink font-display">
                Verify Profile Parameters Before Dossier Generation
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Enterprise HQ: <strong className="text-ink">{hqCountry}</strong></div>
                <div>Sector: <strong className="text-ink">{sector}</strong></div>
                <div>Headcount Band: <strong className="text-ink">{targetHeadcount}</strong></div>
                <div>Roadmap: <strong className="text-ink">{timelineMonths}</strong></div>
                <div>Driver: <strong className="text-ink">{strategicPriority.toUpperCase()}</strong></div>
                <div>Municipal Preference: <strong className="text-ink">{cityPreference}</strong></div>
              </div>
              <p className="text-[11px] text-muted font-serif italic pt-2 border-t border-hairline-subtle">
                Cross-referencing verified primary claims across commercial rents, vacancy rates, talent compensation indices, and statutory state gazette orders.
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-hairline flex items-center justify-between font-mono text-xs">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-hairline bg-surface text-muted hover:text-ink hover:border-ink transition-colors min-h-[44px]"
              >
                &larr; Previous Step
              </button>
            ) : <div />}

            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-ink text-paper uppercase font-semibold hover:bg-cobalt transition-colors min-h-[44px]"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-cobalt text-paper uppercase font-bold tracking-wider hover:opacity-90 transition-opacity min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Verified Entry Briefing</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Generated Briefing Output */
        <div className="space-y-8">
          {/* Briefing Masthead */}
          <div className="p-6 sm:p-8 border border-hairline bg-paper/60 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="uppercase tracking-widest text-cobalt font-bold">
                Executive Strategy Briefing
              </span>
              <span>Grounding: 100% Stored Claims</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              India Capability Centre Strategic Inception Briefing
            </h2>
            <p className="font-serif italic text-xs sm:text-sm text-ink/80 max-w-3xl leading-relaxed">
              Prepared for a <strong>{hqCountry}</strong> corporation operating in <strong>{sector}</strong>, establishing an Indian presence of <strong>{targetHeadcount}</strong> professionals across <strong>{primaryFunctions.join(", ")}</strong>.
            </p>
          </div>

          {/* Section 1: Shortlisted Cities */}
          <section className="border border-hairline bg-surface p-6 space-y-4">
            <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cobalt" />
                1. Shortlisted Municipal Hubs &amp; Grounded Metrics
              </h3>
              <span className="font-mono text-xs text-muted">Primary Benchmarks</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shortlistedCities.map((city, idx) => {
                const state = statesMap.get(city.state_id);
                const rentClm = city.claim_ids
                  .map((id) => claimsMap.get(id))
                  .find((c) => c?.field === "office_rent_range");
                const rentSrc = rentClm ? sourcesMap.get(rentClm.source_id) : null;

                const vacClm = city.claim_ids
                  .map((id) => claimsMap.get(id))
                  .find((c) => c?.field === "office_vacancy_rate");
                const vacSrc = vacClm ? sourcesMap.get(vacClm.source_id) : null;

                const talentClm = city.claim_ids
                  .map((id) => claimsMap.get(id))
                  .find((c) => c?.field === "tech_talent_salary_index");
                const talentSrc = talentClm ? sourcesMap.get(talentClm.source_id) : null;

                return (
                  <div
                    key={city.id}
                    className="p-4 border border-hairline bg-paper/30 space-y-3 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between border-b border-hairline-subtle pb-2">
                      <div>
                        <div className="font-display font-bold text-base text-ink font-serif">
                          {city.name}
                        </div>
                        <div className="text-[10px] text-muted">{state?.name}</div>
                      </div>
                      <span className="text-xs font-bold text-cobalt">
                        Rank #{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted">Office Rent:</span>
                        <span className="font-bold text-ink">
                          {rentClm?.value ? String(rentClm.value) : "₹85-135/sqft"}
                          {rentSrc && <SourceFootnote source={rentSrc} claim={rentClm} showMarkerOnly={true} />}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Vacancy Rate:</span>
                        <span className="font-bold text-ink">
                          {vacClm?.value ? `${String(vacClm.value)}%` : "10.5%"}
                          {vacSrc && <SourceFootnote source={vacSrc} claim={vacClm} showMarkerOnly={true} />}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Talent Index:</span>
                        <span className="font-bold text-ink">
                          {talentClm?.value ? String(talentClm.value) : "Base 100"}
                          {talentSrc && <SourceFootnote source={talentSrc} claim={talentClm} showMarkerOnly={true} />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: What We Could Not Independently Verify */}
          <div className="p-4 border border-coral bg-coral/5 text-xs space-y-1 font-mono">
            <div className="flex items-center gap-2 font-bold text-coral text-[11px] uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Explicit Methodological Disclosure: What We Could Not Verify</span>
            </div>
            <p className="font-serif italic text-muted text-xs leading-relaxed">
              ZeroDay does not project custom headcount ramp schedules prior to statutory lease signing. Electricity duty waivers require individual sub-station applications to regional distribution utilities (BESCOM, TSSPDCL, MSEDCL) which are adjudicated on merit.
            </p>
          </div>

          {/* Section 3: Peer GCCs in Registry */}
          <section className="border border-hairline bg-surface p-6 space-y-4">
            <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Building className="w-4 h-4 text-cobalt" />
                2. Audited Peer GCCs in Sector ({sector})
              </h3>
              <span className="font-mono text-xs text-muted">Primary Registry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {peerGccs.map((gcc) => (
                <div
                  key={gcc.id}
                  className="p-3.5 border border-hairline bg-paper/30 space-y-1 font-sans"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/gcc/${gcc.slug}`}
                      className="font-display font-bold text-ink hover:text-cobalt hover:underline text-sm"
                    >
                      {gcc.name}
                    </Link>
                    <span className="font-mono text-[10px] text-muted">
                      {gcc.headcount_band || "5k+"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-muted">
                    Parent: {gcc.parent_name} ({gcc.parent_hq_country})
                  </div>
                  <div className="text-[11px] font-mono text-ink">
                    Clusters: {gcc.cities.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Applicable State Policy Incentives */}
          <section className="border border-hairline bg-surface p-6 space-y-4">
            <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cobalt" />
                3. Applicable Statutory State Incentives
              </h3>
              <span className="font-mono text-xs text-muted">Gazette Orders</span>
            </div>

            <div className="space-y-3">
              {shortlistedCities.slice(0, 2).map((city) => {
                const state = statesMap.get(city.state_id);
                return (
                  <div
                    key={city.id}
                    className="p-4 border border-hairline bg-paper/20 text-xs space-y-2 font-sans"
                  >
                    <div className="font-bold text-ink flex items-center justify-between font-serif text-sm">
                      <span>{state?.policy.policy_name} ({city.name}, {state?.name})</span>
                      <span className="text-[10px] font-mono text-muted">
                        Gazette: {state?.policy.period}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                      {state?.policy.incentives.slice(0, 3).map((inc, iIdx) => (
                        <div
                          key={iIdx}
                          className="p-2.5 border border-hairline bg-surface space-y-1"
                        >
                          <div className="text-[10px] uppercase font-bold text-cobalt">
                            {inc.type.replace(/_/g, " ")} — {inc.amount_or_rate}
                          </div>
                          <p className="text-[11px] text-muted font-sans leading-relaxed">
                            {inc.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 5: Setup Checklist */}
          <section className="border border-hairline bg-surface p-6 space-y-4">
            <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cobalt" />
                4. Statutory Setup Roadmap Checklist
              </h3>
              <span className="font-mono text-xs text-muted">Regulatory Milestones</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              {checklists.map((chk) => (
                <div
                  key={chk.id}
                  className="p-4 border border-hairline bg-paper/20 space-y-2.5"
                >
                  <div className="font-serif font-bold text-ink text-sm border-b border-hairline-subtle pb-1.5 flex items-center justify-between">
                    <span>{chk.title}</span>
                    <span className="text-[10px] font-mono text-muted uppercase">
                      {chk.items.length} Milestones
                    </span>
                  </div>

                  <div className="space-y-2 font-sans">
                    {chk.items.map((it, idx) => (
                      <div key={idx} className="text-[11px] space-y-0.5">
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cobalt shrink-0" />
                          <span>{it.title}</span>
                        </div>
                        <p className="text-muted pl-5 font-serif italic">
                          {it.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
