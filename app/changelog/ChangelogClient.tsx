"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  ArrowDownUp,
  Building2,
  CalendarDays,
  Clock3,
  FileSearch,
  FileText,
  Filter,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { EventRecord } from "../../lib/repo/eventsRepo";
import { CitationButton } from "../../components/CitationButton";

interface ChangelogClientProps {
  events: EventRecord[];
}

type EventFilter = EventRecord["type"] | "all";
type SortOrder = "newest" | "oldest";

const EVENT_TYPES: EventRecord["type"][] = [
  "new_gcc",
  "claim_change",
  "policy_change",
  "staleness_downgrade",
  "source_dead",
];

const TYPE_CONFIG: Record<
  EventRecord["type"],
  { label: string; icon: React.ElementType; tone: string }
> = {
  new_gcc: {
    label: "New GCC",
    icon: Building2,
    tone: "cobalt",
  },
  claim_change: {
    label: "Claim change",
    icon: Activity,
    tone: "mint",
  },
  policy_change: {
    label: "Policy gazette",
    icon: FileText,
    tone: "marigold",
  },
  staleness_downgrade: {
    label: "Freshness downgrade",
    icon: Clock3,
    tone: "coral",
  },
  source_dead: {
    label: "Source check",
    icon: ShieldAlert,
    tone: "coral",
  },
};

function isSeedRecord(event: EventRecord): boolean {
  return event.id.startsWith("evt-seed-");
}

function safeTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string): string {
  const time = safeTime(value);
  if (!time) return "Date unavailable";
  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(value: string): string {
  const time = safeTime(value);
  if (!time) return "Time unavailable";
  return new Date(time).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function ChangelogClient({ events }: ChangelogClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<EventFilter>("all");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    EVENT_TYPES.forEach((type) => { counts[type] = 0; });
    events.forEach((event) => { counts[event.type] = (counts[event.type] || 0) + 1; });
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...events]
      .filter((event) => selectedFilter === "all" || event.type === selectedFilter)
      .filter((event) => {
        if (!normalizedQuery) return true;
        return [
          event.entity,
          event.summary,
          event.id,
          TYPE_CONFIG[event.type]?.label || event.type,
        ].join(" ").toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => sortOrder === "newest"
        ? safeTime(b.created_at) - safeTime(a.created_at)
        : safeTime(a.created_at) - safeTime(b.created_at));
  }, [events, query, selectedFilter, sortOrder]);

  const activityWindow = useMemo(() => {
    const validTimes = events.map((event) => safeTime(event.created_at)).filter(Boolean);
    const latestTime = validTimes.length ? Math.max(...validTimes) : 0;
    const anchor = new Date(latestTime || Date.UTC(2026, 0, 1));
    anchor.setUTCHours(0, 0, 0, 0);

    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(anchor);
      day.setUTCDate(anchor.getUTCDate() - (13 - index));
      const start = day.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const count = events.filter((event) => {
        const time = safeTime(event.created_at);
        return time >= start && time < end;
      }).length;
      return {
        key: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          timeZone: "UTC",
        }),
        count,
      };
    });
  }, [events]);

  const typeDistribution = useMemo(() => {
    return EVENT_TYPES
      .map((type) => ({
        type,
        label: TYPE_CONFIG[type].label,
        count: eventCounts[type] || 0,
        tone: TYPE_CONFIG[type].tone,
      }))
      .sort((a, b) => b.count - a.count || EVENT_TYPES.indexOf(a.type) - EVENT_TYPES.indexOf(b.type));
  }, [eventCounts]);

  const maxActivity = Math.max(1, ...activityWindow.map((day) => day.count));
  const maxTypeCount = Math.max(1, ...typeDistribution.map((item) => item.count));
  const seedCount = events.filter(isSeedRecord).length;
  const newestEvent = [...events].sort((a, b) => safeTime(b.created_at) - safeTime(a.created_at))[0];
  const hasActiveFilters = selectedFilter !== "all" || query.trim().length > 0;

  const resetFilters = () => {
    setSelectedFilter("all");
    setQuery("");
    setSortOrder("newest");
    setExpandedEventId(null);
  };

  return (
    <div className="changelog-atlas">
      <header className="changelog-hero">
        <div className="changelog-hero-topline">
          <p className="changelog-kicker">ZERO DAY / EVENT REGISTER / AUDIT TRAIL</p>
          <div className="changelog-hero-actions">
            <CitationButton pageTitle="ZeroDay Event Changelog" path="/changelog" />
            <span className="changelog-record-count">
              <i aria-hidden="true" />
              {events.length} {events.length === 1 ? "record" : "records"} loaded
            </span>
          </div>
        </div>

        <div className="changelog-hero-grid">
          <div className="changelog-hero-copy">
            <h1>Every change leaves <span>a trace.</span></h1>
            <p>
              Inspect event records behind additions, claim edits, policy updates,
              freshness changes, and source checks. Filter the stream without losing
              the original record reference.
            </p>
            <div className="changelog-principles">
              <span><FileSearch size={14} aria-hidden="true" /> Traceable event references</span>
              <span><Filter size={14} aria-hidden="true" /> Filters update the same event stream</span>
            </div>
          </div>

          <aside className="changelog-hero-method" aria-label="Changelog record notes">
            <div className="changelog-method-top">
              <span>REGISTER NOTES</span>
              <span>EV / 01</span>
            </div>
            <div className="changelog-method-title">Record first.<br />Interpretation second.</div>
            <p>
              Event summaries show what the repository recorded. They do not independently
              establish the truth of a claim.
            </p>
            <div className="changelog-method-footer">
              <span>Newest available record</span>
              <strong>{newestEvent ? formatDate(newestEvent.created_at) : "No records yet"}</strong>
            </div>
          </aside>
        </div>
      </header>

      <section className="changelog-metric-grid" aria-label="Event register summary">
        <article className="changelog-metric changelog-metric--lead">
          <span>Event records</span>
          <strong>{events.length}</strong>
          <small>Records supplied by the current event repository</small>
          <b>01</b>
        </article>
        <article className="changelog-metric">
          <span>Event categories</span>
          <strong>{EVENT_TYPES.filter((type) => (eventCounts[type] || 0) > 0).length}</strong>
          <small>Categories represented in current records</small>
          <b>02</b>
        </article>
        <article className="changelog-metric">
          <span>Seed records</span>
          <strong>{seedCount}</strong>
          <small>Repository seed IDs identified and labelled</small>
          <b>03</b>
        </article>
        <article className="changelog-metric">
          <span>Visible results</span>
          <strong>{filteredEvents.length}</strong>
          <small>Responds to search and selected filters</small>
          <b>04</b>
        </article>
      </section>

      <section className="changelog-insights" aria-label="Event activity charts">
        <article className="changelog-panel changelog-activity-panel">
          <div className="changelog-panel-heading">
            <div>
              <p className="changelog-section-kicker">01 / ACTIVITY WINDOW</p>
              <h2>When records were created</h2>
              <p>Daily counts across the 14-day window ending on the latest listed record.</p>
            </div>
            <span className="changelog-figure-tag">FIG. 01</span>
          </div>

          <div className="changelog-activity-chart" role="img" aria-label="Daily event record counts for the 14-day period ending on the newest available record">
            <div className="changelog-chart-y-labels" aria-hidden="true">
              <span>{maxActivity}</span>
              <span>{Math.ceil(maxActivity / 2)}</span>
              <span>0</span>
            </div>
            <div className="changelog-activity-plot">
              <div className="changelog-chart-gridlines" aria-hidden="true"><i /><i /><i /></div>
              <div className="changelog-activity-bars">
                {activityWindow.map((day) => (
                  <div className="changelog-activity-day" key={day.key} title={day.label + ": " + day.count + " event " + (day.count === 1 ? "record" : "records")}>
                    <span className="changelog-activity-value">{day.count || ""}</span>
                    <i style={{ height: (day.count ? Math.max(8, (day.count / maxActivity) * 100) : 2) + "%" }} />
                    <small>{day.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="changelog-chart-foot">
            <span><i aria-hidden="true" /> Record creation date</span>
            <span>{activityWindow.reduce((sum, day) => sum + day.count, 0)} records in chart window</span>
          </div>
        </article>

        <article className="changelog-panel changelog-type-panel">
          <div className="changelog-panel-heading">
            <div>
              <p className="changelog-section-kicker">02 / EVENT COMPOSITION</p>
              <h2>What changed?</h2>
              <p>Select any event type to filter the register below.</p>
            </div>
            <span className="changelog-figure-tag">FIG. 02</span>
          </div>

          <div className="changelog-type-chart" role="group" aria-label="Filter event register by event type">
            {typeDistribution.map((item) => {
              const Icon = TYPE_CONFIG[item.type].icon;
              return (
                <button
                  type="button"
                  key={item.type}
                  className={"changelog-type-row" +
                    (selectedFilter === item.type ? " is-selected" : "")}
                  aria-pressed={selectedFilter === item.type}
                  onClick={() => setSelectedFilter((current) => current === item.type ? "all" : item.type)}
                >
                  <span className={"changelog-type-icon changelog-tone-" + item.tone}>
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  <span className="changelog-type-copy">
                    <strong>{item.label}</strong>
                    <i aria-hidden="true"><b style={{ width: (item.count / maxTypeCount) * 100 + "%" }} /></i>
                  </span>
                  <span className="changelog-type-count">{item.count}</span>
                </button>
              );
            })}
          </div>
          <div className="changelog-chart-foot">
            <span>Counts reflect current records</span>
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              disabled={selectedFilter === "all"}
            >
              Clear type filter <X size={12} aria-hidden="true" />
            </button>
          </div>
        </article>
      </section>

      {seedCount > 0 && (
        <aside className="changelog-seed-note" aria-label="Seed record notice">
          <div><FileText size={16} aria-hidden="true" /></div>
          <p>
            <strong>{seedCount} repository seed {seedCount === 1 ? "record is" : "records are"} included.</strong>
            {" "}Seed IDs are labelled in the timeline. Their timestamps can be generated at runtime
            and should not be interpreted as independently verified event occurrence dates.
          </p>
        </aside>
      )}

      <section className="changelog-register" aria-labelledby="changelog-register-title">
        <div className="changelog-register-heading">
          <div>
            <p className="changelog-section-kicker">03 / CHRONOLOGICAL REGISTER</p>
            <h2 id="changelog-register-title">Browse the event trail</h2>
            <p>Search entities, summaries, categories, or exact record IDs.</p>
          </div>
          <div className="changelog-register-total">
            <strong>{filteredEvents.length}</strong>
            <span>of {events.length} records</span>
          </div>
        </div>

        <div className="changelog-filter-panel">
          <label className="changelog-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search entity, summary or event ID"
              aria-label="Search event records"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </label>

          <div className="changelog-filter-actions">
            <label className="changelog-sort-select">
              <ArrowDownUp size={14} aria-hidden="true" />
              <span>Order</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
            <span className="changelog-active-filter">
              <Filter size={13} aria-hidden="true" />
              {selectedFilter === "all" ? "All categories" : TYPE_CONFIG[selectedFilter].label}
            </span>
            {hasActiveFilters && (
              <button type="button" className="changelog-reset" onClick={resetFilters}>
                <RotateCcw size={13} aria-hidden="true" /> Reset
              </button>
            )}
          </div>

          <div className="changelog-category-tabs" role="group" aria-label="Filter by event category">
            <button
              type="button"
              className={"changelog-category-tab" + (selectedFilter === "all" ? " is-active" : "")}
              onClick={() => setSelectedFilter("all")}
              aria-pressed={selectedFilter === "all"}
            >
              <span>All events</span><b>{events.length}</b>
            </button>
            {EVENT_TYPES.map((type) => {
              const config = TYPE_CONFIG[type];
              return (
                <button
                  type="button"
                  key={type}
                  className={"changelog-category-tab" + (selectedFilter === type ? " is-active" : "")}
                  onClick={() => setSelectedFilter(type)}
                  aria-pressed={selectedFilter === type}
                >
                  <span>{config.label}</span><b>{eventCounts[type] || 0}</b>
                </button>
              );
            })}
          </div>
        </div>

        <div className="changelog-timeline">
          {filteredEvents.map((event, index) => {
            const config = TYPE_CONFIG[event.type];
            const Icon = config?.icon || Activity;
            const expanded = expandedEventId === event.id;
            const seed = isSeedRecord(event);
            return (
              <article
                key={event.id}
                className={"changelog-event-card" + (expanded ? " is-expanded" : "")}
                style={{ animationDelay: Math.min(index, 8) * 35 + "ms" }}
              >
                <div className="changelog-event-rail" aria-hidden="true">
                  <span className={"changelog-event-node changelog-tone-" + (config?.tone || "cobalt")}>
                    <Icon size={13} />
                  </span>
                  {index !== filteredEvents.length - 1 && <i />}
                </div>

                <div className="changelog-event-body">
                  <div className="changelog-event-meta">
                    <span className={"changelog-event-type changelog-tone-" + (config?.tone || "cobalt")}>
                      {config?.label || event.type}
                    </span>
                    {seed && <span className="changelog-seed-badge">Seed record</span>}
                    <span className="changelog-event-date">
                      <CalendarDays size={12} aria-hidden="true" />
                      {formatDate(event.created_at)}
                      <span aria-hidden="true">·</span>
                      {formatTime(event.created_at)}
                    </span>
                  </div>

                  <h3>{event.entity}</h3>
                  <p className="changelog-event-summary">{event.summary}</p>

                  <div className="changelog-event-footer">
                    <span className="changelog-event-id">REF / {event.id}</span>
                    <button
                      type="button"
                      onClick={() => setExpandedEventId((current) => current === event.id ? null : event.id)}
                      aria-expanded={expanded}
                    >
                      {expanded ? "Hide record details" : "Record details"}
                      {expanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="changelog-event-detail">
                      <div>
                        <span>Exact record ID</span>
                        <strong>{event.id}</strong>
                      </div>
                      <div>
                        <span>Stored timestamp (UTC)</span>
                        <strong>{safeTime(event.created_at) ? new Date(safeTime(event.created_at)).toISOString() : "Invalid timestamp"}</strong>
                      </div>
                      <div>
                        <span>Record category</span>
                        <strong>{config?.label || event.type}</strong>
                      </div>
                      <p>
                        This record contains the entity name, summary, category, and creation timestamp supplied by the event repository.
                        No separate source URL is attached to this event record.
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="changelog-empty-state">
              <span><Search size={19} aria-hidden="true" /></span>
              <h3>No event records match.</h3>
              <p>Try another term or clear the selected category.</p>
              <button type="button" onClick={resetFilters}>Clear filters <X size={13} aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </section>

      <footer className="changelog-integrity-footer">
        <span><ShieldAlert size={17} aria-hidden="true" /></span>
        <div>
          <strong>An event record is not a source document.</strong>
          <p>
            The changelog reflects entries supplied by the current repository. Verify the underlying
            source before treating a summary as confirmed evidence. Seed records are marked explicitly.
          </p>
        </div>
        <small>ZD / EVENT REGISTER</small>
      </footer>
    </div>
  );
}
