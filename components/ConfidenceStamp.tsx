"use client";

import React from "react";

export type ConfidenceGrade = "A" | "B" | "C" | "D";

interface ConfidenceStampProps {
  grade: ConfidenceGrade;
  size?: "sm" | "md" | "lg";
  showDescriptor?: boolean;
  className?: string;
}

export function ConfidenceStamp({
  grade,
  size = "md",
  showDescriptor = false,
  className = "",
}: ConfidenceStampProps) {
  const descriptions: Record<ConfidenceGrade, { title: string; rubric: string; descriptor: string }> = {
    A: {
      title: "Grade A: Statutory & Regulatory Record",
      rubric: "Ministry of Corporate Affairs (MCA) RoC records, CIN filings, registered lease deeds, or gazetted state notifications.",
      descriptor: "Statutory",
    },
    B: {
      title: "Grade B: Authoritative Corporate Disclosure",
      rubric: "Official enterprise newsroom disclosures, audited 10-K / annual reports, or peer-reviewed analyst surveys (e.g. nasscom-Zinnov, JLL).",
      descriptor: "Verified Disclosure",
    },
    C: {
      title: "Grade C: Secondary Media Sourcing",
      rubric: "Single trade press publication, verified commercial real estate broker brief, or secondary tech journalism.",
      descriptor: "Secondary Press",
    },
    D: {
      title: "Grade D: Unverified Inferred Datapoint",
      rubric: "Third-party directory estimate, unverified vendor headcount claim, or statistical interpolation pending primary audit.",
      descriptor: "Unverified Estimate",
    },
  };

  const meta = descriptions[grade];

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 tracking-wider",
    md: "text-[11px] px-2 py-0.5 tracking-wider",
    lg: "text-xs px-2.5 py-1 tracking-widest",
  };

  return (
    <span
      role="note"
      aria-label={`${meta.title} — ${meta.rubric}`}
      title={`${meta.title}\n${meta.rubric}`}
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-semibold border border-ink text-ink bg-transparent select-none transition-colors duration-fast hover:border-verdigris hover:text-verdigris cursor-help ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: "inset 0 0 0 1px currentColor",
        letterSpacing: "0.08em",
      }}
    >
      <span className="font-bold underline decoration-1 underline-offset-2">
        {grade}
      </span>
      {showDescriptor && (
        <span className="text-[10px] font-normal tracking-normal normal-case border-l border-current pl-1.5 opacity-90">
          {meta.descriptor}
        </span>
      )}
    </span>
  );
}
