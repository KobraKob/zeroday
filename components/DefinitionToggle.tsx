"use client";

import React from "react";
import { CountDefinition } from "../lib/schema";

interface DefinitionToggleProps {
  definitions: CountDefinition[];
  selectedUnit: "parent_company" | "legal_entity" | "centre_unit";
  onSelectUnit: (unit: "parent_company" | "legal_entity" | "centre_unit") => void;
  className?: string;
  showRuleDetails?: boolean;
}

export function DefinitionToggle({
  definitions,
  selectedUnit,
  onSelectUnit,
  className = "",
  showRuleDetails = true,
}: DefinitionToggleProps) {
  const selectedDef = definitions.find((d) => d.unit === selectedUnit);

  const unitLabels: Record<string, { short: string; formal: string }> = {
    parent_company: {
      short: "Parent Enterprise",
      formal: "Global Parent Group",
    },
    legal_entity: {
      short: "Legal Entity",
      formal: "MCA Registered Entity",
    },
    centre_unit: {
      short: "Campus Unit",
      formal: "Physical Operating Campus",
    },
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Unit Selector Tabs */}
      <div
        role="tablist"
        aria-label="Counting unit definition selector"
        className="flex flex-wrap border border-hairline bg-paper/40 p-1 gap-1"
      >
        {definitions.map((def) => {
          const isSelected = def.unit === selectedUnit;
          const labelInfo = unitLabels[def.unit] || { short: def.label, formal: def.unit };

          return (
            <button
              key={def.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectUnit(def.unit)}
              className={`flex-1 min-w-[140px] px-3.5 py-2 text-xs font-mono font-semibold transition-colors duration-fast flex items-center justify-center gap-1.5 min-h-[44px] ${
                isSelected
                  ? "bg-ink text-paper border border-ink shadow-xs"
                  : "bg-transparent text-muted hover:text-ink hover:bg-surface border border-transparent"
              }`}
            >
              <span>{labelInfo.short}</span>
              <span className={`text-[10px] uppercase font-normal ${isSelected ? "text-paper/70" : "text-muted"}`}>
                [{def.unit.replace("_", " ")}]
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Definition Rubric Box */}
      {showRuleDetails && selectedDef && (
        <div className="border border-hairline bg-surface p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-hairline-subtle pb-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
              Rule Definition: {selectedDef.label}
            </span>
            <span className="font-mono text-[10px] text-muted uppercase">
              Audited Criterion
            </span>
          </div>

          <p className="font-serif text-sm leading-relaxed text-ink/90 italic">
            &ldquo;{selectedDef.rule_text}&rdquo;
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-hairline-subtle text-[11px] font-mono">
            <div>
              <span className="font-bold text-cobalt uppercase block mb-0.5">
                Included in count:
              </span>
              <span className="text-muted leading-relaxed">
                {selectedDef.includes.join("; ")}
              </span>
            </div>
            <div>
              <span className="font-bold text-coral uppercase block mb-0.5">
                Excluded from count:
              </span>
              <span className="text-muted leading-relaxed">
                {selectedDef.excludes.join("; ")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
