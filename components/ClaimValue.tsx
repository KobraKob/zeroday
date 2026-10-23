"use client";

import React from "react";
import { useSourceDrawer } from "./SourceDrawerContext";
import { Claim, Source } from "../lib/schema";
import { ConfidenceStamp, ConfidenceGrade } from "./ConfidenceStamp";

interface ClaimValueProps {
  claim?: (Claim & { last_checked_at?: string }) | null;
  source?: (Source & { last_checked_at?: string }) | null;
  fallbackValue?: string | number | null;
  unit?: string;
  fieldLabel?: string;
  showGrade?: boolean;
  showDates?: boolean;
  marker?: number | string;
  className?: string;
}

export function ClaimValue({
  claim,
  source,
  fallbackValue,
  unit,
  fieldLabel,
  showGrade = false,
  showDates = true,
  marker = 1,
  className = "",
}: ClaimValueProps) {
  const { openDrawer } = useSourceDrawer();

  const value = claim?.value ?? fallbackValue;

  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-muted font-mono italic text-xs">
        Not yet sourced
      </span>
    );
  }

  const displayValue = Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
    ? JSON.stringify(value)
    : `${value}${unit || claim?.unit ? ` ${unit || claim?.unit}` : ""}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDrawer(source, claim, fieldLabel, marker);
  };

  const grade: ConfidenceGrade =
    claim?.confidence === "A" ||
    claim?.confidence === "B" ||
    claim?.confidence === "C" ||
    claim?.confidence === "D"
      ? claim.confidence
      : "B";

  const asOf = claim?.as_of || source?.published_at || "2026";
  const lastChecked = claim?.last_checked_at
    ? claim.last_checked_at.slice(0, 10)
    : source?.retrieved_at
    ? source.retrieved_at.slice(0, 10)
    : "2026-10";

  return (
    <span className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span className="inline-flex items-baseline gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={handleClick}
          className="text-left font-mono font-medium text-ink hover:text-cobalt hover:underline decoration-1 underline-offset-2 cursor-pointer transition-colors duration-fast"
          title={`Inspect primary source verification (As of: ${asOf}, Checked: ${lastChecked})`}
        >
          <span>{displayValue}</span>
          {source && (
            <sup className="text-[10px] font-mono text-cobalt font-bold ml-0.5">
              [{marker}]
            </sup>
          )}
        </button>

        {claim?.demo && (
          <span
            title="Demo Data: Synthetic benchmark for demonstration"
            className="text-[10px] font-mono px-1 py-0.2 border border-coral text-coral"
          >
            DEMO
          </span>
        )}

        {showGrade && claim && (
          <ConfidenceStamp grade={grade} size="sm" />
        )}
      </span>

      {showDates && (
        <span className="text-[9px] font-mono text-muted/80 tracking-tight select-none">
          as of <span className="text-ink/80">{asOf}</span> • checked <span className="text-ink/80">{lastChecked}</span>
        </span>
      )}
    </span>
  );
}
