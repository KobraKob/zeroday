"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface CoverageMeterProps {
  wellSourcedCount: number;
  totalRegistryCount: number;
  reportedTotal: number;
  coveragePercentage: number;
  className?: string;
}

export function CoverageMeter({
  wellSourcedCount,
  totalRegistryCount,
  reportedTotal,
  coveragePercentage,
  className = "",
}: CoverageMeterProps) {
  return (
    <div
      className={`p-4 border border-hairline bg-surface space-y-3 ${className}`}
    >
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-mono uppercase tracking-wider text-muted font-bold text-[11px]">
          Evidence Completeness Index
        </span>
        <span className="font-mono font-bold text-ink tabular-nums text-xs">
          {wellSourcedCount} of {reportedTotal} ({coveragePercentage}%)
        </span>
      </div>

      {/* Hairline Proportional Rule */}
      <div className="w-full bg-paper border border-hairline h-2 overflow-hidden">
        <div
          className="bg-verdigris h-full transition-all duration-slow ease-ledger"
          style={{ width: `${Math.min(100, Math.max(3, coveragePercentage))}%` }}
        />
      </div>

      <div className="flex items-start gap-2 text-xs font-serif italic text-muted leading-relaxed">
        <AlertCircle className="w-3.5 h-3.5 text-verdigris mt-0.5 shrink-0 not-italic" strokeWidth={1.5} />
        <span>
          <strong className="font-mono not-italic uppercase text-[10px] text-ink mr-1 font-bold">
            Methodological Disclosure:
          </strong>
          ZeroDay rejects illusory completeness. Our live registry indexes{" "}
          <strong className="font-mono not-italic text-ink">{totalRegistryCount}</strong> verified corporate groups with{" "}
          <strong className="font-mono not-italic text-ink">{wellSourcedCount}</strong> anchored to &ge;3 statutory filings.
        </span>
      </div>
    </div>
  );
}
