"use client";

import React from "react";
import Link from "next/link";
import { Provider, ProofLink, Gcc, Source } from "../../../lib/schema";
import { computeProviderScore } from "../../../lib/scoring";
import { CitationButton } from "../../../components/CitationButton";
import { SourceFootnote } from "../../../components/SourceFootnote";
import { ConfidenceStamp } from "../../../components/ConfidenceStamp";
import {
  Award,
  Shield,
  Building,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  FileText,
  Calendar,
} from "lucide-react";

interface ProviderDetailClientProps {
  provider: Provider;
  proofLinks: ProofLink[];
  gccs: Gcc[];
  sources: Source[];
}

export function ProviderDetailClient({
  provider,
  proofLinks,
  gccs,
  sources,
}: ProviderDetailClientProps) {
  const gccsMap = new Map<string, Gcc>();
  gccs.forEach((g) => gccsMap.set(g.id, g));

  const sourcesMap = new Map<string, Source>();
  sources.forEach((s) => sourcesMap.set(s.id, s));

  const scoreData = computeProviderScore(proofLinks);

  return (
    <div className="space-y-8 font-sans">
      {/* Back button */}
      <div>
        <Link
          href="/providers"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors duration-fast min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>&larr; Return to Providers Directory</span>
        </Link>
      </div>

      {/* Header Banner */}
      <section className="border border-hairline bg-surface p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="uppercase px-2 py-0.5 border border-ink bg-paper font-bold text-ink">
                {provider.category.replace(/_/g, " ")}
              </span>
              <span className="text-muted">
                Operating Cities: {provider.cities.join(", ")}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {provider.name}
            </h1>
            <p className="text-xs font-serif italic text-muted">
              Audited GCC Ecosystem Service Provider • Operational Hubs: {provider.cities.join(", ")}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CitationButton
              pageTitle={`${provider.name} Verified Proof Record`}
              path={`/provider/${provider.slug}`}
            />
          </div>
        </div>

        {/* Score & Proof Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-hairline text-xs font-mono">
          <div>
            <span className="text-muted text-[10px] uppercase block">Evidence Depth Score</span>
            <span className="font-bold text-lg text-verdigris tabular-nums">
              {scoreData.score} pts
            </span>
          </div>

          <div>
            <span className="text-muted text-[10px] uppercase block">Audited GCC Clients</span>
            <span className="font-bold text-lg text-ink tabular-nums">
              {scoreData.distinctGccCount}
            </span>
          </div>

          <div>
            <span className="text-muted text-[10px] uppercase block">Verified Proof Links</span>
            <span className="font-bold text-lg text-ink tabular-nums">
              {proofLinks.length}
            </span>
          </div>

          <div>
            <span className="text-muted text-[10px] uppercase block">Attestation Filings</span>
            <span className="font-bold text-lg text-ink tabular-nums">
              {scoreData.evidenceCounts.attestation}
            </span>
          </div>
        </div>
      </section>

      {/* Proof Links Ledger Table */}
      <section className="space-y-4">
        <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            Audited Proof Links &amp; Client Engagements ({proofLinks.length})
          </h2>
          <span className="font-mono text-xs text-muted">Objective Scoring</span>
        </div>

        <div className="border border-hairline bg-surface overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[10px] uppercase tracking-wider text-muted">
                <th className="py-2.5 px-4">Proof Classification</th>
                <th className="py-2.5 px-4">Associated GCC Client</th>
                <th className="py-2.5 px-4">Audited Engagement Details</th>
                <th className="py-2.5 px-3 text-center">Score Contribution</th>
                <th className="py-2.5 px-3 text-right">Primary Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {proofLinks.map((pl, idx) => {
                const gcc = pl.gcc_id ? gccsMap.get(pl.gcc_id) : null;
                const firstEv = pl.evidence?.[0];
                const src = firstEv?.source_id ? sourcesMap.get(firstEv.source_id) : null;
                const kind = firstEv?.kind || pl.status;

                return (
                  <tr key={pl.id} className="hover:bg-paper/30">
                    <td className="py-3 px-4 font-mono text-[10px] uppercase font-bold text-ink">
                      <span className="inline-block px-1.5 py-0.5 border border-hairline bg-paper">
                        {kind.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-serif text-ink">
                      {gcc ? (
                        <Link
                          href={`/gcc/${gcc.slug}`}
                          className="font-bold hover:text-verdigris hover:underline font-sans text-sm"
                        >
                          {gcc.name}
                        </Link>
                      ) : (
                        <span className="text-muted font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-serif italic text-ink/90 text-xs">
                      {firstEv?.excerpt_summary || pl.service}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-verdigris">
                      {pl.status === "attested" ? "+3 pts" : "+2 pts"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {src ? (
                        <SourceFootnote
                          marker={idx + 1}
                          source={src}
                          fieldLabel={`${provider.name} — ${kind}`}
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
      </section>

      {/* Neutrality Note */}
      <section className="border border-hairline bg-paper/40 p-5 text-xs text-muted font-serif italic space-y-1">
        <div className="font-mono not-italic uppercase font-bold text-ink flex items-center gap-1.5 text-[10px]">
          <Shield className="w-3.5 h-3.5 text-verdigris" strokeWidth={1.5} />
          <span>Neutrality Firewall Rule</span>
        </div>
        <p>
          Providers cannot edit or delete documented proof links. Disputed engagements are flagged for peer audit with source documents required.
        </p>
      </section>
    </div>
  );
}
