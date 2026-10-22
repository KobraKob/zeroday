"use client";

import React, { useEffect, useState } from "react";
import { useSourceDrawer } from "./SourceDrawerContext";
import { ConfidenceStamp, ConfidenceGrade } from "./ConfidenceStamp";
import { ExternalLink, X, FileText, Calendar, Building, Info, Copy, Check, Shield } from "lucide-react";

export function SourceDrawer() {
  const { drawerState, closeDrawer } = useSourceDrawer();
  const { isOpen, source, claim, fieldLabel, marker, definitionRule } = drawerState;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  const claimGrade: ConfidenceGrade =
    claim?.confidence === "A" ||
    claim?.confidence === "B" ||
    claim?.confidence === "C" ||
    claim?.confidence === "D"
      ? claim.confidence
      : "B";

  const citationString = source
    ? `${source.publisher}. (${source.published_at || new Date().getFullYear()}). "${source.name}". Retrieved on ${source.retrieved_at} from ${source.url}.`
    : `ZeroDay Research Archive. (2026). GCC Reference Record. Retrieved from https://zeroday.in.`;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Source Evidence Footnote"
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-stretch md:items-end bg-ink/40 transition-opacity duration-base"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Margin Panel (Desktop) / Bottom Sheet (Mobile) */}
      <div
        className="relative z-10 w-full md:w-[440px] md:h-full max-h-[88vh] md:max-h-full bg-surface border-t md:border-t-0 md:border-l border-hairline shadow-sheet md:shadow-panel flex flex-col font-sans transition-transform duration-slow ease-ledger overflow-hidden rounded-t-sm md:rounded-none"
      >
        {/* Mobile handle indicator */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-hairline rounded-full" />
        </div>

        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-paper/60">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase font-bold tracking-wider text-ink">
              Footnote {marker !== undefined ? `[${marker}]` : "Evidence"}
            </span>
            <span className="text-[11px] font-mono text-muted">• Archival Record</span>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close footnote panel"
            className="w-11 h-11 flex items-center justify-center text-muted hover:text-ink hover:bg-paper transition-colors duration-fast -mr-2"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Panel Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm text-ink">
          {/* Recorded Datapoint Ledger Box */}
          <div className="p-4 border border-hairline bg-paper/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted uppercase tracking-wider">
              <span>{fieldLabel || (claim?.field ? `Field: ${claim.field}` : "Audited Datapoint")}</span>
              <ConfidenceStamp grade={claimGrade} size="sm" showDescriptor={true} />
            </div>

            <div className="font-display text-2xl sm:text-3xl font-bold text-ink tabular-nums tracking-tight">
              {claim ? (
                Array.isArray(claim.value) ? (
                  claim.value.join(", ")
                ) : typeof claim.value === "object" ? (
                  JSON.stringify(claim.value)
                ) : (
                  <>
                    {claim.value}
                    {claim.unit && (
                      <span className="font-sans text-xs text-muted font-normal ml-1">
                        {claim.unit}
                      </span>
                    )}
                  </>
                )
              ) : (
                <span className="font-mono text-base text-muted font-normal italic">
                  Not yet sourced
                </span>
              )}
            </div>

            {claim?.note && (
              <p className="pt-2 text-xs text-muted border-t border-hairline-subtle italic font-serif">
                {claim.note}
              </p>
            )}

            {claim?.demo && (
              <div className="pt-2 text-[11px] font-mono text-coral border-t border-hairline-subtle">
                [SYNTHETIC BENCHMARK FOR DEMONSTRATION]
              </div>
            )}
          </div>

          {/* Verbatim Primary Quote */}
          {claim?.exact_quote && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted">
                <FileText className="w-3.5 h-3.5 text-cobalt" strokeWidth={1.5} />
                <span>Primary Verbatim Excerpt</span>
              </div>
              <blockquote className="border-l-2 border-cobalt pl-3.5 py-1 text-xs font-serif italic leading-relaxed text-ink/90 bg-paper/40">
                &ldquo;{claim.exact_quote}&rdquo;
              </blockquote>
            </div>
          )}

          {/* Definition Rule */}
          {definitionRule && (
            <div className="space-y-1 text-xs">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted block">
                Rule Definition
              </span>
              <p className="text-muted leading-relaxed font-sans border-l border-hairline pl-3">
                {definitionRule}
              </p>
            </div>
          )}

          {/* Primary Source Dossier */}
          {source ? (
            <div className="space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted block">
                Primary Source Dossier
              </span>

              <div className="border border-hairline divide-y divide-hairline text-xs font-sans">
                <div className="p-3 bg-paper/30">
                  <span className="text-[10px] font-mono uppercase text-muted block mb-0.5">
                    Publication / Record Title
                  </span>
                  <div className="font-medium text-ink leading-snug font-serif text-sm">
                    {source.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 p-3 gap-3 bg-surface">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                      <Building className="w-3 h-3 text-muted" strokeWidth={1.5} /> Publisher
                    </span>
                    <span className="font-medium text-ink block mt-0.5">{source.publisher}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                      <Info className="w-3 h-3 text-muted" strokeWidth={1.5} /> Source Classification
                    </span>
                    <span className="font-mono text-ink uppercase block mt-0.5 text-[11px]">
                      {source.type}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted" strokeWidth={1.5} /> Date Published
                    </span>
                    <span className="font-mono text-ink block mt-0.5 tabular-nums">
                      {source.published_at || "Statutory Current"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted" strokeWidth={1.5} /> Date Retrieved
                    </span>
                    <span className="font-mono text-ink block mt-0.5 tabular-nums">
                      {source.retrieved_at}
                    </span>
                  </div>
                </div>

                {source.license_note && (
                  <div className="p-2.5 bg-paper/20 text-[11px] text-muted font-mono">
                    Licensing: {source.license_note}
                  </div>
                )}
              </div>

              {/* External Link Action */}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-ink text-ink font-mono text-xs font-semibold uppercase tracking-wider hover:bg-cobalt hover:border-cobalt hover:text-surface transition-colors duration-fast"
              >
                <span>Examine Public Source URL</span>
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
              </a>
            </div>
          ) : (
            <div className="p-4 border border-hairline bg-paper/40 text-xs text-muted font-mono space-y-1">
              <div className="font-semibold text-ink uppercase">Unanchored Datapoint</div>
              <p>This datapoint is pending primary source documentation in the current revision.</p>
            </div>
          )}

          {/* Academic Citation Box */}
          <div className="p-3.5 border border-hairline bg-paper/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-semibold">
                Citable Attribution String
              </span>
              <button
                type="button"
                onClick={handleCopyCitation}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-cobalt hover:text-ink font-semibold transition-colors duration-fast"
              >
                {copied ? <Check className="w-3 h-3" strokeWidth={1.5} /> : <Copy className="w-3 h-3" strokeWidth={1.5} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="text-[11px] font-mono text-muted leading-relaxed select-all break-words">
              {citationString}
            </p>
          </div>

          {/* Neutrality Firewall Notice */}
          <div className="p-3 border-l-2 border-hairline bg-paper/30 text-[11px] text-muted space-y-1">
            <div className="font-mono uppercase font-bold text-ink flex items-center gap-1.5 text-[10px]">
              <Shield className="w-3 h-3 text-cobalt" strokeWidth={1.5} />
              <span>Neutrality Firewall</span>
            </div>
            <p className="font-serif leading-relaxed">
              ZeroDay is an independent record. Every figure is traced directly to primary filings. Commercial partnerships and directory submissions never alter ranking, calculation, or evidence standards.
            </p>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-paper/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted">
            Press <kbd className="px-1.5 py-0.5 border border-hairline bg-surface text-[10px]">ESC</kbd> to dismiss
          </span>
          <button
            type="button"
            onClick={closeDrawer}
            className="min-h-[44px] px-4 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-ink hover:text-cobalt transition-colors duration-fast"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
