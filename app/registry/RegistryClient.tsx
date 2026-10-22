"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Gcc, Claim, Source } from "../../lib/schema";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import { SourceFootnote } from "../../components/SourceFootnote";
import { CitationButton } from "../../components/CitationButton";
import sectorsData from "../../data/sectors.json";
import {
  Search,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  X,
  Check,
  Building2,
  FileCheck,
} from "lucide-react";
import Fuse from "fuse.js";

interface RegistryClientProps {
  initialGccs: Gcc[];
  claims: Claim[];
  sources: Source[];
}

type SortField = "name" | "sector" | "cities" | "headcount_band" | "established_year" | "status";
type SortDirection = "asc" | "desc";

// Sector mapping lookup
const sectorMapping = sectorsData.mapping as Record<string, string>;
function getTopLevelSector(granularSector: string): string {
  return sectorMapping[granularSector] || granularSector;
}

export function RegistryClient({
  initialGccs,
  claims,
  sources,
}: RegistryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedBand, setSelectedBand] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [filterHasTracedCin, setFilterHasTracedCin] = useState<boolean>(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Inline row expansion state
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Custom popover dropdown states
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePopover = (popoverName: string) => {
    setOpenPopover((prev) => (prev === popoverName ? null : popoverName));
  };

  const closePopover = () => setOpenPopover(null);

  const toggleRowExpansion = (gccId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(gccId)) {
        next.delete(gccId);
      } else {
        next.add(gccId);
      }
      return next;
    });
  };

  // Fast lookups
  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const claimsMap = useMemo(() => {
    const map = new Map<string, Claim>();
    claims.forEach((c) => map.set(c.id, c));
    return map;
  }, [claims]);

  // Distinct filter values
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    initialGccs.forEach((g) => g.cities.forEach((c) => cities.add(c)));
    return Array.from(cities).sort();
  }, [initialGccs]);

  const allSectors = useMemo(() => {
    return sectorsData.topLevelSectors;
  }, []);

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    initialGccs.forEach((g) => countries.add(g.parent_hq_country));
    return Array.from(countries).sort();
  }, [initialGccs]);

  const headcountBands = ["<500", "500-1k", "1k-5k", "5k+"];
  const statuses = ["operating", "expanding", "announced"];

  // Pre-calculate per-GCC primary source and claims for 1:1 row footnotes
  const gccMetadataMap = useMemo(() => {
    const map = new Map<
      string,
      {
        primarySource: Source | null;
        hasHeadcountSource: boolean;
        hasEstYearSource: boolean;
        hasStatusSource: boolean;
        claims: Claim[];
      }
    >();

    initialGccs.forEach((gcc) => {
      const gClaims = gcc.claim_ids
        .map((id) => claimsMap.get(id))
        .filter(Boolean) as Claim[];

      let primarySource: Source | null = null;
      let hasHeadcountSource = false;
      let hasEstYearSource = false;
      let hasStatusSource = false;

      for (const claim of gClaims) {
        if (claim.field === "headcount_band" && sourcesMap.has(claim.source_id)) {
          hasHeadcountSource = true;
        }
        if (claim.field === "established_year" && sourcesMap.has(claim.source_id)) {
          hasEstYearSource = true;
          if (!primarySource) {
            primarySource = sourcesMap.get(claim.source_id) || null;
          }
        }
        if (claim.field === "status" && sourcesMap.has(claim.source_id)) {
          hasStatusSource = true;
        }
        if (!primarySource && sourcesMap.has(claim.source_id)) {
          primarySource = sourcesMap.get(claim.source_id) || null;
        }
      }

      // If status is present in the record and has a verified primary source attached, treat as sourced
      if (gcc.status && primarySource) {
        hasStatusSource = true;
      }

      map.set(gcc.id, {
        primarySource,
        hasHeadcountSource,
        hasEstYearSource,
        hasStatusSource,
        claims: gClaims,
      });
    });

    return map;
  }, [initialGccs, claimsMap, sourcesMap]);

  // Filtering
  const filteredGccs = useMemo(() => {
    let result = initialGccs;

    if (selectedCity !== "all") {
      result = result.filter((g) => g.cities.includes(selectedCity));
    }
    if (selectedSector !== "all") {
      result = result.filter((g) => getTopLevelSector(g.sector) === selectedSector);
    }
    if (selectedCountry !== "all") {
      result = result.filter((g) => g.parent_hq_country === selectedCountry);
    }
    if (selectedBand !== "all") {
      result = result.filter((g) => g.headcount_band === selectedBand);
    }
    if (selectedStatus !== "all") {
      result = result.filter((g) => g.status === selectedStatus);
    }
    if (filterHasTracedCin) {
      result = result.filter((g) => g.cin_status === "verified");
    }

    if (searchQuery.trim() !== "") {
      const fuse = new Fuse(result, {
        keys: [
          "name",
          "parent_name",
          "sector",
          "cities",
          "functions",
          "india_entity_name",
          "cin",
        ],
        threshold: 0.35,
      });
      result = fuse.search(searchQuery).map((res) => res.item);
    }

    // Apply Sorting
    return [...result].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "sector":
          valA = getTopLevelSector(a.sector).toLowerCase();
          valB = getTopLevelSector(b.sector).toLowerCase();
          break;
        case "cities":
          valA = a.cities[0] || "";
          valB = b.cities[0] || "";
          break;
        case "headcount_band":
          valA = a.headcount_band || "";
          valB = b.headcount_band || "";
          break;
        case "established_year":
          valA = a.established_year || 0;
          valB = b.established_year || 0;
          break;
        case "status":
          valA = a.status || "";
          valB = b.status || "";
          break;
        default:
          valA = a.name;
          valB = b.name;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    initialGccs,
    searchQuery,
    selectedCity,
    selectedSector,
    selectedCountry,
    selectedBand,
    selectedStatus,
    filterHasTracedCin,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedSector("all");
    setSelectedCountry("all");
    setSelectedBand("all");
    setSelectedStatus("all");
    setFilterHasTracedCin(false);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCity !== "all" ||
    selectedSector !== "all" ||
    selectedCountry !== "all" ||
    selectedBand !== "all" ||
    selectedStatus !== "all" ||
    filterHasTracedCin;

  // Export CSV with provenance
  const handleExportCsv = () => {
    const headers = [
      "parent",
      "india_entity",
      "cin",
      "cin_status",
      "sector",
      "top_level_sector",
      "cities",
      "established_year",
      "headcount_band",
      "status",
      "primary_source_url",
    ];

    const rows = filteredGccs.map((g) => {
      const meta = gccMetadataMap.get(g.id);
      return [
        `"${(g.parent_name || "").replace(/"/g, '""')}"`,
        `"${(g.india_entity_name || "").replace(/"/g, '""')}"`,
        `"${(g.cin || "").replace(/"/g, '""')}"`,
        `"${g.cin_status || "unverified"}"`,
        `"${(g.sector || "").replace(/"/g, '""')}"`,
        `"${getTopLevelSector(g.sector)}"`,
        `"${g.cities.join(", ")}"`,
        `"${g.established_year || "Not yet sourced"}"`,
        `"${g.headcount_band || "Not yet sourced"}"`,
        `"${g.status}"`,
        `"${meta?.primarySource?.url || "https://zeroday.in"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `gcc_atlas_registry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic Computed Metrics
  const totalCentresCount = initialGccs.length;
  const tracedCinCount = useMemo(() => {
    return initialGccs.filter((g) => g.cin_status === "verified").length;
  }, [initialGccs]);
  const tracedPercentage = Math.round((tracedCinCount / totalCentresCount) * 100);
  const totalCitiesCount = allCities.length;
  const totalSectorsCount = allSectors.length;

  return (
    <div className="space-y-6 font-sans">
      {/* 9. Hero Section: Left = Headline & Computed Explainer; Right = 3 Large Numerals Strip */}
      <section
        aria-label="Registry Overview"
        className="border-b-2 border-ink pb-8 pt-2"
      >
        {/* Rubric and Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono mb-4">
          <div className="flex items-center gap-2">
            <span className="uppercase font-bold tracking-wider text-cobalt">
              Ecosystem directory
            </span>
            <span className="text-muted">• Citable archival record</span>
            <span className="text-muted">• {filteredGccs.length} centres in view</span>
          </div>

          <div className="flex items-center gap-2">
            <CitationButton
              pageTitle="India GCC Registry — GCC Atlas"
              path="/registry"
            />
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-mono font-medium border-2 border-ink bg-surface hover:bg-paper text-ink rounded-full transition-colors duration-fast cursor-pointer focus-visible:outline-cobalt"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cobalt" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2-Column Balanced Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8 items-center">
          {/* Left Column: Plain headline & Computed claim explainer */}
          <div className="space-y-2.5">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight leading-tight">
              {totalCentresCount} GCCs in the Atlas, so far
            </h1>
            <p className="font-body text-base text-muted leading-relaxed">
              {totalCentresCount} centres with a public source. {tracedCinCount} have a CIN we could trace.
            </p>
          </div>

          {/* Right Column: Compact summary strip with three large numerals in display font */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-surface border-2 border-ink p-3 sm:p-4 rounded-xs shadow-xs">
            <div className="text-center p-2 border-r border-hairline-subtle">
              <div className="font-display font-bold text-3xl sm:text-4xl text-ink tabular-nums">
                {totalCitiesCount}
              </div>
              <div className="text-xs font-sans text-muted mt-1">
                Cities
              </div>
            </div>

            <div className="text-center p-2 border-r border-hairline-subtle">
              <div className="font-display font-bold text-3xl sm:text-4xl text-ink tabular-nums">
                {totalSectorsCount}
              </div>
              <div className="text-xs font-sans text-muted mt-1">
                Sectors
              </div>
            </div>

            <div className="text-center p-2">
              <div className="font-display font-bold text-3xl sm:text-4xl text-cobalt tabular-nums">
                {tracedPercentage}%
              </div>
              <div className="text-xs font-sans text-muted mt-1">
                Traced CIN
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Filters Section: One row of pill-style filters with custom popovers, search, toggle & removable chips */}
      <section
        aria-label="Filter Controls"
        ref={popoverRef}
        className="space-y-3 font-sans"
      >
        {/* Main Single Row Container */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search centres, parents, cities, functions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-10 border-2 border-ink bg-surface text-ink placeholder:text-muted text-xs font-sans rounded-full focus-visible:outline-cobalt"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills with Custom Popovers (NO native <select>) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. City Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover("city")}
                className={`h-10 px-3.5 rounded-full border-2 border-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedCity !== "all"
                    ? "bg-ink text-cream font-semibold shadow-xs"
                    : "bg-surface text-ink hover:bg-paper"
                }`}
                aria-expanded={openPopover === "city"}
              >
                <span>{selectedCity === "all" ? "City" : `City: ${selectedCity}`}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openPopover === "city" && (
                <div className="absolute top-12 left-0 z-30 min-w-[200px] max-h-60 overflow-y-auto bg-surface border-2 border-ink rounded-xs shadow-panel p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity("all");
                      closePopover();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                      selectedCity === "all" ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                    }`}
                  >
                    <span>All cities</span>
                    {selectedCity === "all" && <Check className="w-3.5 h-3.5 text-cobalt" />}
                  </button>
                  {allCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        closePopover();
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                        selectedCity === city ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <Check className="w-3.5 h-3.5 text-cobalt" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Sector Popover (Collapsed to 8 clean sectors) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover("sector")}
                className={`h-10 px-3.5 rounded-full border-2 border-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedSector !== "all"
                    ? "bg-ink text-cream font-semibold shadow-xs"
                    : "bg-surface text-ink hover:bg-paper"
                }`}
                aria-expanded={openPopover === "sector"}
              >
                <span>{selectedSector === "all" ? "Sector" : `Sector: ${selectedSector}`}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openPopover === "sector" && (
                <div className="absolute top-12 left-0 z-30 min-w-[240px] max-h-64 overflow-y-auto bg-surface border-2 border-ink rounded-xs shadow-panel p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSector("all");
                      closePopover();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                      selectedSector === "all" ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                    }`}
                  >
                    <span>All sectors</span>
                    {selectedSector === "all" && <Check className="w-3.5 h-3.5 text-cobalt" />}
                  </button>
                  {allSectors.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => {
                        setSelectedSector(sector);
                        closePopover();
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                        selectedSector === sector ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                      }`}
                    >
                      <span>{sector}</span>
                      {selectedSector === sector && <Check className="w-3.5 h-3.5 text-cobalt" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Parent HQ Country Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover("country")}
                className={`h-10 px-3.5 rounded-full border-2 border-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedCountry !== "all"
                    ? "bg-ink text-cream font-semibold shadow-xs"
                    : "bg-surface text-ink hover:bg-paper"
                }`}
                aria-expanded={openPopover === "country"}
              >
                <span>{selectedCountry === "all" ? "Parent HQ" : `HQ: ${selectedCountry}`}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openPopover === "country" && (
                <div className="absolute top-12 left-0 z-30 min-w-[200px] max-h-60 overflow-y-auto bg-surface border-2 border-ink rounded-xs shadow-panel p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountry("all");
                      closePopover();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                      selectedCountry === "all" ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                    }`}
                  >
                    <span>All HQ nations</span>
                    {selectedCountry === "all" && <Check className="w-3.5 h-3.5 text-cobalt" />}
                  </button>
                  {allCountries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country);
                        closePopover();
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                        selectedCountry === country ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                      }`}
                    >
                      <span>{country}</span>
                      {selectedCountry === country && <Check className="w-3.5 h-3.5 text-cobalt" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Headcount Band Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover("band")}
                className={`h-10 px-3.5 rounded-full border-2 border-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedBand !== "all"
                    ? "bg-ink text-cream font-semibold shadow-xs"
                    : "bg-surface text-ink hover:bg-paper"
                }`}
                aria-expanded={openPopover === "band"}
              >
                <span>{selectedBand === "all" ? "Size" : `Size: ${selectedBand}`}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openPopover === "band" && (
                <div className="absolute top-12 left-0 z-30 min-w-[180px] bg-surface border-2 border-ink rounded-xs shadow-panel p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBand("all");
                      closePopover();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                      selectedBand === "all" ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                    }`}
                  >
                    <span>All sizes</span>
                    {selectedBand === "all" && <Check className="w-3.5 h-3.5 text-cobalt" />}
                  </button>
                  {headcountBands.map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => {
                        setSelectedBand(band);
                        closePopover();
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono rounded-xs flex items-center justify-between transition-colors ${
                        selectedBand === band ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                      }`}
                    >
                      <span>{band}</span>
                      {selectedBand === band && <Check className="w-3.5 h-3.5 text-cobalt" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Status Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePopover("status")}
                className={`h-10 px-3.5 rounded-full border-2 border-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedStatus !== "all"
                    ? "bg-ink text-cream font-semibold shadow-xs"
                    : "bg-surface text-ink hover:bg-paper"
                }`}
                aria-expanded={openPopover === "status"}
              >
                <span>{selectedStatus === "all" ? "Status" : `Status: ${selectedStatus}`}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openPopover === "status" && (
                <div className="absolute top-12 left-0 z-30 min-w-[180px] bg-surface border-2 border-ink rounded-xs shadow-panel p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatus("all");
                      closePopover();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xs flex items-center justify-between transition-colors ${
                      selectedStatus === "all" ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                    }`}
                  >
                    <span>All statuses</span>
                    {selectedStatus === "all" && <Check className="w-3.5 h-3.5 text-cobalt" />}
                  </button>
                  {statuses.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(st);
                        closePopover();
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs capitalize rounded-xs flex items-center justify-between transition-colors ${
                        selectedStatus === st ? "bg-paper font-semibold text-ink" : "text-ink hover:bg-paper/60"
                      }`}
                    >
                      <span>{st}</span>
                      {selectedStatus === st && <Check className="w-3.5 h-3.5 text-cobalt" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Has Traced CIN Toggle (Replaces "Statutory CIN Only") */}
            <button
              type="button"
              onClick={() => setFilterHasTracedCin(!filterHasTracedCin)}
              className={`h-10 px-4 rounded-full border-2 border-ink text-xs font-medium transition-all duration-fast flex items-center gap-1.5 cursor-pointer ${
                filterHasTracedCin
                  ? "bg-ink text-cream font-semibold shadow-xs"
                  : "bg-surface text-ink hover:bg-paper"
              }`}
              aria-pressed={filterHasTracedCin}
            >
              <CheckCircle className={`w-3.5 h-3.5 ${filterHasTracedCin ? "text-mint" : "text-muted"}`} />
              <span>Has traced CIN</span>
            </button>
          </div>
        </div>

        {/* Active Removable Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-muted text-[11px] font-mono">
              Active filters ({filteredGccs.length} of {totalCentresCount}):
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-ink/40 bg-surface text-ink text-xs">
                <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-coral transition-colors"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCity !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-ink/40 bg-surface text-ink text-xs">
                <span>City: {selectedCity}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCity("all")}
                  className="hover:text-coral transition-colors"
                  aria-label="Remove city filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSector !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-ink/40 bg-surface text-ink text-xs">
                <span>Sector: {selectedSector}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSector("all")}
                  className="hover:text-coral transition-colors"
                  aria-label="Remove sector filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCountry !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-ink/40 bg-surface text-ink text-xs">
                <span>HQ: {selectedCountry}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCountry("all")}
                  className="hover:text-coral transition-colors"
                  aria-label="Remove country filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBand !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-ink/40 bg-surface text-ink text-xs font-mono">
                <span>Size: {selectedBand}</span>
                <button
                  type="button"
                  onClick={() => setSelectedBand("all")}
                  className="hover:text-coral transition-colors"
                  aria-label="Remove size filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-ink/40 bg-surface text-ink text-xs capitalize">
                <span>Status: {selectedStatus}</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus("all")}
                  className="hover:text-coral transition-colors"
                  aria-label="Remove status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterHasTracedCin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-ink/40 bg-surface text-ink text-xs">
                <span>Traced CIN only</span>
                <button
                  type="button"
                  onClick={() => setFilterHasTracedCin(false)}
                  className="hover:text-coral transition-colors"
                  aria-label="Remove traced CIN filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-cobalt hover:text-ink hover:underline decoration-1 underline-offset-2 ml-1"
            >
              Reset all
            </button>
          </div>
        )}
      </section>

      {/* 11. Table Section: Dense sortable table with sticky header, 16px arrows, full names wrapping, row click inline expansion */}
      <section aria-label="GCC Records" className="space-y-4">
        {/* Desktop & Tablet Table (Hidden on <768px via .registry-desktop-table) */}
        <div className="registry-desktop-table w-full overflow-hidden border-2 border-ink bg-surface shadow-xs rounded-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead className="sticky top-[66px] z-20 bg-surface shadow-xs">
                <tr className="border-b-2 border-ink bg-surface font-sans text-xs font-semibold text-muted whitespace-nowrap">
                  <th scope="col" className="w-8 py-3 px-3 text-center">
                    <span className="sr-only">Expand</span>
                  </th>

                  {/* Enterprise */}
                  <th
                    scope="col"
                    onClick={() => handleSort("name")}
                    className="py-3 px-3.5 font-semibold select-none cursor-pointer hover:text-ink hover:bg-paper/60 whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Enterprise</span>
                      <span className="flex-shrink-0">
                        {sortField === "name" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted opacity-30 hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Parent HQ */}
                  <th scope="col" className="py-3 px-3.5 font-semibold whitespace-nowrap">
                    Parent HQ
                  </th>

                  {/* Sector */}
                  <th
                    scope="col"
                    onClick={() => handleSort("sector")}
                    className="py-3 px-3.5 font-semibold select-none cursor-pointer hover:text-ink hover:bg-paper/60 whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Sector</span>
                      <span className="flex-shrink-0">
                        {sortField === "sector" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted opacity-30 hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Campus */}
                  <th scope="col" className="py-3 px-3.5 font-semibold whitespace-nowrap">
                    Campus
                  </th>

                  {/* Size (shortened from Headcount Band) */}
                  <th
                    scope="col"
                    onClick={() => handleSort("headcount_band")}
                    className="py-3 px-3.5 font-semibold select-none cursor-pointer hover:text-ink hover:bg-paper/60 whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Size</span>
                      <span className="flex-shrink-0">
                        {sortField === "headcount_band" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted opacity-30 hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Est. (shortened from Est. Year) */}
                  <th
                    scope="col"
                    onClick={() => handleSort("established_year")}
                    className="py-3 px-3.5 font-semibold select-none cursor-pointer hover:text-ink hover:bg-paper/60 whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Est.</span>
                      <span className="flex-shrink-0">
                        {sortField === "established_year" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted opacity-30 hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Status */}
                  <th
                    scope="col"
                    onClick={() => handleSort("status")}
                    className="py-3 px-3.5 font-semibold select-none cursor-pointer hover:text-ink hover:bg-paper/60 whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Status</span>
                      <span className="flex-shrink-0">
                        {sortField === "status" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-cobalt stroke-[2.25]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted opacity-30 hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Dossier (Open) */}
                  <th scope="col" className="py-3 px-3.5 text-right font-semibold whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-hairline">
                {filteredGccs.length > 0 ? (
                  filteredGccs.map((gcc, index) => {
                    const isExpanded = expandedRowIds.has(gcc.id);
                    const meta = gccMetadataMap.get(gcc.id);
                    const rowMarker = index + 1; // 6. Unique 1-indexed footnote marker per row

                    return (
                      <React.Fragment key={gcc.id}>
                        <tr
                          onClick={() => toggleRowExpansion(gcc.id)}
                          className={`transition-colors duration-fast cursor-pointer ${
                            isExpanded ? "bg-paper" : "hover:bg-paper/60"
                          }`}
                        >
                          {/* Row Expansion Chevron */}
                          <td className="w-8 py-3 px-2 text-center text-muted">
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? "Collapse dossier" : "Expand dossier"}
                              className="w-6 h-6 inline-flex items-center justify-center text-muted hover:text-ink focus-visible:outline-cobalt"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-cobalt" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Enterprise: Full names with wrapping not truncation */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-baseline gap-1">
                              <Link
                                href={`/gcc/${gcc.slug}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-display font-bold text-ink hover:text-cobalt hover:underline decoration-1 underline-offset-2 text-sm leading-snug break-words"
                              >
                                {gcc.name}
                              </Link>
                              {/* 6. Row footnote linked to its own source entry */}
                              {meta?.primarySource && (
                                <SourceFootnote
                                  source={meta.primarySource}
                                  marker={rowMarker}
                                  fieldLabel={`${gcc.name} Master Record`}
                                  showMarkerOnly={true}
                                />
                              )}
                            </div>
                            <div className="text-xs text-muted leading-tight mt-0.5 break-words">
                              {gcc.india_entity_name || "Statutory entity undisclosed"}
                            </div>
                            {/* 5. CIN Status Display: Never as plain fact if unverified */}
                            <div className="text-xs font-mono mt-0.5">
                              {gcc.cin ? (
                                gcc.cin_status === "verified" ? (
                                  <span className="text-muted">
                                    <span className="text-ink font-semibold">CIN:</span> {gcc.cin}
                                  </span>
                                ) : (
                                  <span className="text-muted italic">
                                    CIN not yet verified
                                  </span>
                                )
                              ) : (
                                <span className="text-muted italic">CIN not yet verified</span>
                              )}
                            </div>
                          </td>

                          {/* Parent HQ */}
                          <td className="py-3 px-3.5">
                            <div className="font-medium text-ink">{gcc.parent_name}</div>
                            <div className="text-[11px] text-muted">{gcc.parent_hq_country}</div>
                          </td>

                          {/* Sector: Top-level clean sector */}
                          <td className="py-3 px-3.5">
                            <div className="font-medium text-ink">
                              {getTopLevelSector(gcc.sector)}
                            </div>
                            <div className="text-[10px] text-muted truncate max-w-[140px]">
                              {gcc.sector}
                            </div>
                          </td>

                          {/* Campus: Small pills, max 3 then +N */}
                          <td className="py-3 px-3.5">
                            <div className="flex flex-wrap items-center gap-1">
                              {gcc.cities.slice(0, 3).map((city) => (
                                <span
                                  key={city}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full border border-ink/20 bg-paper/60 text-ink text-[11px] font-medium"
                                >
                                  {city}
                                </span>
                              ))}
                              {gcc.cities.length > 3 && (
                                <span
                                  title={gcc.cities.slice(3).join(", ")}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-ink/20 bg-paper/80 text-muted text-[11px] font-mono cursor-help"
                                >
                                  +{gcc.cities.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Size (Headcount): Sourced or "Not yet sourced" */}
                          <td className="py-3 px-3.5 tabular-nums">
                            {gcc.headcount_band && meta?.hasHeadcountSource ? (
                              <span className="font-mono font-semibold text-ink">
                                {gcc.headcount_band}
                              </span>
                            ) : (
                              <span className="text-muted font-sans italic text-xs">
                                Not yet sourced
                              </span>
                            )}
                          </td>

                          {/* Est. (Year): Sourced or "Not yet sourced" */}
                          <td className="py-3 px-3.5 tabular-nums">
                            {gcc.established_year && meta?.hasEstYearSource ? (
                              <span className="font-mono text-ink">
                                {gcc.established_year}
                              </span>
                            ) : (
                              <span className="text-muted font-sans italic text-xs">
                                Not yet sourced
                              </span>
                            )}
                          </td>

                          {/* 11. Unified Status Pill: Operating=mint, Expanding=marigold, Announced=cobalt outline */}
                          <td className="py-3 px-3.5">
                            {gcc.status && meta?.hasStatusSource ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  gcc.status === "operating"
                                    ? "border border-mint bg-mint/20 text-ink"
                                    : gcc.status === "expanding"
                                    ? "border border-marigold bg-marigold/20 text-ink"
                                    : "border border-cobalt bg-transparent text-cobalt"
                                }`}
                              >
                                {gcc.status}
                              </span>
                            ) : (
                              <span className="text-muted font-sans italic text-xs">
                                Not yet sourced
                              </span>
                            )}
                          </td>

                          {/* Dossier Action: Renamed "Examine" to "Open" */}
                          <td className="py-3 px-3.5 text-right">
                            <Link
                              href={`/gcc/${gcc.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-cobalt hover:text-ink hover:underline decoration-1 underline-offset-2"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>

                        {/* Inline Row Expansion on click */}
                        {isExpanded && (
                          <tr className="bg-paper/40 border-b-2 border-hairline">
                            <td colSpan={9} className="p-4 sm:p-6 border-l-4 border-cobalt space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline-subtle pb-3">
                                <div>
                                  <span className="text-xs font-sans text-muted font-medium block">
                                    Inline record audit • Citation [{rowMarker}]
                                  </span>
                                  <div className="font-display font-bold text-lg text-ink">
                                    {gcc.name} ({gcc.india_entity_name || "Statutory entity undisclosed"})
                                  </div>
                                </div>
                                <Link
                                  href={`/gcc/${gcc.slug}`}
                                  className="text-xs font-semibold text-cobalt hover:text-ink flex items-center gap-1.5"
                                >
                                  <span>Open complete dossier</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                <div className="space-y-1">
                                  <span className="text-muted block text-xs font-medium">Corporate identity (CIN)</span>
                                  <div className="font-mono">
                                    {gcc.cin ? (
                                      gcc.cin_status === "verified" ? (
                                        <span className="text-ink font-semibold">{gcc.cin} (Traced in RoC)</span>
                                      ) : (
                                        <span className="text-muted italic">CIN not yet verified</span>
                                      )
                                    ) : (
                                      <span className="text-muted italic">Pending public filing</span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-muted block text-xs font-medium">Functional mandate</span>
                                  <span className="text-ink font-medium">
                                    {gcc.functions.join(", ") || "Core Engineering"}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-muted block text-xs font-medium">Global parent enterprise</span>
                                  <span className="text-ink font-medium">
                                    {gcc.parent_name} ({gcc.parent_hq_country})
                                  </span>
                                </div>
                              </div>

                              {/* Attached Claims with Confidence Grades and Source Cards */}
                              {meta?.claims && meta.claims.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-hairline-subtle">
                                  <span className="text-xs font-sans font-semibold text-ink block">
                                    Attached claims and sources ({meta.claims.length})
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {meta.claims.map((claim) => {
                                      const src = sourcesMap.get(claim.source_id);
                                      return (
                                        <div
                                          key={claim.id}
                                          className="p-3 border-2 border-ink bg-surface rounded-xs flex items-start justify-between gap-3 shadow-xs"
                                        >
                                          <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted capitalize">
                                              {claim.field.replace(/_/g, " ")}
                                            </div>
                                            <div className="font-mono font-bold text-xs text-ink">
                                              {String(claim.value)} {claim.unit || ""}
                                            </div>
                                            {claim.note && (
                                              <div className="text-xs text-muted leading-tight">
                                                {claim.note}
                                              </div>
                                            )}
                                            {src && (
                                              <div className="text-[11px] text-muted pt-1">
                                                Source: <span className="text-ink font-medium">{src.publisher}</span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <ConfidenceStamp grade={claim.confidence} size="sm" />
                                            {src && (
                                              <a
                                                href={src.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 text-[11px] text-cobalt hover:underline"
                                              >
                                                <span>Source</span>
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 px-4 text-center text-muted font-body italic text-sm">
                      No capability centres match your active filter criteria. Sourced benchmarks pending.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 13. Mobile 360 Stacked Cards (Visible on <768px via .registry-mobile-cards) */}
        <div className="registry-mobile-cards space-y-3">
          {filteredGccs.length > 0 ? (
            filteredGccs.map((gcc, index) => {
              const isExpanded = expandedRowIds.has(gcc.id);
              const meta = gccMetadataMap.get(gcc.id);
              const rowMarker = index + 1;

              return (
                <div
                  key={gcc.id}
                  className="border-2 border-ink bg-surface rounded-xs p-4 space-y-3 shadow-xs"
                >
                  {/* Card Header: Enterprise Name + Open Link */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <Link
                          href={`/gcc/${gcc.slug}`}
                          className="font-display font-bold text-ink hover:text-cobalt text-base leading-snug"
                        >
                          {gcc.name}
                        </Link>
                        {meta?.primarySource && (
                          <SourceFootnote
                            source={meta.primarySource}
                            marker={rowMarker}
                            fieldLabel={`${gcc.name} Master Record`}
                            showMarkerOnly={true}
                          />
                        )}
                      </div>
                      <div className="text-xs text-muted">
                        {gcc.india_entity_name || "Statutory entity undisclosed"}
                      </div>
                    </div>

                    <Link
                      href={`/gcc/${gcc.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cobalt hover:underline shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Parent HQ & Sector */}
                  <div className="text-xs space-y-1 pt-1 border-t border-hairline-subtle">
                    <div className="flex items-center justify-between text-muted">
                      <span>Parent HQ</span>
                      <span className="text-ink font-medium">
                        {gcc.parent_name} ({gcc.parent_hq_country})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted">
                      <span>Sector</span>
                      <span className="text-ink font-medium">
                        {getTopLevelSector(gcc.sector)}
                      </span>
                    </div>
                  </div>

                  {/* Cities Pills (max 3 then +N) */}
                  <div className="pt-1">
                    <span className="text-[11px] text-muted block mb-1">Campus footprint</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {gcc.cities.slice(0, 3).map((city) => (
                        <span
                          key={city}
                          className="inline-flex items-center px-2 py-0.5 rounded-full border border-ink/20 bg-paper/60 text-ink text-[11px] font-medium"
                        >
                          {city}
                        </span>
                      ))}
                      {gcc.cities.length > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-ink/20 bg-paper/80 text-muted text-[11px] font-mono">
                          +{gcc.cities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Size, Est., Status Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-hairline-subtle text-xs">
                    <div>
                      <span className="text-[11px] text-muted block">Size</span>
                      {gcc.headcount_band && meta?.hasHeadcountSource ? (
                        <span className="font-mono font-semibold text-ink">
                          {gcc.headcount_band}
                        </span>
                      ) : (
                        <span className="text-muted italic text-[11px]">Not yet sourced</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] text-muted block">Est.</span>
                      {gcc.established_year && meta?.hasEstYearSource ? (
                        <span className="font-mono text-ink">
                          {gcc.established_year}
                        </span>
                      ) : (
                        <span className="text-muted italic text-[11px]">Not yet sourced</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] text-muted block">Status</span>
                      {gcc.status && meta?.hasStatusSource ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                            gcc.status === "operating"
                              ? "border border-mint bg-mint/20 text-ink"
                              : gcc.status === "expanding"
                              ? "border border-marigold bg-marigold/20 text-ink"
                              : "border border-cobalt bg-transparent text-cobalt"
                          }`}
                        >
                          {gcc.status}
                        </span>
                      ) : (
                        <span className="text-muted italic text-[11px]">Not yet sourced</span>
                      )}
                    </div>
                  </div>

                  {/* CIN Display (Plain fact never used for unverified) */}
                  <div className="text-xs font-mono pt-1 text-muted">
                    {gcc.cin ? (
                      gcc.cin_status === "verified" ? (
                        <span>
                          <span className="text-ink font-semibold">CIN:</span> {gcc.cin}
                        </span>
                      ) : (
                        <span className="italic">CIN not yet verified</span>
                      )
                    ) : (
                      <span className="italic">CIN not yet verified</span>
                    )}
                  </div>

                  {/* Expand / Collapse Details Button */}
                  <button
                    type="button"
                    onClick={() => toggleRowExpansion(gcc.id)}
                    className="w-full pt-2 border-t border-hairline-subtle text-xs text-cobalt flex items-center justify-center gap-1 font-medium hover:text-ink cursor-pointer"
                  >
                    <span>{isExpanded ? "Collapse inline audit" : "Inspect claims & sources"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Mobile Expanded Audit */}
                  {isExpanded && meta?.claims && (
                    <div className="pt-2 border-t border-hairline space-y-2">
                      <span className="text-xs font-sans font-semibold text-ink block">
                        Verified Claims ({meta.claims.length})
                      </span>
                      {meta.claims.map((claim) => {
                        const src = sourcesMap.get(claim.source_id);
                        return (
                          <div
                            key={claim.id}
                            className="p-2.5 border border-ink/30 bg-paper/50 rounded-xs text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="capitalize text-muted font-medium">
                                {claim.field.replace(/_/g, " ")}
                              </span>
                              <ConfidenceStamp grade={claim.confidence} size="sm" />
                            </div>
                            <div className="font-mono font-bold text-ink">
                              {String(claim.value)} {claim.unit || ""}
                            </div>
                            {src && (
                              <div className="text-[11px] text-muted pt-0.5">
                                Source: {src.publisher}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 text-center text-muted font-body italic text-sm border-2 border-ink bg-surface rounded-xs">
              No capability centres match your active filter criteria. Sourced benchmarks pending.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
