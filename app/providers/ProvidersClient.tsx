"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Provider, ProofLink, Gcc, Source } from "../../lib/schema";
import { computeProviderScore } from "../../lib/scoring";
import { PageHeader } from "../../components/PageHeader";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import { SourceFootnote } from "../../components/SourceFootnote";
import { useSourceDrawer } from "../../components/SourceDrawerContext";
import {
  Award,
  Shield,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Filter,
  FileCheck,
  Scale,
} from "lucide-react";

interface ProvidersClientProps {
  providers: Provider[];
  proofLinks: ProofLink[];
  gccs: Gcc[];
  sources: Source[];
}

export function ProvidersClient({
  providers,
  proofLinks,
  gccs,
  sources,
}: ProvidersClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const { openDrawer } = useSourceDrawer();

  const gccsMap = useMemo(() => {
    const map = new Map<string, Gcc>();
    gccs.forEach((g) => map.set(g.id, g));
    return map;
  }, [gccs]);

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  // Group proof links by provider
  const proofLinksByProvider = useMemo(() => {
    const map = new Map<string, ProofLink[]>();
    proofLinks.forEach((pl) => {
      if (!map.has(pl.provider_id)) {
        map.set(pl.provider_id, []);
      }
      map.get(pl.provider_id)!.push(pl);
    });
    return map;
  }, [proofLinks]);

  // Compute scores
  const scoredProviders = useMemo(() => {
    return providers
      .map((prov) => {
        const links = proofLinksByProvider.get(prov.id) || [];
        const scoreData = computeProviderScore(links);
        return {
          provider: prov,
          links,
          scoreData,
        };
      })
      .sort((a, b) => b.scoreData.score - a.scoreData.score);
  }, [providers, proofLinksByProvider]);

  const filteredProviders = useMemo(() => {
    if (selectedCategory === "all") return scoredProviders;
    return scoredProviders.filter((p) => p.provider.category === selectedCategory);
  }, [scoredProviders, selectedCategory]);

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "real_estate", label: "Real Estate & Workplace" },
    { id: "advisory", label: "Management Advisory" },
    { id: "legal", label: "Corporate Legal & Tax" },
    { id: "audit", label: "Audit & Assurance" },
    { id: "bot", label: "Build-Operate-Transfer (BOT)" },
    { id: "recruitment", label: "Executive Search" },
  ];

  const toggleExpand = (id: string) => {
    setExpandedProviderId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Editorial Header */}
      <PageHeader
        rubric="Evidence-Based Provider Directory"
        findingHeadline="Service providers ranked strictly by documented proof links"
        findingDescription="Ranking is based on evidence only; payment never changes it. We evaluate documented proof links: verified lease records, documented enterprise advisories, and direct corporate GCC client attestations."
        pageTitle="Verified GCC Service Providers Directory"
        path="/providers"
        metadata={`${providers.length} Reviewed Providers • Reviewed: May 2026`}
        primaryAction={
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-cobalt text-white border-2 border-ink rounded-full hover:shadow-[2px_2px_0px_var(--color-ink)] transition-all min-h-[38px]"
          >
            <span>+ Attest Engagement</span>
          </Link>
        }
      />

      {/* Formula & Neutrality Firewall Banner */}
      <div className="p-5 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_var(--color-ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
        <div>
          <span className="text-muted uppercase text-xs font-bold block">
            Evidence Depth Formula
          </span>
          <div className="text-ink font-bold text-sm mt-0.5">
            Score = Σ(Verified Proof Links × Kind Weight)
          </div>
          <div className="text-xs text-muted mt-1 font-body">
            Weights: Registered Lease Record = 3 | Direct Client Attestation = 3 | Documented Advisory = 2 | Public Case Study = 1
          </div>
        </div>

        <div className="sm:border-l-2 sm:border-ink sm:pl-4 text-xs font-mono">
          <div className="font-bold text-cobalt flex items-center gap-1.5">
            <Shield className="w-4 h-4" strokeWidth={1.75} />
            <span>Neutrality Firewall</span>
          </div>
          <div className="text-muted text-xs mt-0.5">Ranking is based on evidence only; payment never changes it.</div>
        </div>
      </div>

      {/* Category Tabs: pill buttons */}
      <div className="flex flex-wrap gap-2 border-b-2 border-ink pb-3 font-mono text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full uppercase tracking-wider transition-all min-h-[38px] border-2 border-ink cursor-pointer font-bold ${
                isSelected
                  ? "bg-ink text-paper shadow-[2px_2px_0px_var(--color-ink)]"
                  : "bg-surface text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Ruled Provider Table */}
      <div className="border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_var(--color-ink)] overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b-2 border-ink bg-paper font-mono text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="w-10 py-3.5 px-3 text-center">
                <span className="sr-only">Toggle</span>
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[200px]">
                Provider Firm
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[150px]">
                Category
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[120px]">
                Verified Proofs
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[110px] text-right">
                Evidence Score
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[140px] text-right">
                Dossier
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink/10">
            {filteredProviders.map(({ provider, links, scoreData }) => {
              const isExpanded = expandedProviderId === provider.id;

              return (
                <React.Fragment key={provider.id}>
                  <tr
                    onClick={() => toggleExpand(provider.id)}
                    className={`cursor-pointer transition-colors duration-fast ${
                      isExpanded ? "bg-paper/70" : "hover:bg-paper/30"
                    }`}
                  >
                    <td className="w-10 py-3.5 px-3 text-center text-muted">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse proofs" : "Expand proofs"}
                        className="w-7 h-7 inline-flex items-center justify-center text-muted hover:text-ink border border-ink/40 rounded-full"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-cobalt" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-ink">
                      <div className="font-display font-bold text-base text-ink">
                        {provider.name}
                      </div>
                      <div className="text-xs font-mono text-muted">
                        Hubs: {provider.cities.join(", ")}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-ink uppercase">
                      <span className="inline-block px-2 py-0.5 border border-ink bg-surface rounded-xs">
                        {provider.category.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-ink tabular-nums text-xs">
                      <span className="font-bold">{links.length}</span> proof link{links.length !== 1 ? "s" : ""}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-sm text-ink tabular-nums">
                      {scoreData.score} pts
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/provider/${provider.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-xs uppercase font-bold text-cobalt hover:text-ink hover:underline decoration-1 underline-offset-2"
                      >
                        <span>Examine</span>
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </Link>
                    </td>
                  </tr>

                  {/* Inline Proof Links Ledger */}
                  {isExpanded && (
                    <tr className="bg-paper/40 border-b-2 border-ink">
                      <td colSpan={6} className="p-5 border-l-4 border-cobalt space-y-3">
                        <div className="flex items-center justify-between border-b border-rule-subtle pb-2 text-xs font-mono">
                          <span className="font-bold uppercase tracking-wider text-ink">
                            Reviewed Proof Links for {provider.name}
                          </span>
                          <span className="text-muted">
                            Total Depth: {scoreData.score} Points
                          </span>
                        </div>

                        {links.length > 0 ? (
                          <div className="border-2 border-ink bg-surface rounded-xs overflow-x-auto">
                            <table className="w-full text-left text-xs font-sans border-collapse">
                              <thead>
                                <tr className="border-b-2 border-ink bg-paper font-mono text-xs uppercase tracking-wider text-muted">
                                  <th className="py-2.5 px-3">Evidence Kind</th>
                                  <th className="py-2.5 px-3">Associated GCC</th>
                                  <th className="py-2.5 px-3">Documented Claim</th>
                                  <th className="py-2.5 px-3 text-center">Score Weight</th>
                                  <th className="py-2.5 px-3 text-right">Source Link</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-ink/10">
                                {links.map((pl) => {
                                  const gcc = pl.gcc_id ? gccsMap.get(pl.gcc_id) : null;
                                  const firstEv = pl.evidence?.[0];
                                  const src = firstEv?.source_id ? sourcesMap.get(firstEv.source_id) : null;
                                  const kind = firstEv?.kind || pl.status;

                                  return (
                                    <tr key={pl.id} className="hover:bg-paper/30">
                                      <td className="py-2.5 px-3 font-mono text-xs uppercase font-bold text-ink">
                                        <span className="inline-block px-1.5 py-0.5 border border-ink bg-surface rounded-2xs">
                                          {kind.replace(/_/g, " ")}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-ink">
                                        {gcc ? (
                                          <Link
                                            href={`/gcc/${gcc.slug}`}
                                            className="font-bold hover:text-cobalt hover:underline font-sans text-sm"
                                          >
                                            {gcc.name}
                                          </Link>
                                        ) : (
                                          <span className="text-muted font-mono">—</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 text-ink/90 font-body text-xs">
                                        {firstEv?.excerpt_summary || pl.service}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cobalt text-xs">
                                        {pl.status === "attested" ? "+3 pts" : "+2 pts"}
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        {src ? (
                                          <a
                                            href={src.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-mono text-xs text-cobalt hover:text-ink font-semibold"
                                          >
                                            <span>Examine</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
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
                        ) : (
                          <div className="py-4 text-center font-body text-muted text-xs">
                            No verified proof links on file for this provider firm.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
