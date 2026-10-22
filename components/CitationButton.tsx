"use client";

import React, { useState } from "react";
import { generatePageCitation } from "../lib/citation";
import { Quote, Check, Copy, X } from "lucide-react";

interface CitationButtonProps {
  pageTitle: string;
  path: string;
  className?: string;
}

export function CitationButton({ pageTitle, path, className = "" }: CitationButtonProps) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const citationText = generatePageCitation(pageTitle, path);

  const handleCopy = () => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium border border-hairline bg-surface hover:bg-paper hover:border-ink transition-colors duration-fast text-ink min-h-[36px] ${className}`}
        title="Generate formal academic/archival citation for this page"
      >
        <Quote className="w-3.5 h-3.5 text-cobalt" strokeWidth={1.5} />
        <span className="uppercase text-[11px] tracking-wider">Cite View</span>
      </button>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Citable Archival Reference"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg bg-surface border border-hairline shadow-panel p-6 space-y-4 font-sans text-ink">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted block">
                  Academic Attribution
                </span>
                <h3 className="font-display font-bold text-base text-ink">
                  Formal Reference Citation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink text-xs font-mono"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-3.5 bg-paper/60 border border-hairline font-mono text-xs text-ink select-all leading-relaxed break-words">
              {citationText}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-[11px] font-mono text-muted">
                Standard: APA 7th Edition with archival timestamp
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-mono font-semibold uppercase tracking-wider hover:bg-cobalt transition-colors duration-fast"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy String"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
