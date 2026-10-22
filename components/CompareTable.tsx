"use client";

import React from "react";
import { City, State, Claim, Source } from "../lib/schema";
import { SourceFootnote } from "./SourceFootnote";
import { ExternalLink, Check, AlertCircle } from "lucide-react";

interface CompareTableProps {
  cities: City[];
  statesMap: Map<string, State>;
  claimsMap: Map<string, Claim>;
  sourcesMap: Map<string, Source>;
}

interface MetricRowDef {
  label: string;
  field: string;
  category: "real_estate" | "talent" | "policy" | "connectivity";
  format?: (value: any, claim?: Claim) => string;
  unit?: string;
  isCityMetric?: boolean;
}

export function CompareTable({
  cities,
  statesMap,
  claimsMap,
  sourcesMap,
}: CompareTableProps) {
  const metrics: { section: string; rows: MetricRowDef[] }[] = [
    {
      section: "Commercial Real Estate Benchmarks",
      rows: [
        {
          label: "Grade A Office Rent (INR / sq ft / mo)",
          field: "rent_office_grade_a",
          category: "real_estate",
          unit: "₹/sqft",
          isCityMetric: true,
        },
        {
          label: "Office Vacancy Rate",
          field: "office_vacancy_rate",
          category: "real_estate",
          unit: "%",
          isCityMetric: true,
        },
        {
          label: "Operating GCC Campuses Count",
          field: "gcc_count",
          category: "real_estate",
          unit: "campuses",
          isCityMetric: true,
        },
        {
          label: "Primary GCC Micro-Markets",
          field: "primary_clusters",
          category: "real_estate",
          format: (val) => (Array.isArray(val) ? val.join(", ") : String(val)),
          isCityMetric: true,
        },
      ],
    },
    {
      section: "Talent Economics & Tech Compensation",
      rows: [
        {
          label: "Tech Compensation Index (Bengaluru = 100)",
          field: "talent_cost_index",
          category: "talent",
          unit: "pts",
          isCityMetric: true,
        },
        {
          label: "Annual Engineering Graduates Pool",
          field: "graduates_annual_pool",
          category: "talent",
          unit: "grads/yr",
          isCityMetric: true,
        },
        {
          label: "Average Tech Attrition Rate",
          field: "tech_attrition_rate",
          category: "talent",
          unit: "%",
          isCityMetric: true,
        },
      ],
    },
    {
      section: "Infrastructure & Air Connectivity",
      rows: [
        {
          label: "International Flight Destinations Direct",
          field: "airport_direct_destinations",
          category: "connectivity",
          unit: "destinations",
          isCityMetric: true,
        },
        {
          label: "Operational Metro Rail Network",
          field: "metro_network_length_km",
          category: "connectivity",
          unit: "km",
          isCityMetric: true,
        },
      ],
    },
    {
      section: "Statutory State Policy & Fiscal Incentives",
      rows: [
        {
          label: "Gazetted State GCC Policy",
          field: "gcc_policy_name",
          category: "policy",
          isCityMetric: false,
        },
        {
          label: "Electricity Duty Exemption Duration",
          field: "power_duty_exemption_years",
          category: "policy",
          unit: "years",
          isCityMetric: false,
        },
        {
          label: "Patent / R&D Filing Subsidy",
          field: "patent_subsidy_amount",
          category: "policy",
          isCityMetric: false,
        },
        {
          label: "Stamp Duty & Lease Registration Subsidy",
          field: "stamp_duty_concession_pct",
          category: "policy",
          unit: "%",
          isCityMetric: false,
        },
      ],
    },
  ];

  let footnoteCounter = 1;

  return (
    <div className="w-full border border-hairline bg-surface overflow-x-auto">
      <table className="w-full text-left border-collapse font-sans text-xs">
        <caption className="sr-only">
          Side-by-side comparative ledger of target Indian GCC hubs
        </caption>
        <thead>
          <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[11px] uppercase tracking-wider text-muted">
            {/* Sticky first column */}
            <th
              scope="col"
              className="sticky left-0 z-20 bg-paper/95 backdrop-blur-xs py-3.5 px-4 min-w-[240px] max-w-[280px] border-r border-hairline font-semibold text-ink"
            >
              Metric / Verification Rubric
            </th>
            {cities.map((city) => (
              <th
                key={city.id}
                scope="col"
                className="py-3.5 px-4 min-w-[190px] font-semibold text-ink text-left border-r border-hairline last:border-r-0"
              >
                <div className="font-display text-base font-bold text-ink normal-case">
                  {city.name}
                </div>
                <div className="text-[10px] font-mono text-muted tracking-normal uppercase">
                  {statesMap.get(city.state_id)?.name || "State Verified"}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {metrics.map((group) => (
            <React.Fragment key={group.section}>
              {/* Category Section Header */}
              <tr className="bg-paper/70 border-y border-hairline font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                <td
                  colSpan={cities.length + 1}
                  className="py-2.5 px-4 sticky left-0 z-10 bg-paper/90"
                >
                  § {group.section}
                </td>
              </tr>

              {group.rows.map((metricRow) => (
                <tr key={metricRow.field} className="hover:bg-paper/30 transition-colors">
                  {/* Sticky First Column Metric Name */}
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface hover:bg-paper/30 py-3 px-4 font-mono text-xs font-medium text-ink border-r border-hairline leading-snug"
                  >
                    {metricRow.label}
                  </th>

                  {/* City Benchmark Cells */}
                  {cities.map((city) => {
                    const state = statesMap.get(city.state_id);
                    let rawValue: any = null;
                    let targetClaim: Claim | undefined = undefined;

                    if (metricRow.isCityMetric) {
                      rawValue = (city as any)[metricRow.field];
                      targetClaim = (city.claim_ids || [])
                        .map((id) => claimsMap.get(id))
                        .find((c) => c?.field === metricRow.field);
                    } else if (state) {
                      if (metricRow.field === "gcc_policy_name") {
                        rawValue = state.policy?.policy_name;
                      } else {
                        const inc = state.policy?.incentives?.find((i) =>
                          metricRow.field.includes(i.type) || i.type === metricRow.field
                        );
                        rawValue = inc?.amount_or_rate || inc?.description || (state as any)[metricRow.field];
                      }
                    }

                    const val = targetClaim?.value ?? rawValue;
                    const hasValue = val !== undefined && val !== null && val !== "";
                    const source = targetClaim ? sourcesMap.get(targetClaim.source_id) : null;
                    const currentMarker = hasValue && source ? footnoteCounter++ : undefined;

                    if (!hasValue) {
                      return (
                        <td
                          key={city.id}
                          className="py-3 px-4 bg-hatched text-muted border-r border-hairline last:border-r-0 select-none text-center"
                          title="Data point unverified or not yet sourced in primary gazette"
                        >
                          <span className="font-mono text-[10px] uppercase text-muted/70 tracking-widest bg-surface/90 px-1 py-0.5 border border-hairline-subtle">
                            [Not yet sourced]
                          </span>
                        </td>
                      );
                    }

                    const formattedDisplay = metricRow.format
                      ? metricRow.format(val, targetClaim)
                      : String(val);

                    return (
                      <td
                        key={city.id}
                        className="py-3 px-4 border-r border-hairline last:border-r-0 text-ink tabular-nums font-mono text-xs"
                      >
                        <div className="flex items-baseline justify-between gap-1.5">
                          <span className="font-medium">
                            {formattedDisplay}
                            {metricRow.unit && (
                              <span className="text-[10px] text-muted font-sans ml-1">
                                {metricRow.unit}
                              </span>
                            )}
                          </span>

                          {source && (
                            <SourceFootnote
                              marker={currentMarker}
                              source={source}
                              claim={targetClaim}
                              fieldLabel={`${city.name} — ${metricRow.label}`}
                              showMarkerOnly={true}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
