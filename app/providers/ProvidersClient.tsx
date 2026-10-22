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
        rubric="Evidence-Based Provider Registry"
        findingHeadline="Service providers ranked strictly by documented proof links and statutory filings"
        findingDescription="Zero paid placements or directory sponsorships. We separate marketed self-claims from audited proof: registered sub-registrar lease deeds, joint press announcements, and direct corporate GCC client attestations."
        pageTitle="Verified GCC Service Providers Directory"
        path="/providers"
        metadata={`${providers.length} Audited Providers`}
        primaryAction={
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider bg-ink text-paper hover:bg-verdigris transition-colors duration-fast min-h-[36px]"
          >
            <span>+ Attest Engagement</span>
          </Link>
        }
      />

      {/* Formula & Neutrality Firewall Banner */}
      <div className="p-4 border border-hairline bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
        <div>
          <span className="text-muted uppercase text-[10px] font-bold block">
            Evidence Depth Formula
          </span>
          <div className="text-ink font-bold text-sm mt-0.5">
            Score = Σ(Verified Proof Links × Kind Weight)
          </div>
          <div className="text-[11px] text-muted mt-1 font-serif italic">
            Weights: Statutory Lease Deed = 3 | Direct Attestation = 3 | Joint Announcement = 2 | Case Study = 1
          </div>
        </div>

        <div className="sm:border-l sm:border-hairline sm:pl-4 text-xs font-mono">
          <div className="font-bold text-verdigris flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Neutrality Firewall</span>
          </div>
          <div className="text-muted text-[11px]">Money never alters ranking.</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-hairline pb-2 font-mono text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 uppercase tracking-wider transition-colors duration-fast min-h-[38px] border ${
                isSelected
                  ? "bg-ink text-paper border-ink font-bold"
                  : "bg-paper/40 text-muted border-hairline hover:border-ink hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Ruled Provider Table */}
      <div className="border border-hairline bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[11px] uppercase tracking-wider text-muted">
              <th scope="col" className="w-8 py-3 px-3 text-center">
                <span className="sr-only">Toggle</span>
              </th>
              <th scope="col" className="py-3 px-4 min-w-[200px]">
                Provider Firm
              </th>
              <th scope="col" className="py-3 px-4 min-w-[150px]">
                Category
              </th>
              <th scope="col" className="py-3 px-3 min-w-[120px]">
                Verified Proofs
              </th>
              <th scope="col" className="py-3 px-3 min-w-[110px] text-right">
                Evidence Score
              </th>
              <th scope="col" className="py-3 px-4 min-w-[140px] text-right">
                Dossier
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
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
                    <td className="w-8 py-3 px-3 text-center text-muted">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse proofs" : "Expand proofs"}
                        className="w-6 h-6 inline-flex items-center justify-center text-muted hover:text-ink"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-verdigris" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-serif text-ink">
                      <div className="font-display font-bold text-sm text-ink font-sans">
                        {provider.name}
                      </div>
                      <div className="text-[11px] font-mono text-muted">
                        Hubs: {provider.cities.join(", ")}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink uppercase">
                      <span className="inline-block px-1.5 py-0.5 border border-hairline bg-paper/60">
                        {provider.category.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-ink tabular-nums">
                      <span className="font-bold">{links.length}</span> proof link{links.length !== 1 ? "s" : ""}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-sm text-ink tabular-nums">
                      {scoreData.score} pts
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/provider/${provider.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-verdigris hover:text-ink hover:underline decoration-1 underline-offset-2"
                      >
                        <span>Examine</span>
                        <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                      </Link>
                    </td>
                  </tr>

                  {/* Inline Proof Links Ledger */}
                  {isExpanded && (
                    <tr className="bg-paper/40 border-b border-hairline">
                      <td colSpan={6} className="p-5 border-l-2 border-verdigris space-y-3">
                        <div className="flex items-center justify-between border-b border-hairline-subtle pb-2 text-xs font-mono">
                          <span className="font-bold uppercase tracking-wider text-ink">
                            Audited Proof Links for {provider.name}
                          </span>
                          <span className="text-muted">
                            Total Depth: {scoreData.score} Points
                          </span>
                        </div>

                        {links.length > 0 ? (
                          <div className="border border-hairline bg-surface overflow-x-auto">
                            <table className="w-full text-left text-xs font-sans border-collapse">
                              <thead>
                                <tr className="border-b border-hairline bg-paper/80 font-mono text-[10px] uppercase tracking-wider text-muted">
                                  <th className="py-2 px-3">Evidence Kind</th>
                                  <th className="py-2 px-3">Associated GCC</th>
                                  <th className="py-2 px-3">Audited Claim</th>
                                  <th className="py-2 px-3 text-center">Score Weight</th>
                                  <th className="py-2 px-3 text-right">Source Link</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-hairline">
                                {links.map((pl) => {
                                  const gcc = pl.gcc_id ? gccsMap.get(pl.gcc_id) : null;
                                  const firstEv = pl.evidence?.[0];
                                  const src = firstEv?.source_id ? sourcesMap.get(firstEv.source_id) : null;
                                  const kind = firstEv?.kind || pl.status;

                                  return (
                                    <tr key={pl.id} className="hover:bg-paper/30">
                                      <td className="py-2 px-3 font-mono text-[10px] uppercase font-bold text-ink">
                                        <span className="inline-block px-1.5 py-0.5 border border-hairline bg-paper">
                                          {kind.replace(/_/g, " ")}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 font-serif text-ink">
                                        {gcc ? (
                                          <Link
                                            href={`/gcc/${gcc.slug}`}
                                            className="font-bold hover:text-verdigris hover:underline font-sans"
                                          >
                                            {gcc.name}
                                          </Link>
                                        ) : (
                                          <span className="text-muted font-mono">—</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-ink/90 font-serif italic text-xs">
                                        {firstEv?.excerpt_summary || pl.service}
                                      </td>
                                      <td className="py-2 px-3 text-center font-mono font-bold text-verdigris">
                                        {pl.status === "attested" ? "+3 pts" : "+2 pts"}
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        {src ? (
                                          <a
                                            href={src.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-mono text-xs text-verdigris hover:text-ink font-semibold"
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
                          <div className="py-4 text-center font-serif italic text-muted text-xs">
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
