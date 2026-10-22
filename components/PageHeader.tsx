"use client";

import React from "react";
import { CitationButton } from "./CitationButton";

interface PageHeaderProps {
  rubric: string;
  findingHeadline: string;
  findingDescription: string;
  pageTitle: string;
  path: string;
  primaryAction?: React.ReactNode;
  metadata?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  rubric,
  findingHeadline,
  findingDescription,
  pageTitle,
  path,
  primaryAction,
  metadata,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`border-b-2 border-ink pb-6 pt-2 space-y-4 ${className}`}>
      {/* Top Rubric Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="uppercase font-bold tracking-wider text-cobalt">
            {rubric}
          </span>
          <span className="text-muted">• Citable Record</span>
          {metadata && <span className="text-muted">• {metadata}</span>}
        </div>

        <div className="flex items-center gap-2">
          <CitationButton pageTitle={pageTitle} path={path} />
          {primaryAction}
        </div>
      </div>

      {/* Main Finding Headline */}
      <div className="max-w-prose space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-bold text-ink leading-tight tracking-tight">
          {findingHeadline}
        </h1>
        <p className="font-body text-base text-muted leading-relaxed">
          {findingDescription}
        </p>
      </div>
    </header>
  );
}
