"use client";

import React, { useState } from "react";
import { CompanyRadarScore } from "../lib/radar";
import { Source } from "../lib/schema";
import { SourceFootnote } from "./SourceFootnote";
import { ConfidenceStamp } from "./ConfidenceStamp";
import { ChevronDown, ChevronRight, AlertCircle, Building2, MapPin, Calendar, FileText } from "lucide-react";

interface SignalRowProps {
  score: CompanyRadarScore;
  sourcesMap: Map<string, Source>;
}

export function SignalRow({ score, sourcesMap }: SignalRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isImminent = score.status === "Imminent";
  const isArrived = score.status === "Arrived";

  return (
    <div
      className={`border-b border-hairline transition-colors duration-fast ${
        isOpen ? "bg-paper/60" : "bg-surface hover:bg-paper/30"
      }`}
    >
      {/* Primary Summary Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? `Collapse ${score.companyName}` : `Expand ${score.companyName}`}
            className="w-6 h-6 flex items-center justify-center text-muted hover:text-ink shrink-0"
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-cobalt" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-base text-ink tracking-tight truncate">
                {score.companyName}
              </span>
              {score.targetCities.length > 0 && (
                <span className="text-xs font-mono text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cobalt" />
                  {score.targetCities.join(", ")}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-muted mt-0.5">
              Latest Signal: {score.latestSignalDate || "Current Quarter"} • {score.contributingSignals.length} events
            </div>
          </div>
        </div>

        {/* Right side: Score & Status Stamp */}
        <div className="flex items-center gap-4 sm:shrink-0 pl-9 sm:pl-0">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted block">
              Likelihood Index
            </span>
            <span
              className={`font-mono text-lg font-bold tabular-nums ${
                isImminent ? "text-coral" : "text-ink"
              }`}
            >
              {score.score}/100
            </span>
          </div>

          <div className="text-right min-w-[90px]">
            <span className="text-[10px] font-mono uppercase text-muted block mb-0.5">
              Entry Status
            </span>
            <span
              className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 border ${
                isImminent
                  ? "border-coral text-coral bg-coral/10"
                  : isArrived
                  ? "border-cobalt text-cobalt bg-cobalt/10"
                  : "border-hairline text-muted bg-paper/50"
              }`}
            >
              {score.status}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Signal Audit Trail */}
      {isOpen && (
        <div className="px-4 pb-5 pt-2 pl-12 pr-4 border-t border-hairline-subtle bg-paper/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-muted border-b border-hairline-subtle pb-2">
            <span className="uppercase font-semibold tracking-wider text-ink">
              Audited Signal Trail ({score.contributingSignals.length} Event{score.contributingSignals.length > 1 ? "s" : ""})
            </span>
            <span>60-Day Exponential Half-Life Decay</span>
          </div>

          <div className="border border-hairline overflow-x-auto bg-surface">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-paper/80 font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Signal Classification</th>
                  <th className="py-2 px-3">Verified Details</th>
                  <th className="py-2 px-3 text-center">Decayed Weight</th>
                  <th className="py-2 px-3 text-center">Confidence</th>
                  <th className="py-2 px-3 text-right">Source Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {score.contributingSignals.map((contrib, idx) => {
                  const sig = contrib.signal;
                  const source = sig.source_id ? sourcesMap.get(sig.source_id) : null;

                  return (
                    <tr key={sig.id} className="hover:bg-paper/30">
                      <td className="py-2.5 px-3 font-mono text-muted tabular-nums whitespace-nowrap">
                        {sig.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-ink">
                        <span className="inline-block px-1.5 py-0.5 border border-hairline bg-paper text-[10px] uppercase">
                          {sig.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-ink text-xs">
                        <div>{sig.note}</div>
                        {sig.city && (
                          <div className="font-mono text-[10px] text-muted mt-0.5">
                            Cluster: {sig.city}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cobalt tabular-nums">
                        +{contrib.decayedWeight} pts
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <ConfidenceStamp grade="B" size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {source ? (
                          <SourceFootnote
                            marker={idx + 1}
                            source={source}
                            fieldLabel={`${score.companyName} — ${sig.type}`}
                            showMarkerOnly={true}
                          />
                        ) : (
                          <span className="text-muted font-mono text-[11px]">—</span>
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
    </div>
  );
}
