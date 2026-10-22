"use client";

import React, { useState, useMemo } from "react";
import { City, State, Claim, Source } from "../../lib/schema";
import { PageHeader } from "../../components/PageHeader";
import { CompareTable } from "../../components/CompareTable";
import { SourceFootnote } from "../../components/SourceFootnote";
import {
  Compass,
  Building,
  Plus,
  X,
  FileText,
  Shield,
  CheckCircle2,
} from "lucide-react";

interface CompareClientProps {
  cities: City[];
  states: State[];
  claims: Claim[];
  sources: Source[];
}

export function CompareClient({
  cities,
  states,
  claims,
  sources,
}: CompareClientProps) {
  // Default selected: Bengaluru, Hyderabad, Pune
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([
    "city-blr",
    "city-hyd",
    "city-pun",
  ]);

  const statesMap = useMemo(() => {
    const map = new Map<string, State>();
    states.forEach((s) => map.set(s.id, s));
    return map;
  }, [states]);

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

  const selectedCities = selectedCityIds
    .map((id) => cities.find((c) => c.id === id))
    .filter(Boolean) as City[];

  const handleToggleCity = (id: string) => {
    if (selectedCityIds.includes(id)) {
      if (selectedCityIds.length > 2) {
        setSelectedCityIds(selectedCityIds.filter((c) => c !== id));
      }
    } else {
      if (selectedCityIds.length < 4) {
        setSelectedCityIds([...selectedCityIds, id]);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Editorial Header */}
      <PageHeader
        rubric="Comparative Site Selection Ledger"
        findingHeadline="Bengaluru leads in talent depth; Hyderabad and Pune offer 24% to 38% real estate arbitrage"
        findingDescription="Side-by-side audit of commercial Grade A office rents, vacancy rates, talent compensation indices, and statutory state gazette policy subsidies across 2 to 4 target locations."
        pageTitle="GCC City & State Policy Comparison"
        path="/compare"
        metadata={`${selectedCityIds.length} Hubs Selected`}
      />

      {/* City Selector Strip */}
      <section
        aria-label="City Hub Selector"
        className="p-4 border border-hairline bg-surface space-y-3 font-mono text-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="uppercase font-bold text-ink text-[11px] tracking-wider">
            Select 2 to 4 Target Indian Hubs to Audit Side-by-Side:
          </span>
          <span className="text-[10px] text-muted uppercase">
            Currently {selectedCityIds.length} active (Min 2 • Max 4)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {cities.map((city) => {
            const isSelected = selectedCityIds.includes(city.id);
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleToggleCity(city.id)}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-mono font-medium transition-colors duration-fast flex items-center gap-2 border ${
                  isSelected
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper/40 text-muted border-hairline hover:border-ink hover:text-ink"
                }`}
              >
                <span>{city.name}</span>
                <span className="text-[10px] opacity-70">[{statesMap.get(city.state_id)?.name || "India"}]</span>
                {isSelected ? (
                  <X className="w-3.5 h-3.5 text-paper/80" />
                ) : (
                  <Plus className="w-3.5 h-3.5 opacity-50" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Side-by-Side Comparison Table with Sticky First Column & Hatched Cells */}
      <section aria-label="Comparative Metrics Table">
        <CompareTable
          cities={selectedCities}
          statesMap={statesMap}
          claimsMap={claimsMap}
          sourcesMap={sourcesMap}
        />
      </section>

      {/* Statutory Gazette Policy Comparison Note */}
      <section className="border border-hairline bg-paper/40 p-6 space-y-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-ink">
          <Shield className="w-3.5 h-3.5 text-verdigris" strokeWidth={1.5} />
          <span>Statutory Gazette Verification Rule</span>
        </div>
        <p className="font-serif italic text-xs text-muted leading-relaxed max-w-prose">
          All state policy subsidies listed above (electricity duty waivers, stamp duty rebates, and patent filings) reflect officially notified Government Orders (GOs) and State Gazettes. Promotional investment summits and non-binding MoUs without statutory notification are excluded.
        </p>
      </section>
    </div>
  );
}
