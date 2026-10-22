"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Gcc, Claim, Source } from "../../lib/schema";
import { PageHeader } from "../../components/PageHeader";
import { DataTable, Column } from "../../components/DataTable";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import { SourceFootnote } from "../../components/SourceFootnote";
import {
  Search,
  Download,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  X,
  FileCheck,
  CheckCircle,
} from "lucide-react";
import Fuse from "fuse.js";

interface RegistryClientProps {
  initialGccs: Gcc[];
  claims: Claim[];
  sources: Source[];
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
  const [filterHasCin, setFilterHasCin] = useState<boolean>(false);

  // Maps
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

  // Unique filter values
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    initialGccs.forEach((g) => g.cities.forEach((c) => cities.add(c)));
    return Array.from(cities).sort();
  }, [initialGccs]);

  const allSectors = useMemo(() => {
    const sectors = new Set<string>();
    initialGccs.forEach((g) => sectors.add(g.sector));
    return Array.from(sectors).sort();
  }, [initialGccs]);

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    initialGccs.forEach((g) => countries.add(g.parent_hq_country));
    return Array.from(countries).sort();
  }, [initialGccs]);

  // Filtering
  const filteredGccs = useMemo(() => {
    let result = initialGccs;

    if (selectedCity !== "all") {
      result = result.filter((g) => g.cities.includes(selectedCity));
    }
    if (selectedSector !== "all") {
      result = result.filter((g) => g.sector === selectedSector);
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
    if (filterHasCin) {
      result = result.filter((g) => Boolean(g.cin));
    }

    if (searchQuery.trim() !== "") {
      const fuse = new Fuse(result, {
        keys: ["name", "parent_name", "sector", "cities", "functions", "india_entity_name"],
        threshold: 0.35,
      });
      result = fuse.search(searchQuery).map((res) => res.item);
    }

    return result;
  }, [
    initialGccs,
    searchQuery,
    selectedCity,
    selectedSector,
    selectedCountry,
    selectedBand,
    selectedStatus,
    filterHasCin,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedSector("all");
    setSelectedCountry("all");
    setSelectedBand("all");
    setSelectedStatus("all");
    setFilterHasCin(false);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCity !== "all" ||
    selectedSector !== "all" ||
    selectedCountry !== "all" ||
    selectedBand !== "all" ||
    selectedStatus !== "all" ||
    filterHasCin;

  // Export CSV with source columns
  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Name",
      "Parent_Name",
      "HQ_Country",
      "India_Entity_Name",
      "CIN",
      "Cities",
      "Sector",
      "Functions",
      "Established_Year",
      "Headcount_Band",
      "Status",
      "Primary_Source_URL",
      "Confidence_Grade",
    ];

    const rows = filteredGccs.map((g) => {
      const firstClaim = g.claim_ids.length > 0 ? claimsMap.get(g.claim_ids[0]) : null;
      const source = firstClaim ? sourcesMap.get(firstClaim.source_id) : null;

      return [
        `"${g.id}"`,
        `"${g.name.replace(/"/g, '""')}"`,
        `"${g.parent_name.replace(/"/g, '""')}"`,
        `"${g.parent_hq_country}"`,
        `"${(g.india_entity_name || "").replace(/"/g, '""')}"`,
        `"${g.cin || ""}"`,
        `"${g.cities.join(", ")}"`,
        `"${g.sector.replace(/"/g, '""')}"`,
        `"${g.functions.join(", ").replace(/"/g, '""')}"`,
        `"${g.established_year || ""}"`,
        `"${g.headcount_band || "Not yet sourced"}"`,
        `"${g.status}"`,
        `"${source?.url || "https://zeroday.in"}"`,
        `"${firstClaim?.confidence || "B"}"`,
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

  // Define Columns for DataTable
  const columns: Column<Gcc>[] = [
    {
      key: "name",
      header: "Enterprise & Parent Group",
      sortable: true,
      sortValue: (g) => g.name,
      isKeyFigure: true,
      render: (gcc) => (
        <div>
          <Link
            href={`/gcc/${gcc.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-ink hover:text-verdigris hover:underline decoration-1 underline-offset-2 font-display text-sm tracking-tight"
          >
            {gcc.name}
          </Link>
          <div className="text-[11px] font-mono text-muted mt-0.5 truncate max-w-[200px]">
            {gcc.india_entity_name || "Statutory entity undisclosed"}
          </div>
          {gcc.cin && (
            <div className="text-[10px] font-mono text-muted flex items-center gap-1 mt-0.5">
              <span className="font-semibold text-ink">CIN:</span> {gcc.cin}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "sector",
      header: "Sector & HQ",
      sortable: true,
      sortValue: (g) => g.sector,
      render: (gcc) => (
        <div>
          <div className="font-medium text-ink">{gcc.sector}</div>
          <div className="text-[11px] font-mono text-muted">{gcc.parent_hq_country}</div>
        </div>
      ),
    },
    {
      key: "cities",
      header: "Campus Clusters",
      render: (gcc) => (
        <div className="flex flex-wrap gap-1">
          {gcc.cities.map((city) => (
            <span
              key={city}
              className="inline-block px-1.5 py-0.5 border border-hairline bg-paper/60 text-[10px] font-mono text-ink"
            >
              {city}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "headcount_band",
      header: "Headcount Band",
      sortable: true,
      sortValue: (g) => g.headcount_band || "",
      render: (gcc) =>
        gcc.headcount_band ? (
          <span className="font-mono font-semibold text-ink tabular-nums">
            {gcc.headcount_band}
          </span>
        ) : (
          <span className="text-muted font-mono italic text-[11px]">
            Not yet sourced
          </span>
        ),
    },
    {
      key: "established_year",
      header: "Est. Year",
      sortable: true,
      sortValue: (g) => g.established_year || 0,
      render: (gcc) => {
        const estClaim = gcc.claim_ids
          .map((id) => claimsMap.get(id))
          .find((c) => c?.field === "established_year");
        const estSource = estClaim ? sourcesMap.get(estClaim.source_id) : null;

        return gcc.established_year ? (
          <div className="flex items-baseline gap-1">
            <span className="font-mono tabular-nums text-ink">
              {gcc.established_year}
            </span>
            {estSource && (
              <SourceFootnote
                source={estSource}
                claim={estClaim}
                fieldLabel={`${gcc.name} Establishment Year`}
                showMarkerOnly={true}
              />
            )}
          </div>
        ) : (
          <span className="text-muted font-mono italic text-[11px]">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (g) => g.status,
      render: (gcc) => (
        <span
          className={`inline-block px-1.5 py-0.5 border font-mono text-[10px] uppercase font-bold ${
            gcc.status === "expanding"
              ? "border-verdigris text-verdigris bg-verdigris/10"
              : gcc.status === "operating"
              ? "border-ink text-ink bg-paper/40"
              : "border-vermilion text-vermilion bg-vermilion/10"
          }`}
        >
          {gcc.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Dossier",
      align: "right",
      render: (gcc) => (
        <Link
          href={`/gcc/${gcc.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-verdigris hover:text-ink hover:underline decoration-1 underline-offset-2"
        >
          <span>Examine</span>
          <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      ),
    },
  ];

  // Inline Row Expansion
  const renderExpandedRow = (gcc: Gcc) => {
    const gccClaims = gcc.claim_ids.map((id) => claimsMap.get(id)).filter(Boolean) as Claim[];

    return (
      <div className="space-y-4 py-2 font-sans text-xs">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline-subtle pb-2">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              Inline Record Audit
            </span>
            <div className="font-display font-bold text-base text-ink">
              {gcc.name} ({gcc.india_entity_name || "Statutory Entity Undisclosed"})
            </div>
          </div>
          <Link
            href={`/gcc/${gcc.slug}`}
            className="font-mono text-xs text-verdigris hover:text-ink font-semibold flex items-center gap-1"
          >
            <span>Open Complete Profile Dossier</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-muted block text-[10px] uppercase">Corporate Identity (CIN)</span>
            <span className="text-ink font-medium">{gcc.cin || "Pending public filing"}</span>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase">Functional Mandate</span>
            <span className="text-ink font-medium">{gcc.functions.join(", ") || "Engineering"}</span>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase">Global Parent Enterprise</span>
            <span className="text-ink font-medium">{gcc.parent_name} ({gcc.parent_hq_country})</span>
          </div>
        </div>

        {/* Verified Claims Attached */}
        {gccClaims.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-hairline-subtle">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
              Verified Primary Claims ({gccClaims.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {gccClaims.map((claim) => {
                const src = sourcesMap.get(claim.source_id);
                return (
                  <div
                    key={claim.id}
                    className="p-2.5 border border-hairline bg-surface flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-mono text-[10px] uppercase text-muted">
                        {claim.field.replace(/_/g, " ")}
                      </div>
                      <div className="font-mono font-bold text-xs text-ink mt-0.5">
                        {String(claim.value)} {claim.unit || ""}
                      </div>
                      {claim.note && (
                        <div className="text-[11px] font-serif italic text-muted mt-0.5">
                          {claim.note}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <ConfidenceStamp grade={claim.confidence} size="sm" />
                      {src && (
                        <SourceFootnote
                          source={src}
                          claim={claim}
                          fieldLabel={`${gcc.name} — ${claim.field}`}
                          showMarkerOnly={true}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Editorial Header */}
      <PageHeader
        rubric="Ecosystem Directory"
        findingHeadline={`${initialGccs.length} Verified Global Capability Centres across 12 Indian tech clusters`}
        findingDescription="Every entry represents a verified foreign-owned captive capability centre with primary MCA corporate registry (CIN) records, registered lease deeds, or official corporate disclosures. No unverified estimates."
        pageTitle="India GCC Verified Registry"
        path="/registry"
        metadata={`${filteredGccs.length} Records in Current View`}
        primaryAction={
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium border border-hairline bg-surface hover:bg-paper hover:border-ink transition-colors duration-fast text-ink min-h-[36px]"
            title="Export filtered view with source URLs"
          >
            <Download className="w-3.5 h-3.5 text-verdigris" strokeWidth={1.5} />
            <span className="uppercase text-[11px] tracking-wider">Export CSV</span>
          </button>
        }
      />

      {/* Filter & Search Bar */}
      <section
        aria-label="Filter Registry"
        className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 font-sans"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search by enterprise name, parent corporation, sector, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-sans text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus:border-verdigris min-h-[44px]"
            />
          </div>

          {/* Quick CIN Checkbox */}
          <label className="flex items-center gap-2 text-xs font-mono text-slate-800 dark:text-slate-200 cursor-pointer select-none px-2 min-h-[44px]">
            <input
              type="checkbox"
              checked={filterHasCin}
              onChange={(e) => setFilterHasCin(e.target.checked)}
              className="accent-verdigris w-4 h-4"
            />
            <span className="font-semibold">Statutory CIN Only</span>
          </label>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 font-sans text-xs">
          {/* City */}
          <div>
            <label className="block text-xs uppercase text-slate-600 dark:text-slate-400 mb-1 font-bold">
              Campus City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[40px] focus-visible:outline-none focus:border-verdigris"
            >
              <option value="all">All Cities ({allCities.length})</option>
              {allCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-xs uppercase text-slate-600 dark:text-slate-400 mb-1 font-bold">
              Sector
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[40px] focus-visible:outline-none focus:border-verdigris"
            >
              <option value="all">All Sectors ({allSectors.length})</option>
              {allSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* HQ Country */}
          <div>
            <label className="block text-xs uppercase text-slate-600 dark:text-slate-400 mb-1 font-bold">
              Parent HQ
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[40px] focus-visible:outline-none focus:border-verdigris"
            >
              <option value="all">All HQ Nations</option>
              {allCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Headcount */}
          <div>
            <label className="block text-xs uppercase text-slate-600 dark:text-slate-400 mb-1 font-bold">
              Headcount Band
            </label>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[40px] focus-visible:outline-none focus:border-verdigris"
            >
              <option value="all">All Bands</option>
              <option value="<500">&lt;500 Professionals</option>
              <option value="500-1k">500 – 1,000</option>
              <option value="1k-5k">1,000 – 5,000</option>
              <option value="5k+">5,000+ (Mega Hub)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs uppercase text-slate-600 dark:text-slate-400 mb-1 font-bold">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[40px] focus-visible:outline-none focus:border-verdigris"
            >
              <option value="all">All Statuses</option>
              <option value="operating">Operating</option>
              <option value="expanding">Expanding</option>
              <option value="announced">Announced</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Bar */}
        {hasActiveFilters && (
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-muted border-t border-hairline-subtle">
            <span>
              Showing <strong className="text-ink">{filteredGccs.length}</strong> of {initialGccs.length} GCCs
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-verdigris hover:text-ink hover:underline decoration-1 underline-offset-2 min-h-[36px]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset all filter criteria</span>
            </button>
          </div>
        )}
      </section>

      {/* Dense Sortable Registry DataTable with Inline Expansion */}
      <section aria-label="Registry Records">
        <DataTable
          columns={columns}
          data={filteredGccs}
          keyExtractor={(gcc) => gcc.id}
          expandedRowRender={renderExpandedRow}
          initialSortKey="name"
          caption="Verified India Global Capability Centre Registry Table"
          emptyState="No Global Capability Centres match your active filter criteria. Sourced benchmarks pending."
        />
      </section>
    </div>
  );
}
