"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number | null | undefined;
  align?: "left" | "center" | "right";
  className?: string;
  isKeyFigure?: boolean; // Mobile stacked view highlights this first
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  expandedRowRender?: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  caption?: string;
  className?: string;
  initialSortKey?: string;
  initialSortDirection?: "asc" | "desc";
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  expandedRowRender,
  emptyState,
  caption,
  className = "",
  initialSortKey,
  initialSortDirection = "asc",
}: DataTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialSortDirection);

  const toggleRow = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    if (sortKey === column.key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column.key);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return data;

    return [...data].sort((a, b) => {
      const valA = col.sortValue!(a);
      const valB = col.sortValue!(b);
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const cmp = valA < valB ? -1 : 1;
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDirection, columns]);

  return (
    <div className={`w-full overflow-hidden border border-hairline bg-surface ${className}`}>
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-16 z-20 bg-surface shadow-xs">
            <tr className="border-b-2 border-ink bg-surface font-sans text-xs font-semibold text-muted whitespace-nowrap">
              {expandedRowRender && (
                <th scope="col" className="w-8 py-3 px-3 text-center">
                  <span className="sr-only">Expand</span>
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => handleSort(col)}
                    className={`py-3 px-3.5 font-semibold select-none whitespace-nowrap ${alignClass} ${
                      col.sortable ? "cursor-pointer hover:text-ink hover:bg-paper/60" : ""
                    } ${col.className || ""}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "right" ? "justify-end" : ""
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="flex-shrink-0">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-4 h-4 text-cobalt stroke-[2.25]" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-cobalt stroke-[2.25]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-4 h-4 text-muted opacity-30 hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => {
                const rowKey = keyExtractor(item);
                const isExpanded = expandedKeys.has(rowKey);

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      onClick={expandedRowRender ? () => toggleRow(rowKey) : undefined}
                      className={`transition-colors duration-fast ${
                        expandedRowRender ? "cursor-pointer hover:bg-paper/70" : "hover:bg-paper/40"
                      } ${isExpanded ? "bg-paper/80" : ""}`}
                    >
                      {expandedRowRender && (
                        <td className="w-8 py-3 px-2 text-center text-muted">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Collapse row details" : "Expand row details"}
                            className="w-6 h-6 inline-flex items-center justify-center text-muted hover:text-ink focus-visible:outline-cobalt"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-cobalt" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}
                      {columns.map((col) => {
                        const alignClass =
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left";
                        return (
                          <td
                            key={col.key}
                            className={`py-3 px-3.5 text-ink tabular-nums ${alignClass} ${
                              col.className || ""
                            }`}
                          >
                            {col.render(item, index)}
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && expandedRowRender && (
                      <tr className="bg-paper/40 border-b border-hairline">
                        <td
                          colSpan={columns.length + 1}
                          className="p-4 border-l-2 border-cobalt"
                        >
                          {expandedRowRender(item)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (Boolean(expandedRowRender) ? 1 : 0)}
                  className="py-12 px-4 text-center text-muted font-body italic text-sm"
                >
                  {emptyState || "No records in current view. Sourced benchmarks pending."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Rows (<768px): Key Figure Prominent */}
      <div className="block md:hidden divide-y divide-hairline">
        {sortedData.length > 0 ? (
          sortedData.map((item, index) => {
            const rowKey = keyExtractor(item);
            const isExpanded = expandedKeys.has(rowKey);
            const keyFigCol = columns.find((c) => c.isKeyFigure) || columns[0];
            const otherCols = columns.filter((c) => c.key !== keyFigCol.key);

            return (
              <div key={rowKey} className="p-4 space-y-3 bg-surface">
                {/* Mobile Header: Key figure first */}
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={expandedRowRender ? () => toggleRow(rowKey) : undefined}
                >
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                      {keyFigCol.header}
                    </span>
                    <div className="text-sm font-bold text-ink">
                      {keyFigCol.render(item, index)}
                    </div>
                  </div>

                  {expandedRowRender && (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label="Toggle details"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-end text-muted hover:text-ink"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-cobalt" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Mobile Meta Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-hairline-subtle text-xs">
                  {otherCols.slice(0, 4).map((col) => (
                    <div key={col.key} className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-muted block">
                        {col.header}
                      </span>
                      <div className="text-ink text-xs tabular-nums">
                        {col.render(item, index)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Expanded Details */}
                {isExpanded && expandedRowRender && (
                  <div className="pt-3 border-t border-hairline bg-paper/50 -mx-4 -mb-4 p-4">
                    {expandedRowRender(item)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 px-4 text-center text-muted font-serif italic text-sm">
            {emptyState || "No records found."}
          </div>
        )}
      </div>
    </div>
  );
}
