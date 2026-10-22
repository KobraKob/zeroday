"use client";

import React from "react";
import Link from "next/link";
import { Gcc, Claim, Source, Signal, ProofLink, Provider } from "../../../lib/schema";
import { ConfidenceStamp } from "../../../components/ConfidenceStamp";
import { SourceFootnote } from "../../../components/SourceFootnote";
import { CitationButton } from "../../../components/CitationButton";
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  Award,
  Radio,
  FileText,
  ExternalLink,
  Shield,
  ArrowLeft,
} from "lucide-react";

interface GccDetailClientProps {
  gcc: Gcc;
  claims: Claim[];
  sources: Source[];
  signals: Signal[];
  proofLinks: ProofLink[];
  providers: Provider[];
}

export function GccDetailClient({
  gcc,
  claims,
  sources,
  signals,
  proofLinks,
  providers,
}: GccDetailClientProps) {
  const sourcesMap = new Map<string, Source>();
  sources.forEach((s) => sourcesMap.set(s.id, s));

  const providersMap = new Map<string, Provider>();
  providers.forEach((p) => providersMap.set(p.id, p));

  return (
    <div className="space-y-8 font-sans">
      {/* Back button */}
      <div>
        <Link
          href="/registry"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors duration-fast min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>&larr; Return to Registry</span>
        </Link>
      </div>

      {/* Header Banner */}
      <section className="border border-hairline bg-surface p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="uppercase px-2 py-0.5 border border-ink bg-paper font-bold text-ink">
                {gcc.sector}
              </span>
              <span className="text-muted">
                Parent HQ: {gcc.parent_hq_country}
              </span>
              <span
                className={`text-[10px] uppercase px-2 py-0.5 border font-bold ${
                  gcc.status === "expanding"
                    ? "border-verdigris text-verdigris bg-verdigris/10"
                    : "border-ink text-ink bg-paper/40"
                }`}
              >
                {gcc.status}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {gcc.name}
            </h1>
            <p className="text-xs font-serif italic text-muted">
              Global Parent Enterprise:{" "}
              <strong className="text-ink not-italic">{gcc.parent_name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CitationButton
              pageTitle={`${gcc.name} Verified GCC Record`}
              path={`/gcc/${gcc.slug}`}
            />
          </div>
        </div>

        {/* Identity Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-hairline text-xs font-mono">
          <div>
            <span className="text-muted text-[10px] uppercase block">Incorporated Entity</span>
            <span className="font-medium text-ink">
              {gcc.india_entity_name || "Statutory entity undisclosed"}
            </span>
          </div>

          <div>
            <span className="text-muted text-[10px] uppercase block">Statutory RoC CIN</span>
            <span className="text-ink">
              {gcc.cin || "Not yet sourced"}
            </span>
          </div>

          <div>
            <span className="text-muted text-[10px] uppercase block">Established Year</span>
            <span className="text-ink tabular-nums">
              {gcc.established_year || "Not yet sourced"}
            </span>
          </div>

          <div>
            <span className="text-muted text-[10px] uppercase block">Headcount Scale</span>
            <span className="text-ink tabular-nums">
              {gcc.headcount_band || "Not yet sourced"}
            </span>
          </div>
        </div>
      </section>

      {/* Campus Hubs & Functions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-hairline bg-surface space-y-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            Operating Campuses ({gcc.cities.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {gcc.cities.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1 px-2.5 py-1 border border-hairline bg-paper text-xs font-mono text-ink"
              >
                <MapPin className="w-3 h-3 text-verdigris" />
                <span>{city}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 border border-hairline bg-surface space-y-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            Functional Mandates
          </span>
          <div className="flex flex-wrap gap-2">
            {gcc.functions.map((fn) => (
              <span
                key={fn}
                className="px-2.5 py-1 border border-hairline bg-paper text-xs font-mono text-ink"
              >
                {fn}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Claims Audit Ledger */}
      <section className="space-y-3">
        <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            Audited Primary Evidence Claims ({claims.length})
          </h2>
          <span className="font-mono text-xs text-muted">Primary Sources</span>
        </div>

        <div className="border border-hairline bg-surface overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[10px] uppercase tracking-wider text-muted">
                <th className="py-2.5 px-4">Field</th>
                <th className="py-2.5 px-4">Recorded Metric</th>
                <th className="py-2.5 px-4">Primary Source</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3 text-right">Footnote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {claims.map((claim, idx) => {
                const source = sourcesMap.get(claim.source_id);

                return (
                  <tr key={claim.id} className="hover:bg-paper/30">
                    <td className="py-3 px-4 font-mono font-medium text-ink uppercase text-[11px]">
                      {claim.field.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-ink tabular-nums">
                      {String(claim.value)} {claim.unit || ""}
                    </td>
                    <td className="py-3 px-4 text-xs font-serif italic text-muted">
                      {source ? `${source.publisher} (${source.name})` : "Archival filing"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <ConfidenceStamp grade={claim.confidence} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {source && (
                        <SourceFootnote
                          marker={idx + 1}
                          source={source}
                          claim={claim}
                          fieldLabel={`${gcc.name} — ${claim.field}`}
                          showMarkerOnly={true}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Associated Proof Links */}
      {proofLinks.length > 0 && (
        <section className="space-y-3">
          <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-ink">
              Provider Proof Links &amp; Engagements ({proofLinks.length})
            </h2>
            <span className="font-mono text-xs text-muted">Verified Vendor Work</span>
          </div>

          <div className="border border-hairline bg-surface divide-y divide-hairline">
            {proofLinks.map((pl) => {
              const prov = providersMap.get(pl.provider_id);
              const firstEv = pl.evidence?.[0];
              const src = firstEv?.source_id ? sourcesMap.get(firstEv.source_id) : null;
              const kind = firstEv?.kind || pl.status;

              return (
                <div key={pl.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink uppercase text-[10px] px-1.5 py-0.5 border border-hairline bg-paper">
                        {kind.replace(/_/g, " ")}
                      </span>
                      {prov && (
                        <Link
                          href={`/provider/${prov.slug}`}
                          className="font-display font-bold text-ink hover:text-verdigris hover:underline text-sm"
                        >
                          {prov.name}
                        </Link>
                      )}
                    </div>
                    <p className="text-muted font-serif italic mt-1">
                      {firstEv?.excerpt_summary || pl.service}
                    </p>
                  </div>

                  {src && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-verdigris hover:text-ink font-semibold shrink-0"
                    >
                      <span>Public Proof Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
