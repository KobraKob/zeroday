"use client";

import React from "react";
import { useSourceDrawer } from "./SourceDrawerContext";
import { Claim, Source } from "../lib/schema";
import { ConfidenceStamp, ConfidenceGrade } from "./ConfidenceStamp";

interface ClaimValueProps {
  claim?: Claim | null;
  source?: Source | null;
  fallbackValue?: string | number | null;
  unit?: string;
  fieldLabel?: string;
  showGrade?: boolean;
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

  return (
    <span className={`inline-flex items-baseline gap-1.5 flex-wrap ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className="text-left font-mono font-medium text-ink hover:text-verdigris hover:underline decoration-1 underline-offset-2 cursor-pointer transition-colors duration-fast"
        title="Inspect primary source verification"
      >
        <span>{displayValue}</span>
        {source && (
          <sup className="text-[10px] font-mono text-verdigris font-bold ml-0.5">
            [{marker}]
          </sup>
        )}
      </button>

      {claim?.demo && (
        <span
          title="Demo Data: Synthetic benchmark for demonstration"
          className="text-[10px] font-mono px-1 py-0.2 border border-vermilion text-vermilion"
        >
          DEMO
        </span>
      )}

      {showGrade && claim && (
        <ConfidenceStamp grade={grade} size="sm" />
      )}
    </span>
  );
}
