"use client";

import React from "react";
import { ConfidenceStamp, ConfidenceGrade } from "./ConfidenceStamp";

interface ConfidencePillProps {
  grade: ConfidenceGrade;
  showLabel?: boolean;
  className?: string;
}

export function ConfidencePill({
  grade,
  showLabel = true,
  className = "",
}: ConfidencePillProps) {
  return (
    <ConfidenceStamp
      grade={grade}
      showDescriptor={showLabel}
      className={className}
    />
  );
}
