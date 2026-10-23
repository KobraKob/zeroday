"use client";

import React, { useState, useMemo } from "react";
import { Signal, SignalType, Source } from "../../lib/schema";
import {
  computeAllRadarScores,
  CompanyRadarScore,
  SIGNAL_WEIGHTS,
} from "../../lib/radar";
import { PageHeader } from "../../components/PageHeader";
import { SignalRow } from "../../components/SignalRow";
import { SourceFootnote } from "../../components/SourceFootnote";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import {
  Radio,
  Building,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Bell,
  X,
  Filter,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface RadarClientProps {
  signals: Signal[];
  sources: Source[];
}

export function RadarClient({ signals, sources }: RadarClientProps) {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "feed">("leaderboard");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [emailInput, setEmailInput] = useState("");
  const [alertSubscribed, setAlertSubscribed] = useState(false);

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  // Compute radar rankings
  const companyScores = useMemo(() => {
    return computeAllRadarScores(signals);
  }, [signals]);

  // Feed filtering
  const filteredSignals = useMemo(() => {
    let result = [...signals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (selectedType !== "all") {
      result = result.filter((s) => s.type === selectedType);
    }
    if (selectedCity !== "all") {
      result = result.filter((s) => s.city === selectedCity);
    }

    return result;
  }, [signals, selectedType, selectedCity]);

  // Unique cities from signals
  const signalCities = useMemo(() => {
    const set = new Set<string>();
    signals.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set).sort();
  }, [signals]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setAlertSubscribed(true);
      setTimeout(() => setAlertSubscribed(false), 5000);
      setEmailInput("");
    }
  };

  const imminentCount = useMemo(() => {
    return companyScores.filter((c) => c.status === "Imminent").length;
  }, [companyScores]);

  const signalLandscape = useMemo(() => {
    const byCity = new Map<string, number>(); const byType = new Map<string, number>(); const byMonth = new Map<string, number>();
    signals.forEach((signal) => { if (signal.city) byCity.set(signal.city, (byCity.get(signal.city) ?? 0) + 1); byType.set(signal.type, (byType.get(signal.type) ?? 0) + 1); const month = String(signal.date).slice(0, 7); if (month.length === 7) byMonth.set(month, (byMonth.get(month) ?? 0) + 1); });
    const cities = Array.from(byCity.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 5);
    const types = Array.from(byType.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const timeline = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, count]) => ({ month, count }));
    return { cities, types, timeline };
  }, [signals]);
  const timelineMax = Math.max(1, ...signalLandscape.timeline.map((point) => point.count));
  const timelinePoints = signalLandscape.timeline.map((point, index) => ({ ...point, x: signalLandscape.timeline.length <= 1 ? 12 : 12 + (index * 276) / (signalLandscape.timeline.length - 1), y: 82 - (point.count / timelineMax) * 62 }));
  const timelinePath = timelinePoints.map((point, index) => (index === 0 ? 'M' : 'L') + ' ' + point.x + ' ' + point.y).join(' ');
  const timelineArea = timelinePoints.length ? timelinePath + ' L ' + timelinePoints[timelinePoints.length - 1].x + ' 90 L ' + timelinePoints[0].x + ' 90 Z' : '';
  return (
    <div className="radar-atlas space-y-8 font-sans">
      {/* Editorial Header */}
      <PageHeader
        rubric="Predictive Signal Intelligence"
        findingHeadline={`Early-intent radar tracks ${companyScores.length} prospective entries, with ${imminentCount} imminent launches`}
        findingDescription="Calculates entry likelihood indices (0–100) using a 60-day half-life exponential decay model across Ministry of Corporate Affairs (MCA) incorporations, GST tax circle registrations, executive headhunts, and commercial office lease deeds."
        pageTitle="GCC Radar Signal Intelligence"
        path="/radar"
        metadata="60-Day Decay Model"
      />


      <section className="radar-command-center" aria-labelledby="radar-landscape-title">
        <div className="radar-landscape-heading"><div><p className="radar-kicker">THE SIGNAL LANDSCAPE</p><h2 id="radar-landscape-title">Read the market before it moves.</h2><p>Explore the evidence shaping each entry likelihood. Select a chart segment to inspect its underlying signals.</p></div><div className="radar-model-chip"><span className="radar-live-mark" /> 60-day decay model <span className="radar-chip-divider" /> Based on recorded evidence</div></div>
        <div className="radar-metric-grid">
          <article className="radar-metric radar-metric--lead"><span className="radar-metric-label">Recorded signals</span><strong>{signals.length.toLocaleString("en-IN")}</strong><span className="radar-metric-note">Evidence events in ledger</span><div className="radar-metric-ticks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
          <article className="radar-metric"><span className="radar-metric-label">Prospective entries</span><strong>{companyScores.length.toLocaleString("en-IN")}</strong><span className="radar-metric-note">Companies with scored signals</span></article>
          <article className="radar-metric"><span className="radar-metric-label">Cities represented</span><strong>{signalCities.length.toLocaleString("en-IN")}</strong><span className="radar-metric-note">Locations named in the ledger</span></article>
          <article className="radar-metric radar-metric--alert"><span className="radar-metric-label">Imminent index</span><strong>{imminentCount.toLocaleString("en-IN")}</strong><span className="radar-metric-note">Score at or above 75</span></article>
        </div>
        <div className="radar-insight-grid">
          <article className="radar-panel radar-timeline-panel"><div className="radar-panel-head"><div><p className="radar-kicker">SIGNAL MOMENTUM</p><h3>Evidence by month</h3></div><span className="radar-panel-index">01 / TIMELINE</span></div>
            {timelinePoints.length > 0 ? <><div className="radar-chart-wrap"><svg viewBox="0 0 300 104" role="img" aria-label="Monthly signal counts across the latest six months represented in the ledger" className="radar-line-chart" preserveAspectRatio="none"><line x1="8" y1="20" x2="292" y2="20" /><line x1="8" y1="50" x2="292" y2="50" /><line x1="8" y1="90" x2="292" y2="90" /><path className="radar-chart-area" d={timelineArea} /><path className="radar-chart-line" d={timelinePath} />{timelinePoints.map((point) => <circle key={point.month} cx={point.x} cy={point.y} r="3.2"><title>{point.month}: {point.count} signals</title></circle>)}</svg></div><div className="radar-chart-labels">{timelinePoints.map((point) => <div key={point.month}><strong>{point.count}</strong><span>{point.month.slice(5, 7)}/{point.month.slice(2, 4)}</span></div>)}</div><p className="radar-panel-footnote">Counts reflect recorded signal dates, not a forecast. Months without records are omitted.</p></> : <div className="radar-empty-state">No dated signals available for the timeline.</div>}
          </article>
          <article className="radar-panel radar-city-panel"><div className="radar-panel-head"><div><p className="radar-kicker">GEOGRAPHIC FOOTPRINT</p><h3>Where evidence clusters</h3></div><span className="radar-panel-index">02 / CITIES</span></div>
            {signalLandscape.cities.length > 0 ? <div className="radar-city-list">{signalLandscape.cities.map((city, index) => <button type="button" key={city.name} className="radar-city-row" onClick={() => { setSelectedCity(city.name); setActiveTab("feed"); }} aria-label={"View " + city.count + " signals in " + city.name}><span className="radar-city-rank">0{index + 1}</span><span className="radar-city-name">{city.name}</span><span className="radar-city-track"><span style={{ width: Math.max(7, (city.count / Math.max(1, signalLandscape.cities[0].count)) * 100) + "%" }} /></span><strong className="radar-city-count">{city.count}</strong><ChevronRight size={14} aria-hidden="true" /></button>)}</div> : <div className="radar-empty-state">No city tags are present in the current signal set.</div>}
            <p className="radar-panel-footnote">Select a city to open its chronological evidence ledger.</p>
          </article>
        </div>
        <article className="radar-panel radar-type-panel"><div className="radar-panel-head"><div><p className="radar-kicker">EVIDENCE MIX</p><h3>Signals by source type</h3></div><span className="radar-panel-index">03 / CLASSIFICATION</span></div><div className="radar-type-grid">{signalLandscape.types.map((item, index) => <button type="button" key={item.name} className="radar-type-item" onClick={() => { setSelectedType(item.name); setActiveTab("feed"); }} title={"Filter ledger to " + item.name.replace(/_/g, " ")}><span className={"radar-type-mark radar-type-mark--" + (index % 4)} /><span className="radar-type-copy"><span>{item.name.replace(/_/g, " ")}</span><strong>{item.count}</strong></span><span className="radar-type-track"><span className={"radar-type-fill radar-type-fill--" + (index % 4)} style={{ width: Math.max(4, (item.count / Math.max(1, signalLandscape.types[0].count)) * 100) + "%" }} /></span></button>)}</div></article>
      </section>

      {/* Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline">
        <div className="flex gap-1" role="tablist" aria-label="Radar Views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "leaderboard"}
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider border-b-2 min-h-[44px] transition-colors duration-fast ${
              activeTab === "leaderboard"
                ? "border-cobalt text-ink font-bold bg-surface"
                : "border-transparent text-muted hover:text-ink hover:border-hairline"
            }`}
          >
            Likelihood Leaderboard ({companyScores.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "feed"}
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider border-b-2 min-h-[44px] transition-colors duration-fast ${
              activeTab === "feed"
                ? "border-cobalt text-ink font-bold bg-surface"
                : "border-transparent text-muted hover:text-ink hover:border-hairline"
            }`}
          >
            Chronological Signal Ledger ({signals.length})
          </button>
        </div>

        {/* Decay Model Explainer Callout */}
        <div className="text-xs font-mono text-muted flex items-center gap-2 pb-2 sm:pb-0">
          <span className="w-2 h-2 bg-coral inline-block"></span>
          <span>Imminent threshold &ge; 75 pts</span>
        </div>
      </div>

      {/* Tab 1: Leaderboard View */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          {/* Methodology Formula Banner */}
          <div className="p-4 border border-hairline bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-muted uppercase text-[10px] font-bold block">
                Mathematical Scoring Model
              </span>
              <div className="font-bold text-ink text-sm mt-0.5">
                Score = Σ(Weight × e^(-λ × Δt)) &nbsp;•&nbsp; λ = ln(2) / 60 days
              </div>
              <div className="text-[11px] text-muted mt-1 font-serif italic">
                Weights: RoC Entity = 35 | Commercial Lease = 30 | Leadership Hire = 20 | State MoU = 15 | Press = 10
              </div>
            </div>

            <div className="sm:border-l sm:border-hairline sm:pl-4 text-xs font-mono text-muted">
              <div>Half-Life: 60 Days</div>
              <div>Max Score: 100</div>
            </div>
          </div>

          {/* List of Signal Rows with Inline Expansion */}
          <div className="border border-hairline bg-surface divide-y divide-hairline">
            <div className="px-4 py-2.5 bg-paper/90 border-b border-ink font-mono text-[11px] uppercase tracking-wider text-muted flex items-center justify-between">
              <span>Prospective Enterprise &amp; Signal Trail</span>
              <span>Likelihood Index / Status</span>
            </div>

            {companyScores.map((score) => (
              <SignalRow
                key={score.companyName}
                score={score}
                sourcesMap={sourcesMap}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Chronological Signal Feed */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          {/* Sticky Filters for Feed */}
          <div className="sticky top-14 z-20 border border-hairline bg-paper/95 backdrop-blur-xs p-3.5 flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase text-muted font-bold">Signal Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="py-1 px-2 border border-hairline bg-surface text-ink text-xs min-h-[36px]"
              >
                <option value="all">All Event Types</option>
                <option value="roc_incorporation">RoC Entity Incorporation</option>
                <option value="gst_registration">GST Circle Registration</option>
                <option value="leadership_hire">Leadership Headhunt</option>
                <option value="commercial_lease">Commercial Office Lease</option>
                <option value="state_mou">State Government MoU</option>
                <option value="newsroom_release">Corporate Newsroom Release</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase text-muted font-bold">Cluster City:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="py-1 px-2 border border-hairline bg-surface text-ink text-xs min-h-[36px]"
              >
                <option value="all">All Cities ({signalCities.length})</option>
                {signalCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {(selectedType !== "all" || selectedCity !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType("all");
                  setSelectedCity("all");
                }}
                className="text-cobalt hover:text-ink hover:underline text-xs"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Feed Ruled Table */}
          <div className="border border-hairline bg-surface overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th scope="col" className="py-3 px-4 min-w-[110px]">Date</th>
                  <th scope="col" className="py-3 px-4 min-w-[180px]">Enterprise</th>
                  <th scope="col" className="py-3 px-4 min-w-[160px]">Signal Classification</th>
                  <th scope="col" className="py-3 px-4 min-w-[260px]">Audited Evidence Details</th>
                  <th scope="col" className="py-3 px-3 text-center min-w-[100px]">Confidence</th>
                  <th scope="col" className="py-3 px-3 text-right min-w-[80px]">Footnote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredSignals.map((sig, idx) => {
                  const source = sig.source_id ? sourcesMap.get(sig.source_id) : null;

                  return (
                    <tr key={sig.id} className="hover:bg-paper/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted tabular-nums whitespace-nowrap">
                        {sig.date}
                      </td>
                      <td className="py-3 px-4 font-display font-bold text-sm text-ink">
                        {sig.company_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-ink">
                        <span className="inline-block px-1.5 py-0.5 border border-hairline bg-paper/60 uppercase">
                          {sig.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-ink/90 font-sans">
                        <div>{sig.note}</div>
                        {sig.city && (
                          <span className="font-mono text-[10px] text-muted block mt-0.5">
                            Cluster: {sig.city}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <ConfidenceStamp grade="B" size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {source ? (
                          <SourceFootnote
                            marker={idx + 1}
                            source={source}
                            fieldLabel={`${sig.company_name} — ${sig.type}`}
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
        </div>
      )}

      {/* Sourced Regulatory Dispatch Subscription */}
      <section className="border border-hairline bg-paper/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              Automated Gazette Dispatch
            </span>
            <h3 className="font-display font-bold text-lg text-ink">
              Receive Sourced Filing Notifications
            </h3>
            <p className="font-serif italic text-xs text-muted max-w-prose">
              Dispatches when verified RoC entity incorporations or official state gazette decrees are recorded in ZeroDay. No promotional newsletters.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              required
              placeholder="enterprise@domain.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="py-2 px-3 border border-hairline bg-surface text-xs font-mono text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px] min-w-[240px]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-ink text-paper text-xs font-mono font-semibold uppercase tracking-wider hover:bg-cobalt transition-colors duration-fast min-h-[44px] whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>

        {alertSubscribed && (
          <div className="p-3 border border-cobalt bg-cobalt/10 text-xs font-mono text-cobalt flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Filing alert active. You will receive primary gazette updates as verified.</span>
          </div>
        )}
      </section>
    </div>
  );
}
