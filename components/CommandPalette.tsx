"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Building,
  MapPin,
  Shield,
  Radio,
  GitCompare,
  Sparkles,
  ArrowRight,
  Command,
} from "lucide-react";
import gccData from "../data/gccs.json";
import citiesData from "../data/cities.json";
import providersData from "../data/providers.json";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Global keyboard shortcut: Cmd+K or Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or trigger
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Navigation shortcuts
  const navItems = [
    { name: "Reconcile Published Tallies (1,400 to 2,975)", href: "/reconcile", type: "Page", category: "Core Index" },
    { name: "Verified GCC Registry Directory", href: "/registry", type: "Page", category: "Core Index" },
    { name: "Signal Radar & Pipeline", href: "/radar", type: "Page", category: "Core Index" },
    { name: "Site Selection Multi-City Compare", href: "/compare", type: "Page", category: "Analysis" },
    { name: "Proof-Backed Provider Directory", href: "/providers", type: "Page", category: "Directory" },
    { name: "Advisor Site Selection Tool", href: "/advisor", type: "Tool", category: "Tool" },
    { name: "Ask GCC Atlas (Groq AI Grounded Engine)", href: "/ask", type: "AI", category: "Intelligence" },
    { name: "Attest / Submit Client Record", href: "/submit", type: "Form", category: "Governance" },
    { name: "Methodology & Statutory Rubric", href: "/methodology", type: "Page", category: "Standards" },
  ];

  const filteredNav = q
    ? navItems.filter((item) => item.name.toLowerCase().includes(q))
    : navItems.slice(0, 4);

  // Filter GCCs
  const filteredGccs = q
    ? (gccData as any[])
        .filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.parent_name.toLowerCase().includes(q) ||
            g.sector.toLowerCase().includes(q) ||
            g.cities.some((c: string) => c.toLowerCase().includes(q))
        )
        .slice(0, 6)
    : (gccData as any[]).slice(0, 3);

  // Filter Cities
  const filteredCities = q
    ? (citiesData as any[])
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 4)
    : [];

  // Filter Providers
  const filteredProviders = q
    ? (providersData as any[])
        .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        .slice(0, 4)
    : [];

  const allResults = [
    ...filteredNav.map((n) => ({ ...n, kind: "nav" as const })),
    ...filteredGccs.map((g) => ({
      name: `${g.name} (${g.parent_name})`,
      href: `/gcc/${g.slug}`,
      type: `${g.sector} • ${g.cities.join(", ")}`,
      category: "GCC Entity",
      cin: g.cin,
      kind: "gcc" as const,
    })),
    ...filteredCities.map((c) => ({
      name: `${c.name} Hub`,
      href: `/compare?cities=${c.id}`,
      type: `${c.tier} • ${c.primary_corridors?.slice(0, 2).join(", ") || "Tech Corridor"}`,
      category: "Tech Cluster",
      kind: "city" as const,
    })),
    ...filteredProviders.map((p) => ({
      name: p.name,
      href: `/provider/${p.slug}`,
      type: p.category.replace(/_/g, " "),
      category: "Provider",
      score: p.evidence_score,
      kind: "provider" as const,
    })),
  ];

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(allResults.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % Math.max(allResults.length, 1));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex].href);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal GCC Atlas Command Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-fast"
    >
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-surface border border-hairline shadow-2xl font-sans overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-hairline bg-paper/30">
          <Search className="w-4 h-4 text-muted shrink-0 mr-3" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search GCCs, parent companies, cities, providers, or pages..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-sans text-ink placeholder:text-muted focus:outline-none min-h-[36px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted hover:text-ink px-1.5 py-1 text-xs font-mono"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-hairline bg-surface text-[10px] font-mono text-muted uppercase ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-hairline-subtle p-2">
          {allResults.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-muted font-mono text-xs">
              <p>No verified records matching &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] font-serif italic text-muted">
                Tip: Try searching &ldquo;Bengaluru&rdquo;, &ldquo;JPMorgan&rdquo;, &ldquo;Reconcile&rdquo;, or &ldquo;RoC CIN&rdquo;
              </p>
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.kind}-${item.name}-${idx}`}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-fast ${
                    isSelected
                      ? "bg-verdigris/10 border-l-2 border-verdigris"
                      : "hover:bg-paper/50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider px-1 py-0.5 border border-hairline bg-surface text-muted">
                        {item.category}
                      </span>
                      <span className="text-xs font-semibold text-ink truncate font-sans">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-muted truncate">
                      {item.type}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.kind === "gcc" && (item as any).cin && (
                      <span className="font-mono text-[10px] text-muted border border-hairline px-1 hidden sm:inline-block">
                        CIN Verified
                      </span>
                    )}
                    {item.kind === "provider" && (item as any).score !== undefined && (
                      <span className="font-mono text-[10px] text-verdigris font-bold border border-verdigris px-1">
                        Score: {(item as any).score}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-hairline bg-paper/40 flex items-center justify-between text-[11px] font-mono text-muted">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-verdigris font-semibold">Groq AI Grounded Engine Active</span>
        </div>
      </div>
    </div>
  );
}
