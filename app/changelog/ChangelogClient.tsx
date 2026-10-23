"use client";

import React, { useState } from "react";
import { EventRecord } from "../../lib/repo/eventsRepo";
import { PageHeader } from "../../components/PageHeader";
import {
  FileText,
  Activity,
  Building,
  ShieldAlert,
  ArrowRight,
  Filter,
  Clock,
  Sparkles,
} from "lucide-react";

interface ChangelogClientProps {
  events: EventRecord[];
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  new_gcc: {
    label: "New GCC",
    badgeClass: "border-cobalt text-cobalt bg-cobalt/10",
    icon: Building,
  },
  claim_change: {
    label: "Claim Change",
    badgeClass: "border-mint text-mint bg-mint/10",
    icon: Activity,
  },
  policy_change: {
    label: "Policy Gazette",
    badgeClass: "border-marigold text-marigold bg-marigold/10",
    icon: FileText,
  },
  staleness_downgrade: {
    label: "Staleness Downgrade",
    badgeClass: "border-coral text-coral bg-coral/10",
    icon: Clock,
  },
  source_dead: {
    label: "Dead Source",
    badgeClass: "border-coral text-coral bg-coral/20",
    icon: ShieldAlert,
  },
};

export function ChangelogClient({ events }: ChangelogClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filteredEvents =
    selectedFilter === "all"
      ? events
      : events.filter((e) => e.type === selectedFilter);

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Editorial Header */}
      <PageHeader
        rubric="Epistemic Provenance Stream"
        findingHeadline="ZeroDay Public Changelog: Immutable record of ecosystem events and factual updates"
        findingDescription="Every newly incorporated capability centre, altered factual claim, gazetted state incentive, and confidence downgrade is permanently recorded in the public ledger."
        pageTitle="System Changelog"
        path="/changelog"
        metadata={`${events.length} Historical Events`}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-hairline pb-3 font-mono text-xs">
        <span className="text-muted text-[10px] uppercase font-bold mr-2 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Filter:
        </span>
        {[
          { key: "all", label: "All Events" },
          { key: "new_gcc", label: "New GCCs" },
          { key: "claim_change", label: "Claim Changes" },
          { key: "policy_change", label: "Policy Gazettes" },
          { key: "staleness_downgrade", label: "Freshness Downgrades" },
          { key: "source_dead", label: "Dead Sources" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-3 py-1 border transition-colors uppercase font-bold text-[10px] ${
              selectedFilter === tab.key
                ? "bg-ink text-paper border-ink"
                : "bg-surface text-muted border-hairline hover:text-ink hover:border-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="border border-hairline bg-surface p-6 shadow-xs">
        <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-hairline">
          {filteredEvents.map((evt) => {
            const cfg = TYPE_CONFIG[evt.type] || {
              label: evt.type,
              badgeClass: "border-hairline text-muted",
              icon: Activity,
            };
            const Icon = cfg.icon;
            const dateStr = new Date(evt.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const timeStr = new Date(evt.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={evt.id} className="relative group">
                {/* Bullet */}
                <div className="absolute -left-[30px] top-1 w-4 h-4 bg-surface border-2 border-ink rounded-full group-hover:bg-cobalt group-hover:border-cobalt transition-colors" />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 border ${cfg.badgeClass}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="font-display font-bold text-sm text-ink">
                      {evt.entity}
                    </span>
                    <span className="font-mono text-[11px] text-muted ml-auto">
                      {dateStr} • {timeStr}
                    </span>
                  </div>

                  <p className="text-xs text-muted leading-relaxed font-sans">
                    {evt.summary}
                  </p>

                  <div className="font-mono text-[10px] text-muted/70 pt-0.5">
                    Event Ref: <span className="font-mono">{evt.id}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
