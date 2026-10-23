"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileSearch,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Provider, ProofLink, Gcc, Source, Evidence } from "../../lib/schema";
import { computeProviderScore } from "../../lib/scoring";
import { CitationButton } from "../../components/CitationButton";
import { SourceFootnote } from "../../components/SourceFootnote";

interface ProvidersClientProps {
  providers: Provider[];
  proofLinks: ProofLink[];
  gccs: Gcc[];
  sources: Source[];
}

type CategoryFilter = Provider["category"] | "all";
type EvidenceFilter = Evidence["kind"] | "all";
type SortOption = "evidence" | "links" | "name";

interface ScoredProvider {
  provider: Provider;
  allLinks: ProofLink[];
  scoredLinks: ProofLink[];
  scoreData: ReturnType<typeof computeProviderScore>;
  demoLinks: number;
}

const CATEGORY_LABELS: Record<Provider["category"], string> = {
  advisory: "Advisory",
  legal: "Legal & tax",
  audit: "Audit & assurance",
  real_estate: "Real estate",
  recruitment: "Talent & search",
  payroll_eor: "Payroll / EOR",
  bot: "Build–operate–transfer",
  other: "Other services",
};

const EVIDENCE_LABELS: Record<Evidence["kind"], string> = {
  attestation: "Client attestation",
  filing: "Corporate filing",
  lease: "Lease record",
  press: "Press coverage",
  case_study: "Case study",
};

const EVIDENCE_ORDER: Evidence["kind"][] = [
  "filing",
  "lease",
  "attestation",
  "press",
  "case_study",
];

const EVIDENCE_WEIGHTS: Record<Evidence["kind"], number> = {
  attestation: 3,
  filing: 3,
  lease: 3,
  press: 2,
  case_study: 1,
};

function scoreForLink(link: ProofLink): number {
  if (link.demo || link.status === "disputed") return 0;
  return Math.max(0, ...link.evidence.map((item) => EVIDENCE_WEIGHTS[item.kind] || 1));
}

function evidenceStatusLabel(link: ProofLink): string {
  if (link.demo) return "Demo record · excluded from score";
  if (link.status === "attested") return "Attested record";
  if (link.status === "disputed") return "Disputed · zero weight";
  return "Public source record";
}

