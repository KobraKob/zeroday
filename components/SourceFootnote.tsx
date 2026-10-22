"use client";

import React from "react";
import { useSourceDrawer } from "./SourceDrawerContext";
import { Claim, Source } from "../lib/schema";

interface SourceFootnoteProps {
  marker?: number | string;
  source?: Source | null;
  claim?: Claim | null;
  fieldLabel?: string;
  definitionRule?: string;
  value?: React.ReactNode;
  unit?: string;
  className?: string;
  showMarkerOnly?: boolean;
}

export function SourceFootnote({
  marker = 1,
  source,
  claim,
  fieldLabel,
  definitionRule,
  value,
  unit,
  className = "",
  showMarkerOnly = false,
}: SourceFootnoteProps) {
  const { openDrawer } = useSourceDrawer();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDrawer(source, claim, fieldLabel, marker, definitionRule);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      openDrawer(source, claim, fieldLabel, marker, definitionRule);
    }
  };

  // If marker only (e.g. adjacent to an existing number or text heading)
  if (showMarkerOnly || value === undefined) {
    if (!claim && !source) {
      return (
        <span
          className="inline-block align-super text-[10px] font-mono text-muted select-none ml-0.5"
          title="Not yet sourced in primary registry"
        >
          [—]
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Inspect source footnote [${marker}]: ${fieldLabel || source?.publisher || "Evidence"}`}
        title={`Source Footnote [${marker}]: Click to open margin verification ledger`}
        className={`inline-flex items-center justify-center align-super text-[11px] font-mono font-semibold text-verdigris hover:text-ink hover:underline decoration-1 underline-offset-2 ml-0.5 px-0.5 cursor-pointer focus-visible:outline-verdigris transition-colors duration-fast ${className}`}
      >
        <span className="sr-only">Footnote </span>
        <sup className="font-mono text-[11px] font-bold">[{marker}]</sup>
      </button>
    );
  }

  // If value is null/empty/not sourced
  if (value === null || value === undefined || value === "") {
    return (
      <span className="inline-flex items-center gap-1 text-muted text-xs font-mono italic">
        <span>Not yet sourced</span>
        <span className="text-[10px] not-italic opacity-70">[—]</span>
      </span>
    );
  }

  // Full value + superscript citation
  return (
    <span className={`inline-flex items-baseline gap-0.5 group ${className}`}>
      <span className="tabular-nums font-mono">
        {value}
        {unit && <span className="font-sans text-xs text-muted ml-0.5">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Source footnote [${marker}] for ${fieldLabel || "datapoint"}`}
        title={`Footnote [${marker}]: ${source?.publisher || "Verified claim"}. Click to inspect source margin.`}
        className="inline-flex items-center justify-center text-[10px] font-mono font-bold text-verdigris hover:text-ink hover:underline decoration-1 underline-offset-2 px-0.5 cursor-pointer focus-visible:outline-verdigris transition-colors duration-fast"
      >
        <sup>[{marker}]</sup>
      </button>
    </span>
  );
}
