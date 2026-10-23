"use client";

import React from "react";
import { City, State, Claim, Source } from "../lib/schema";
import { SourceFootnote } from "./SourceFootnote";
import { ArrowUpRight, Minus } from "lucide-react";

interface CompareTableProps {
  cities: City[];
  statesMap: Map<string, State>;
  claimsMap: Map<string, Claim>;
  sourcesMap: Map<string, Source>;
}

type IncentiveType = "rent" | "capex_subsidy" | "opex_subsidy" | "stamp_duty" | "power" | "skilling" | "other";

interface MetricRowDef {
  label: string;
  field: string;
  kind: "claim" | "policy" | "incentive";
  incentiveType?: IncentiveType;
  explanation: string;
}

interface MetricGroupDef {
  section: string;
  description: string;
  rows: MetricRowDef[];
}

const metricGroups: MetricGroupDef[] = [
  {
    section: "Market footprint & operating economics",
    description: "City-level claims attached to their source records",
    rows: [
      { label: "Tracked GCC units", field: "gcc_unit_count", kind: "claim", explanation: "Number of GCC units recorded by the cited source" },
      { label: "National market share", field: "market_share_national", kind: "claim", explanation: "Source-reported national share range" },
      { label: "Grade A office rent", field: "office_rent_range", kind: "claim", explanation: "Source-reported Grade A asking-rent range" },
      { label: "Office vacancy rate", field: "office_vacancy_rate", kind: "claim", explanation: "Reported office vacancy rate" },
      { label: "Tech talent cost index", field: "tech_talent_salary_index", kind: "claim", explanation: "Compensation index; Bengaluru baseline is 100" },
    ],
  },
  {
    section: "State policy & fiscal support",
    description: "Policy and incentive entries from the currently captured state policy record",
    rows: [
      { label: "Published state policy", field: "policy_name", kind: "policy", explanation: "Policy name and stated period" },
      { label: "Lease / rent support", field: "rent", kind: "incentive", incentiveType: "rent", explanation: "Rent or lease incentive captured for the state" },
      { label: "Capital expenditure support", field: "capex_subsidy", kind: "incentive", incentiveType: "capex_subsidy", explanation: "CapEx support captured for the state" },
      { label: "Operating expenditure support", field: "opex_subsidy", kind: "incentive", incentiveType: "opex_subsidy", explanation: "Operating support captured for the state" },
      { label: "Stamp duty / registration", field: "stamp_duty", kind: "incentive", incentiveType: "stamp_duty", explanation: "Stamp duty and registration incentives captured for the state" },
      { label: "Power / electricity support", field: "power", kind: "incentive", incentiveType: "power", explanation: "Power tariff or electricity-duty support captured for the state" },
      { label: "Talent / skilling support", field: "skilling", kind: "incentive", incentiveType: "skilling", explanation: "Recruitment, training, or skilling support captured for the state" },
      { label: "Other recorded incentive", field: "other", kind: "incentive", incentiveType: "other", explanation: "Other incentive entry in the captured state policy record" },
    ],
  },
];

function displayValue(value: Claim["value"]): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

export function CompareTable({
  cities,
  statesMap,
  claimsMap,
  sourcesMap,
}: CompareTableProps) {
  let footnoteCounter = 1;

  return (
    <div className="compare-matrix-wrap" role="region" aria-label="Side-by-side evidence ledger" tabIndex={0}>
      <table className="compare-matrix">
        <caption className="sr-only">
          Side-by-side evidence ledger comparing market economics and captured state policy support across selected Indian GCC hubs.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="compare-matrix-metric-head">
              <span>METRIC / RECORD</span>
              <small>Definition follows cited data</small>
            </th>
            {cities.map((city, index) => (
              <th scope="col" key={city.id} className="compare-matrix-city-head">
                <div className="compare-matrix-city-title">
                  <i className={"compare-city-swatch compare-tone-" + (index + 1)} aria-hidden="true" />
                  <strong>{city.name}</strong>
                </div>
                <span>{statesMap.get(city.state_id)?.name || "State not recorded"}</span>
              </th>
            ))}
          </tr>
        </thead>
        {metricGroups.map((group) => (
          <tbody key={group.section}>
            <tr className="compare-matrix-section-row">
              <th colSpan={cities.length + 1} scope="colgroup">
                <div>
                  <span>{group.section}</span>
                  <small>{group.description}</small>
                </div>
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.field} className="compare-matrix-data-row">
                <th scope="row" className="compare-matrix-metric-cell">
                  <strong>{row.label}</strong>
                  <small>{row.explanation}</small>
                </th>
                {cities.map((city) => {
                  const state = statesMap.get(city.state_id);
                  let value: string | undefined;
                  let secondary: string | undefined;
                  let source: Source | undefined;
                  let targetClaim: Claim | undefined;

                  if (row.kind === "claim") {
                    targetClaim = city.claim_ids
                      .map((id) => claimsMap.get(id))
                      .find((claim) => claim?.field === row.field);
                    if (targetClaim) {
                      value = displayValue(targetClaim.value);
                      secondary = targetClaim.as_of + " · Confidence " + targetClaim.confidence;
                      source = sourcesMap.get(targetClaim.source_id);
                    }
                  } else if (row.kind === "policy" && state?.policy) {
                    value = state.policy.policy_name;
                    secondary = "Policy period " + state.policy.period;
                    source = sourcesMap.get(state.policy.source_id);
                  } else if (row.kind === "incentive" && state?.policy) {
                    const incentive = state.policy.incentives.find((item) => item.type === row.incentiveType);
                    if (incentive) {
                      value = incentive.amount_or_rate || incentive.description;
                      secondary = incentive.amount_or_rate ? incentive.description : "Description recorded; no separate amount field";
                      source = sourcesMap.get(incentive.source_id);
                    }
                  }

                  const hasValue = Boolean(value);
                  const marker = hasValue && source ? footnoteCounter++ : undefined;

                  return (
                    <td
                      key={city.id}
                      className={"compare-matrix-value-cell" + (!hasValue ? " is-unrecorded" : "")}
                      title={targetClaim?.note || row.explanation}
                    >
                      {hasValue ? (
                        <div className="compare-matrix-value">
                          <div className="compare-matrix-value-main">
                            <span>{value}</span>
                            {source && (
                              <SourceFootnote
                                marker={marker}
                                source={source}
                                claim={targetClaim}
                                fieldLabel={city.name + " — " + row.label}
                                showMarkerOnly={true}
                                className="compare-matrix-citation"
                              />
                            )}
                            {source && (
                              <a
                                className="compare-matrix-open-source"
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={"Open source for " + city.name + " " + row.label}
                                title={"Open source: " + source.publisher}
                              >
                                <ArrowUpRight size={12} aria-hidden="true" />
                              </a>
                            )}
                          </div>
                          {secondary && <small>{secondary}</small>}
                        </div>
                      ) : (
                        <span className="compare-matrix-unrecorded">
                          <Minus size={12} aria-hidden="true" />
                          <span>Not listed in current record</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