export function ProvidersClient({
  providers,
  proofLinks,
  gccs,
  sources,
}: ProvidersClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedEvidenceKind, setSelectedEvidenceKind] = useState<EvidenceFilter>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("evidence");
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);

  const gccsMap = useMemo(() => {
    const map = new Map<string, Gcc>();
    gccs.forEach((gcc) => map.set(gcc.id, gcc));
    return map;
  }, [gccs]);

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((source) => map.set(source.id, source));
    return map;
  }, [sources]);

  const scoredProviders = useMemo<ScoredProvider[]>(() => {
    return providers.map((provider) => {
      const allLinks = proofLinks.filter((link) => link.provider_id === provider.id);
      // Records explicitly marked as demo must not influence provider evidence weights.
      const scoredLinks = allLinks.filter((link) => !link.demo);
      return {
        provider,
        allLinks,
        scoredLinks,
        scoreData: computeProviderScore(scoredLinks),
        demoLinks: allLinks.filter((link) => Boolean(link.demo)).length,
      };
    });
  }, [providers, proofLinks]);

  const categories = useMemo<CategoryFilter[]>(() => {
    const unique = Array.from(new Set(providers.map((provider) => provider.category)));
    unique.sort((a, b) => CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b]));
    return ["all", ...unique];
  }, [providers]);

  const categoryBase = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return scoredProviders.filter((entry) => {
      if (selectedCategory !== "all" && entry.provider.category !== selectedCategory) {
        return false;
      }
      if (!normalizedQuery) return true;
      const evidenceText = entry.allLinks
        .flatMap((link) => [link.service, ...link.evidence.map((item) => item.excerpt_summary)])
        .join(" ");
      const searchable = [
        entry.provider.name,
        CATEGORY_LABELS[entry.provider.category],
        entry.provider.cities.join(" "),
        evidenceText,
      ].join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, scoredProviders, selectedCategory]);

  const cityScopedProviders = useMemo(() => {
    if (selectedCity === "all") return categoryBase;
    return categoryBase.filter((entry) => entry.provider.cities.includes(selectedCity));
  }, [categoryBase, selectedCity]);

  const filteredProviders = useMemo(() => {
    const filtered = cityScopedProviders.filter((entry) => {
      if (selectedEvidenceKind === "all") return true;
      return entry.scoredLinks.some((link) =>
        link.status !== "disputed" &&
        link.evidence.some((item) => item.kind === selectedEvidenceKind),
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.provider.name.localeCompare(b.provider.name);
      if (sortBy === "links") {
        return b.scoredLinks.length - a.scoredLinks.length ||
          b.scoreData.score - a.scoreData.score ||
          a.provider.name.localeCompare(b.provider.name);
      }
      return b.scoreData.score - a.scoreData.score ||
        b.scoredLinks.length - a.scoredLinks.length ||
        a.provider.name.localeCompare(b.provider.name);
    });
  }, [cityScopedProviders, selectedEvidenceKind, sortBy]);

  const cityFootprint = useMemo(() => {
    const counts = new Map<string, number>();
    categoryBase.forEach((entry) => {
      entry.provider.cities.forEach((city) => counts.set(city, (counts.get(city) || 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
      .slice(0, 8);
  }, [categoryBase]);

  const evidenceComposition = useMemo(() => {
    const counts: Record<Evidence["kind"], number> = {
      attestation: 0,
      filing: 0,
      lease: 0,
      press: 0,
      case_study: 0,
    };

    cityScopedProviders.forEach((entry) => {
      entry.scoredLinks.forEach((link) => {
        if (link.status === "disputed") return;
        link.evidence.forEach((item) => { counts[item.kind] += 1; });
      });
    });

    return EVIDENCE_ORDER
      .map((kind) => ({ kind, label: EVIDENCE_LABELS[kind], count: counts[kind] }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || EVIDENCE_ORDER.indexOf(a.kind) - EVIDENCE_ORDER.indexOf(b.kind));
  }, [cityScopedProviders]);

  const allScoredLinks = scoredProviders.flatMap((entry) => entry.scoredLinks);
  const visibleEvidenceRecordCount = allScoredLinks.filter((link) => link.status !== "disputed").length;
  const distinctLinkedGccs = new Set(
    allScoredLinks
      .filter((link) => link.status !== "disputed" && link.gcc_id)
      .map((link) => link.gcc_id as string),
  ).size;
  const demoRecordCount = proofLinks.filter((link) => Boolean(link.demo)).length;
  const maxCityCount = Math.max(1, ...cityFootprint.map((entry) => entry.count));
  const maxEvidenceCount = Math.max(1, ...evidenceComposition.map((entry) => entry.count));

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCity("all");
    setSelectedEvidenceKind("all");
    setQuery("");
    setSortBy("evidence");
    setExpandedProviderId(null);
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedCity !== "all" ||
    selectedEvidenceKind !== "all" ||
    query.trim().length > 0;

  return (
    <div className="proof-atlas">
      <header className="proof-hero">
        <div className="proof-hero-topline">
          <p className="proof-kicker">ZERO DAY / PROOF INDEX / SERVICE ECOSYSTEM</p>
          <div className="proof-hero-actions">
            <CitationButton pageTitle="GCC Service Provider Proof Directory" path="/providers" />
            <Link href="/submit" className="proof-submit-link">
              <span>Submit evidence</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="proof-hero-grid">
          <div className="proof-hero-copy">
            <h1>Proof over <span>promises.</span></h1>
            <p>
              Explore service providers through documented GCC engagements, source records,
              and a transparent evidence-weighting method. A firm’s own claims are not treated
              as proof of delivery.
            </p>
            <div className="proof-principles">
              <span><ShieldCheck size={14} aria-hidden="true" /> Evidence-weighted, not paid-ranked</span>
              <span><FileSearch size={14} aria-hidden="true" /> Source records remain inspectable</span>
            </div>
          </div>

          <aside className="proof-hero-note" aria-label="Ranking methodology">
            <div className="proof-hero-note-head">
              <span>METHOD NOTE</span>
              <span>ZD / P-01</span>
            </div>
            <div className="proof-method-equation">Σ max(kind weight)</div>
            <p>Each non-demo proof link receives the weight of its strongest evidence item.</p>
            <div className="proof-weight-legend">
              <span><i className="proof-weight-mark proof-weight-mark--high" /> Filing / lease / attestation <b>3</b></span>
              <span><i className="proof-weight-mark proof-weight-mark--mid" /> Press coverage <b>2</b></span>
              <span><i className="proof-weight-mark proof-weight-mark--low" /> Case study <b>1</b></span>
            </div>
          </aside>
        </div>
      </header>

      <section className="proof-metric-grid" aria-label="Directory snapshot">
        <article className="proof-metric proof-metric--lead">
          <span>Provider profiles</span>
          <strong>{providers.length}</strong>
          <small>Across recorded service categories</small>
          <span className="proof-metric-index">01</span>
        </article>
        <article className="proof-metric">
          <span>Scored proof links</span>
          <strong>{visibleEvidenceRecordCount}</strong>
          <small>Excludes records flagged as demo</small>
          <span className="proof-metric-index">02</span>
        </article>
        <article className="proof-metric">
          <span>Distinct GCCs linked</span>
          <strong>{distinctLinkedGccs}</strong>
          <small>Non-demo proof records with a GCC association</small>
          <span className="proof-metric-index">03</span>
        </article>
        <article className="proof-metric proof-metric--flag">
          <span>Demo records</span>
          <strong>{demoRecordCount}</strong>
          <small>Visible for transparency; excluded from score</small>
          <span className="proof-metric-index">04</span>
        </article>
      </section>

      <section className="proof-insights" aria-label="Evidence and provider footprint analysis">
        <article className="proof-insight-panel">
          <div className="proof-panel-heading">
            <div>
              <p className="proof-section-kicker">01 / EVIDENCE MIX</p>
              <h2>What kind of proof is on file?</h2>
              <p>Based on current non-demo evidence attached to the visible provider set. Select a bar to filter.</p>
            </div>
            <span className="proof-figure-label">FIG. 01</span>
          </div>

          <div className="proof-evidence-chart" role="group" aria-label="Filter providers by evidence kind">
            {evidenceComposition.length ? evidenceComposition.map((item, index) => (
              <button
                key={item.kind}
                type="button"
                className={"proof-evidence-bar-row" +
                  (selectedEvidenceKind === item.kind ? " is-selected" : "")}
                aria-pressed={selectedEvidenceKind === item.kind}
                onClick={() => setSelectedEvidenceKind((current) => current === item.kind ? "all" : item.kind)}
              >
                <span className="proof-evidence-bar-label">
                  <i className={"proof-chart-mark proof-chart-mark--" + (index + 1)} aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                <span className="proof-evidence-track" aria-hidden="true">
                  <i
                    className={"proof-evidence-fill proof-evidence-fill--" + (index + 1)}
                    style={{ width: ((item.count / maxEvidenceCount) * 100) + "%" }}
                  />
                </span>
                <strong>{item.count}</strong>
              </button>
            )) : (
              <div className="proof-chart-empty">No non-demo evidence matches these filters.</div>
            )}
          </div>
          <div className="proof-panel-foot">
            <span>Evidence item count</span>
            <button
              type="button"
              onClick={() => setSelectedEvidenceKind("all")}
              disabled={selectedEvidenceKind === "all"}
            >
              Clear evidence filter <X size={12} aria-hidden="true" />
            </button>
          </div>
        </article>

        <article className="proof-insight-panel proof-city-panel">
          <div className="proof-panel-heading">
            <div>
              <p className="proof-section-kicker">02 / LISTED FOOTPRINT</p>
              <h2>Where providers list coverage</h2>
              <p>Counts provider profiles listing each city—not confirmed client engagements in that city.</p>
            </div>
            <MapPin size={17} className="proof-panel-icon" aria-hidden="true" />
          </div>

          <div className="proof-city-chart" role="group" aria-label="Filter provider profiles by listed city">
            {cityFootprint.length ? cityFootprint.map((item, index) => (
              <button
                key={item.city}
                type="button"
                className={"proof-city-bar-row" + (selectedCity === item.city ? " is-selected" : "")}
                aria-pressed={selectedCity === item.city}
                onClick={() => setSelectedCity((current) => current === item.city ? "all" : item.city)}
              >
                <span className="proof-city-bar-label">
                  <span className="proof-city-rank">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.city}</strong>
                </span>
                <span className="proof-city-track" aria-hidden="true">
                  <i style={{ width: ((item.count / maxCityCount) * 100) + "%" }} />
                </span>
                <span className="proof-city-count">{item.count}</span>
              </button>
            )) : (
              <div className="proof-chart-empty">No city footprint matches this search.</div>
            )}
          </div>
          <div className="proof-panel-foot">
            <span>Provider-listing count</span>
            <button
              type="button"
              onClick={() => setSelectedCity("all")}
              disabled={selectedCity === "all"}
            >
              Clear city filter <X size={12} aria-hidden="true" />
            </button>
          </div>
        </article>
      </section>

      <section className="proof-directory" aria-labelledby="proof-directory-title">
        <div className="proof-directory-heading">
          <div>
            <p className="proof-section-kicker">03 / PROVIDER REGISTER</p>
            <h2 id="proof-directory-title">Explore the directory</h2>
            <p>Open any record to inspect the underlying evidence and source references.</p>
          </div>
          <div className="proof-result-count">
            <strong>{filteredProviders.length}</strong>
            <span>of {providers.length} profiles</span>
          </div>
        </div>

        <div className="proof-filter-panel">
          <div className="proof-filter-main">
            <label className="proof-search-field">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search provider, city, service or evidence"
                aria-label="Search provider, city, service, or evidence"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </label>

            <label className="proof-sort-field">
              <SlidersHorizontal size={15} aria-hidden="true" />
              <span className="proof-sort-label">Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
                <option value="evidence">Evidence weight</option>
                <option value="links">Proof links</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
          </div>

          <div className="proof-category-row" role="group" aria-label="Filter providers by category">
            {categories.map((category) => {
              const count = category === "all"
                ? providers.length
                : providers.filter((provider) => provider.category === category).length;
              const label = category === "all" ? "All services" : CATEGORY_LABELS[category];
              return (
                <button
                  key={category}
                  type="button"
                  className={"proof-category-chip" + (selectedCategory === category ? " is-selected" : "")}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                >
                  <span>{label}</span>
                  <small>{count}</small>
                </button>
              );
            })}
          </div>

          {(hasActiveFilters || selectedCity !== "all" || selectedEvidenceKind !== "all") && (
            <div className="proof-active-filters">
              <span><Filter size={13} aria-hidden="true" /> Active filters</span>
              {selectedCategory !== "all" && <button type="button" onClick={() => setSelectedCategory("all")}>{CATEGORY_LABELS[selectedCategory]} <X size={12} /></button>}
              {selectedCity !== "all" && <button type="button" onClick={() => setSelectedCity("all")}>{selectedCity} <X size={12} /></button>}
              {selectedEvidenceKind !== "all" && <button type="button" onClick={() => setSelectedEvidenceKind("all")}>{EVIDENCE_LABELS[selectedEvidenceKind]} <X size={12} /></button>}
              {query.trim() && <button type="button" onClick={() => setQuery("")}>Search: {query.trim()} <X size={12} /></button>}
              <button className="proof-reset-filters" type="button" onClick={resetFilters}><RotateCcw size={12} /> Reset all</button>
            </div>
          )}
        </div>

        <div className="proof-provider-list" aria-live="polite" aria-relevant="additions text">
          {filteredProviders.map((entry, providerIndex) => {
            const { provider, allLinks, scoredLinks, scoreData } = entry;
            const expanded = expandedProviderId === provider.id;
            const cityPreview = provider.cities.slice(0, 4);
            const extraCityCount = Math.max(0, provider.cities.length - cityPreview.length);
            const displayLinks = [...allLinks].sort((a, b) => {
              if (Boolean(a.demo) !== Boolean(b.demo)) return a.demo ? 1 : -1;
              return (b.year || 0) - (a.year || 0);
            });

            return (
              <article key={provider.id} className={"proof-provider-card" + (expanded ? " is-expanded" : "")}>
                <div className="proof-provider-main">
                  <div className="proof-provider-index" aria-hidden="true">
                    <span>{String(providerIndex + 1).padStart(2, "0")}</span>
                    <i className={"proof-provider-index-line" + (scoreData.score === 0 ? " is-empty" : "")} />
                  </div>

                  <div className="proof-provider-content">
                    <div className="proof-provider-title-row">
                      <div className="proof-provider-heading">
                        <h3>{provider.name}</h3>
                        <span className="proof-provider-category">{CATEGORY_LABELS[provider.category]}</span>
                      </div>
                      {entry.demoLinks > 0 && (
                        <span className="proof-demo-badge">{entry.demoLinks} demo {entry.demoLinks === 1 ? "record" : "records"}</span>
                      )}
                    </div>

                    <div className="proof-provider-cities">
                      <MapPin size={13} aria-hidden="true" />
                      {cityPreview.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setSelectedCity((current) => current === city ? "all" : city)}
                          className={selectedCity === city ? "is-current" : ""}
                        >
                          {city}
                        </button>
                      ))}
                      {extraCityCount > 0 && <span>+{extraCityCount} more</span>}
                    </div>

                    <div className="proof-provider-stats">
                      <div>
                        <span>Evidence weight</span>
                        <strong>{scoreData.score}<small> pts</small></strong>
                      </div>
                      <div>
                        <span>Scored links</span>
                        <strong>{scoredLinks.filter((link) => link.status !== "disputed").length}</strong>
                      </div>
                      <div>
                        <span>Linked GCCs</span>
                        <strong>{new Set(scoredLinks.filter((link) => link.status !== "disputed" && link.gcc_id).map((link) => link.gcc_id)).size}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="proof-provider-actions">
                    <Link
                      href={"/provider/" + provider.slug}
                      className="proof-dossier-link"
                      aria-label={"Open full dossier for " + provider.name}
                    >
                      <span>Full dossier</span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="proof-expand-button"
                      onClick={() => setExpandedProviderId((current) => current === provider.id ? null : provider.id)}
                      aria-expanded={expanded}
                      aria-label={(expanded ? "Hide" : "Inspect") + " evidence for " + provider.name}
                    >
                      <span>{expanded ? "Hide evidence" : "Inspect evidence"}</span>
                      {expanded ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <section className="proof-provider-detail" aria-label={"Evidence register for " + provider.name}>
                    <div className="proof-detail-heading">
                      <div>
                        <p className="proof-section-kicker">PROOF REGISTER / {providerIndex + 1}</p>
                        <h4>Records attached to {provider.name}</h4>
                      </div>
                      <span>{allLinks.length} total {allLinks.length === 1 ? "record" : "records"}</span>
                    </div>

                    {displayLinks.length > 0 ? (
                      <div className="proof-record-list">
                        {displayLinks.map((link, linkIndex) => {
                          const gcc = link.gcc_id ? gccsMap.get(link.gcc_id) : undefined;
                          const kind = link.evidence[0]?.kind;
                          const recordWeight = scoreForLink(link);
                          return (
                            <article
                              key={link.id}
                              className={"proof-record" +
                                (link.demo ? " is-demo" : "") +
                                (link.status === "disputed" ? " is-disputed" : "")}
                            >
                              <div className="proof-record-topline">
                                <div className="proof-record-kind">
                                  <i aria-hidden="true" />
                                  <span>{kind ? EVIDENCE_LABELS[kind] : "Evidence record"}</span>
                                </div>
                                <span className={"proof-record-score" + (recordWeight === 0 ? " is-zero" : "")}>
                                  {recordWeight} {recordWeight === 1 ? "point" : "points"}
                                </span>
                              </div>

                              <h5>{link.service}</h5>
                              <div className="proof-record-meta">
                                <span>{link.year ? "Record year " + link.year : "Year not recorded"}</span>
                                <span className="proof-record-status">{evidenceStatusLabel(link)}</span>
                              </div>

                              <div className="proof-record-gcc">
                                <span>Associated GCC</span>
                                {gcc ? (
                                  <Link href={"/gcc/" + gcc.slug}>
                                    {gcc.name}
                                    <ArrowUpRight size={12} aria-hidden="true" />
                                  </Link>
                                ) : (
                                  <span className="proof-no-gcc">No GCC linked</span>
                                )}
                              </div>

                              <div className="proof-source-list">
                                {link.evidence.map((item, evidenceIndex) => {
                                  const source = sourcesMap.get(item.source_id);
                                  const marker = String(providerIndex + 1) + "." + String(linkIndex + 1) + "." + String(evidenceIndex + 1);
                                  return (
                                    <div className="proof-source-item" key={item.source_id + "-" + evidenceIndex}>
                                      <div className="proof-source-item-head">
                                        <span>{EVIDENCE_LABELS[item.kind]}</span>
                                        {source ? (
                                          <div className="proof-source-actions">
                                            <SourceFootnote
                                              marker={marker}
                                              source={source}
                                              fieldLabel={provider.name + " — " + link.service}
                                              showMarkerOnly={true}
                                              className="proof-source-footnote"
                                            />
                                            <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={"Open " + source.publisher + " source in a new tab"}>
                                              <ExternalLink size={13} aria-hidden="true" />
                                              <span>Open source</span>
                                            </a>
                                          </div>
                                        ) : (
                                          <span className="proof-source-unlinked">Source not linked</span>
                                        )}
                                      </div>
                                      <p>{item.excerpt_summary}</p>
                                      {source && <small>{source.publisher} · {source.name}</small>}
                                    </div>
                                  );
                                })}
                              </div>

                              {link.demo && (
                                <p className="proof-demo-note">
                                  This record is explicitly flagged as demonstration data. It remains visible for transparency but contributes zero evidence weight.
                                </p>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="proof-no-records">
                        <FileSearch size={20} aria-hidden="true" />
                        <div>
                          <strong>No proof links on file.</strong>
                          <p>This profile is listed in the directory, but the current dataset does not attach an engagement record to it.</p>
                        </div>
                      </div>
                    )}

                    <div className="proof-detail-footer">
                      <span>Evidence weight is an index—not an endorsement or measure of service quality.</span>
                      <Link href={"/provider/" + provider.slug}>Open full dossier <ArrowUpRight size={13} aria-hidden="true" /></Link>
                    </div>
                  </section>
                )}
              </article>
            );
          })}

          {filteredProviders.length === 0 && (
            <div className="proof-empty-state">
              <div className="proof-empty-icon"><Search size={20} aria-hidden="true" /></div>
              <h3>No records match these filters.</h3>
              <p>Try another provider name, city, category, or evidence type.</p>
              <button type="button" onClick={resetFilters}>Clear filters <X size={13} aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </section>

      <footer className="proof-integrity-footer">
        <div className="proof-integrity-mark"><ShieldCheck size={17} aria-hidden="true" /></div>
        <div>
          <strong>Evidence is not an endorsement.</strong>
          <p>
            The score reflects only the captured proof-link weighting. It does not verify every claim a provider markets,
            predict service quality, or imply that a provider without a linked record lacks relevant experience.
            Prototype records are labelled and excluded from the score.
          </p>
        </div>
        <span className="proof-footer-code">ZD / PROOF REGISTER</span>
      </footer>
    </div>
  );
}
