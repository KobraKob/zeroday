"use client";

import React, { useMemo, useState } from "react";
import { Check, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { City, Claim, Source, State } from "../../lib/schema";
import { CitationButton } from "../../components/CitationButton";
import { CompareTable } from "../../components/CompareTable";

interface CompareClientProps {
  cities: City[];
  states: State[];
  claims: Claim[];
  sources: Source[];
}

type CompareMetricKey =
  | "office_rent_range"
  | "office_vacancy_rate"
  | "tech_talent_salary_index"
  | "gcc_unit_count"
  | "market_share_national";

interface CompareMetric {
  key: CompareMetricKey;
  label: string;
  sublabel: string;
  scale: number;
  scaleLabel: string;
  range: boolean;
  description: string;
}

const METRICS: CompareMetric[] = [
  {
    key: "office_rent_range",
    label: "Office rent",
    sublabel: "₹ / sq ft / month",
    scale: 300,
    scaleLabel: "₹300",
    range: true,
    description: "Recorded Grade A asking-rent bands. A shorter band is not necessarily a better lease deal.",
  },
  {
    key: "office_vacancy_rate",
    label: "Vacancy",
    sublabel: "% of office stock",
    scale: 20,
    scaleLabel: "20%",
    range: false,
    description: "Reported office vacancy rate. Market definitions and survey periods can differ by source.",
  },
  {
    key: "tech_talent_salary_index",
    label: "Talent cost",
    sublabel: "Index · Bengaluru = 100",
    scale: 110,
    scaleLabel: "110",
    range: false,
    description: "Compensation index relative to Bengaluru. Lower values indicate lower reported relative cost.",
  },
  {
    key: "gcc_unit_count",
    label: "GCC footprint",
    sublabel: "Tracked units",
    scale: 1000,
    scaleLabel: "1,000",
    range: false,
    description: "Tracked GCC units in the cited record. This is not a count of every legal entity or operating site.",
  },
  {
    key: "market_share_national",
    label: "National share",
    sublabel: "% of recorded market",
    scale: 45,
    scaleLabel: "45%",
    range: true,
    description: "The source records a range rather than a single point estimate. Treat this as directional context.",
  },
];

function numericParts(value: Claim["value"] | undefined): number[] {
  if (typeof value === "number") return [value];
  if (typeof value !== "string") return [];
  return (value.match(/\d[\d,]*(?:\.\d+)?/g) || [])
    .map((part) => Number(part.replace(/,/g, "")))
    .filter((part) => Number.isFinite(part));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function claimForCity(
  city: City,
  claimsById: Map<string, Claim>,
  field: string,
): Claim | undefined {
  return city.claim_ids
    .map((id) => claimsById.get(id))
    .find((claim) => claim?.field === field);
}

function displayBand(low: number, high: number, prefix = ""): string {
  const format = (value: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);
  return prefix + format(low) + "–" + prefix + format(high);
}

export function CompareClient({
  cities,
  states,
  claims,
  sources,
}: CompareClientProps) {
  const preferredDefaults = ["city-blr", "city-hyd", "city-pun"].filter((id) =>
    cities.some((city) => city.id === id),
  );
  const fallbackDefaults = cities.slice(0, 3).map((city) => city.id);
  const defaultSelection =
    preferredDefaults.length >= 2 ? preferredDefaults : fallbackDefaults;

  const [selectedCityIds, setSelectedCityIds] = useState<string[]>(() => defaultSelection.slice(0, 4));
  const [activeMetricKey, setActiveMetricKey] =
    useState<CompareMetricKey>("office_rent_range");
  const [citySearch, setCitySearch] = useState("");

  const statesMap = useMemo(() => {
    const map = new Map<string, State>();
    states.forEach((state) => map.set(state.id, state));
    return map;
  }, [states]);

  const claimsById = useMemo(() => {
    const map = new Map<string, Claim>();
    claims.forEach((claim) => map.set(claim.id, claim));
    return map;
  }, [claims]);

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((source) => map.set(source.id, source));
    return map;
  }, [sources]);

  const selectedCities = useMemo(
    () =>
      selectedCityIds
        .map((id) => cities.find((city) => city.id === id))
        .filter((city): city is City => Boolean(city)),
    [cities, selectedCityIds],
  );

  const activeMetric =
    METRICS.find((metric) => metric.key === activeMetricKey) || METRICS[0];

  const chartRows = useMemo(
    () =>
      selectedCities.map((city) => {
        const claim = claimForCity(city, claimsById, activeMetric.key);
        const values = numericParts(claim?.value);
        const low = values.length ? values[0] : 0;
        const high = values.length > 1 ? values[1] : low;
        const hasValue = Boolean(claim && values.length);
        const left = activeMetric.range && values.length > 1
          ? clamp((low / activeMetric.scale) * 100, 0, 96)
          : 0;
        const width = activeMetric.range && values.length > 1
          ? clamp(((high - low) / activeMetric.scale) * 100, 3, 100 - left)
          : clamp((high / activeMetric.scale) * 100, 2, 100);

        return {
          city,
          claim,
          low,
          high,
          left,
          width,
          hasValue,
        };
      }),
    [activeMetric, claimsById, selectedCities],
  );

  const citySearchResults = useMemo(() => {
    const query = citySearch.trim().toLowerCase();
    if (!query) return cities;
    return cities.filter((city) => {
      const stateName = statesMap.get(city.state_id)?.name || "";
      return (city.name + " " + stateName).toLowerCase().includes(query);
    });
  }, [cities, citySearch, statesMap]);

  const selectedClaims = selectedCities.flatMap((city) =>
    city.claim_ids
      .map((id) => claimsById.get(id))
      .filter((claim): claim is Claim => Boolean(claim)),
  );
  const matchedSourceClaims = selectedClaims.filter((claim) =>
    sourcesMap.has(claim.source_id),
  );

  const rentData = selectedCities
    .map((city) => ({
      city,
      claim: claimForCity(city, claimsById, "office_rent_range"),
      values: numericParts(claimForCity(city, claimsById, "office_rent_range")?.value),
    }))
    .filter((row) => row.values.length > 0);
  const rentLows = rentData.map((row) => row.values[0]);
  const rentHighs = rentData.map((row) => row.values[row.values.length > 1 ? 1 : 0]);
  const rentSpread =
    rentLows.length > 0
      ? displayBand(Math.min(...rentLows), Math.max(...rentHighs), "₹")
      : "Not recorded";

  const talentValues = selectedCities
    .map((city) => claimForCity(city, claimsById, "tech_talent_salary_index"))
    .filter((claim): claim is Claim => Boolean(claim))
    .map((claim) => numericParts(claim.value)[0])
    .filter((value) => Number.isFinite(value));
  const talentSpread =
    talentValues.length > 0
      ? Math.min(...talentValues) + "–" + Math.max(...talentValues)
      : "Not recorded";

  const largestFootprint = selectedCities
    .map((city) => ({
      city,
      claim: claimForCity(city, claimsById, "gcc_unit_count"),
      value: numericParts(claimForCity(city, claimsById, "gcc_unit_count")?.value)[0] || 0,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)[0];

  const toggleCity = (cityId: string) => {
    setSelectedCityIds((current) => {
      if (current.includes(cityId)) {
        return current.length > 2 ? current.filter((id) => id !== cityId) : current;
      }
      return current.length < 4 ? [...current, cityId] : current;
    });
  };

  const resetSelection = () => setSelectedCityIds(defaultSelection.slice(0, 4));

  return (
    <div className="compare-studio">
      <header className="compare-hero">
        <div className="compare-hero-topline">
          <p className="compare-kicker">ZERO DAY / DECISION STUDIO / 01 — MARKET SELECTION</p>
          <CitationButton pageTitle="GCC City & State Policy Comparison" path="/compare" />
        </div>

        <div className="compare-hero-grid">
          <div className="compare-hero-copy">
            <h1>
              Choose your next
              <span> GCC footprint.</span>
            </h1>
            <p>
              Put city economics and state-policy support side by side.
              Every figure stays attached to its cited record.
            </p>
            <div className="compare-hero-meta">
              <span><i aria-hidden="true" /> Evidence-linked comparison</span>
              <span>{cities.length} city records in this view</span>
              <span>2–4 hubs per comparison</span>
            </div>
          </div>

          <aside className="compare-hero-index" aria-label="Comparison set status">
            <div className="compare-index-top">
              <span>ACTIVE SET</span>
              <span className="compare-index-mark">ZD / 01</span>
            </div>
            <strong>{String(selectedCities.length).padStart(2, "0")}</strong>
            <div className="compare-index-bottom">
              <span>Hubs under review</span>
              <span>{matchedSourceClaims.length} cited claims matched</span>
            </div>
            <div className="compare-index-ruler" aria-hidden="true">
              {selectedCities.map((city, index) => (
                <i key={city.id} className={"compare-index-ruler-mark compare-tone-" + (index + 1)} />
              ))}
            </div>
          </aside>
        </div>
      </header>

      <section className="compare-selection-panel" aria-labelledby="compare-selection-title">
        <div className="compare-section-heading">
          <div>
            <p className="compare-section-kicker">01 / BUILD A SET</p>
            <h2 id="compare-selection-title">Your city shortlist</h2>
            <p>Choose two to four hubs. The chart and evidence ledger update together.</p>
          </div>
          <button
            type="button"
            className="compare-reset-button"
            onClick={resetSelection}
            disabled={selectedCityIds.length === defaultSelection.length && defaultSelection.every((id) => selectedCityIds.includes(id))}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset set
          </button>
        </div>

        <div className="compare-selection-controls">
          <label className="compare-city-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={citySearch}
              onChange={(event) => setCitySearch(event.target.value)}
              aria-label="Find a city or state"
              placeholder="Find a city or state"
            />
          </label>
          <span className="compare-selection-count">
            {selectedCityIds.length} selected <span aria-hidden="true">/</span> max 4
          </span>
        </div>

        <div className="compare-city-options">
          {citySearchResults.map((city) => {
            const isSelected = selectedCityIds.includes(city.id);
            const isAtCapacity = !isSelected && selectedCityIds.length >= 4;
            const isAtMinimum = isSelected && selectedCityIds.length <= 2;
            const stateName = statesMap.get(city.state_id)?.name || "State not recorded";

            return (
              <button
                key={city.id}
                type="button"
                className={"compare-city-option" + (isSelected ? " is-active" : "")}
                onClick={() => toggleCity(city.id)}
                disabled={isAtCapacity || isAtMinimum}
                aria-pressed={isSelected}
                title={
                  isAtMinimum
                    ? "Keep at least two cities selected"
                    : isAtCapacity
                      ? "Remove a selected city before adding another"
                      : (isSelected ? "Remove " : "Add ") + city.name
                }
              >
                <span className="compare-city-option-indicator" aria-hidden="true">
                  {isSelected ? <Check size={13} /> : <span />}
                </span>
                <span className="compare-city-option-copy">
                  <strong>{city.name}</strong>
                  <small>{stateName}</small>
                </span>
                <span className="compare-city-option-state">{isSelected ? "IN SET" : "ADD +"}</span>
              </button>
            );
          })}
          {citySearchResults.length === 0 && (
            <div className="compare-no-results">No city matches “{citySearch}”. Try a state name.</div>
          )}
        </div>

        <div className="compare-selection-foot">
          <span><SlidersHorizontal size={13} aria-hidden="true" /> Selection updates all comparisons below</span>
          <span>{selectedCities.length === 4 ? "Comparison set is full" : "Add " + (4 - selectedCities.length) + " more to reach four"}</span>
        </div>
      </section>

      <section className="compare-snapshot" aria-labelledby="compare-snapshot-title">
        <div className="compare-section-heading compare-section-heading-tight">
          <div>
            <p className="compare-section-kicker">02 / QUICK READ</p>
            <h2 id="compare-snapshot-title">The spread at a glance</h2>
          </div>
          <span className="compare-small-note">Derived from selected city records</span>
        </div>

        <div className="compare-snapshot-grid">
          <article className="compare-snapshot-card compare-snapshot-card-lead">
            <span className="compare-snapshot-label">Office rent band</span>
            <strong>{rentSpread}</strong>
            <p>Across selected hubs · ₹ / sq ft / month</p>
            <span className="compare-snapshot-glyph" aria-hidden="true">↔</span>
          </article>
          <article className="compare-snapshot-card">
            <span className="compare-snapshot-label">Talent cost index</span>
            <strong>{talentSpread}</strong>
            <p>100 = Bengaluru baseline</p>
          </article>
          <article className="compare-snapshot-card">
            <span className="compare-snapshot-label">Largest tracked footprint</span>
            <strong className="compare-snapshot-city">{largestFootprint?.city.name || "Not recorded"}</strong>
            <p>
              {largestFootprint
                ? new Intl.NumberFormat("en-IN").format(largestFootprint.value) + " units · " + (largestFootprint.claim?.as_of || "source date not stated")
                : "No unit-count claim in this set"}
            </p>
          </article>
          <article className="compare-snapshot-card">
            <span className="compare-snapshot-label">Source-linked claims</span>
            <strong>{matchedSourceClaims.length}<span> / {selectedClaims.length}</span></strong>
            <p>Selected city claims with a matching source record</p>
          </article>
        </div>
      </section>

      <section className="compare-analytics" aria-labelledby="compare-analytics-title">
        <div className="compare-section-heading">
          <div>
            <p className="compare-section-kicker">03 / EXPLORE A METRIC</p>
            <h2 id="compare-analytics-title">Read the difference, not just the number</h2>
            <p>Select a measure to change the horizontal comparison. Range-valued sources remain ranges.</p>
          </div>
          <span className="compare-chart-index">FIG. 01 — {selectedCities.length} CITIES</span>
        </div>

        <div className="compare-analytics-grid">
          <div className="compare-chart-panel">
            <div className="compare-metric-tabs" role="group" aria-label="Choose comparison metric">
              {METRICS.map((metric) => (
                <button
                  key={metric.key}
                  type="button"
                  className={"compare-metric-tab" + (activeMetricKey === metric.key ? " is-active" : "")}
                  onClick={() => setActiveMetricKey(metric.key)}
                  aria-pressed={activeMetricKey === metric.key}
                >
                  <span>{metric.label}</span>
                  {activeMetricKey === metric.key && <Check size={13} aria-hidden="true" />}
                </button>
              ))}
            </div>

            <div className="compare-chart-title-row">
              <div>
                <h3>{activeMetric.label}</h3>
                <p>{activeMetric.sublabel}</p>
              </div>
              <span className="compare-chart-range-note">
                {activeMetric.range ? "SOURCE REPORTED RANGE" : "SOURCE REPORTED VALUE"}
              </span>
            </div>

            <div
              className="compare-chart"
              role="group"
              aria-label={"Comparison of " + activeMetric.label + " across " + selectedCities.map((city) => city.name).join(", ")}
            >
              <div className="compare-chart-axis">
                <span>0</span>
                <span>{activeMetric.scaleLabel}</span>
              </div>
              <div className="compare-chart-rows">
                {chartRows.map((row, index) => (
                  <div
                    key={row.city.id}
                    className="compare-chart-row"
                    title={row.claim ? row.city.name + ": " + String(row.claim.value) + " (" + row.claim.as_of + ")" : row.city.name + ": no claim in current record"}
                  >
                    <div className="compare-chart-row-head">
                      <div className="compare-chart-city">
                        <i className={"compare-city-swatch compare-tone-" + (index + 1)} aria-hidden="true" />
                        <div>
                          <strong>{row.city.name}</strong>
                          <small>{statesMap.get(row.city.state_id)?.name || "State not recorded"}</small>
                        </div>
                      </div>
                      <div className="compare-chart-value">
                        {row.claim ? String(row.claim.value) : "Not in record"}
                        {row.claim?.unit && <small>{row.claim.unit}</small>}
                      </div>
                    </div>
                    <div className="compare-chart-track" aria-hidden="true">
                      {row.hasValue && (
                        <span
                          className={"compare-chart-bar compare-tone-" + (index + 1) + (activeMetric.range ? " is-range" : "")}
                          style={{ marginLeft: String(row.left) + "%", width: String(row.width) + "%" }}
                        />
                      )}
                    </div>
                    <div className="compare-chart-row-foot">
                      <span>{row.claim ? "As of " + row.claim.as_of : "No linked metric claim"}</span>
                      {row.claim && <span>Confidence {row.claim.confidence}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="compare-chart-caption">{activeMetric.description}</p>
          </div>

          <aside className="compare-method-panel">
            <div className="compare-method-panel-heading">
              <span className="compare-method-number">A / READOUT</span>
              <h3>How to use this view</h3>
            </div>
            <div className="compare-method-rule">
              <span>01</span>
              <div>
                <strong>Keep ranges intact</strong>
                <p>Rent and national market share may be published as bands. Compare the full interval.</p>
              </div>
            </div>
            <div className="compare-method-rule">
              <span>02</span>
              <div>
                <strong>Use index baselines carefully</strong>
                <p>Talent index uses Bengaluru = 100 in the current record. It is not a salary in rupees.</p>
              </div>
            </div>
            <div className="compare-method-rule">
              <span>03</span>
              <div>
                <strong>No weighted winner score</strong>
                <p>These are separate decision inputs. Your hiring model, lease, and policy eligibility may change the outcome.</p>
              </div>
            </div>
            <div className="compare-method-footer">
              <span>Source traceability</span>
              <strong>{matchedSourceClaims.length} matched / {selectedClaims.length} city claims</strong>
            </div>
          </aside>
        </div>
      </section>

      <section className="compare-ledger" aria-labelledby="compare-ledger-title">
        <div className="compare-section-heading">
          <div>
            <p className="compare-section-kicker">04 / VERIFY THE DETAIL</p>
            <h2 id="compare-ledger-title">Evidence ledger</h2>
            <p>Open a footnote to inspect the source record. Policy entries are shown only when present in the captured policy data.</p>
          </div>
          <span className="compare-ledger-count">{selectedCities.length} hubs · cited side by side</span>
        </div>

        <CompareTable
          cities={selectedCities}
          statesMap={statesMap}
          claimsMap={claimsById}
          sourcesMap={sourcesMap}
        />
      </section>

      <footer className="compare-integrity-note">
        <div className="compare-integrity-icon"><Check size={17} aria-hidden="true" /></div>
        <div>
          <strong>Evidence stays separate from interpretation.</strong>
          <p>
            “Not listed” means the current captured record does not contain a matching entry; it does not prove an incentive is unavailable.
            Review source conditions before using policy values in an investment decision.
          </p>
        </div>
        <div className="compare-integrity-mark">ZD / COMPARE</div>
      </footer>
    </div>
  );
}
