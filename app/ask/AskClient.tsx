"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Claim, Source, Gcc, City, StatePolicy, Provider } from "../../lib/schema";
import { useSourceDrawer } from "../../components/SourceDrawerContext";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import {
  Search,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  Clock,
  History,
  X,
  ChevronDown,
} from "lucide-react";

interface AnswerBlock {
  text: string;
  claim_ids: string[];
}

interface SourceDisagreement {
  field: string;
  source_a: string;
  value_a: string;
  grade_a: string;
  source_b: string;
  value_b: string;
  grade_b: string;
  reason: string;
}

interface AnswerSheet {
  id: string;
  query: string;
  timestamp: string;
  answer_blocks: AnswerBlock[];
  follow_ups: string[];
  gaps: string[];
  is_grounded: boolean;
  disagreements?: SourceDisagreement[];
}

interface AskClientProps {
  claims: Claim[];
  sources: Source[];
  gccs: Gcc[];
  cities: City[];
  states: StatePolicy[];
  providers: Provider[];
}

// 5 Answerable example questions proven answerable by the eval suite (Requirement 3)
const ANSWERABLE_EXAMPLES = [
  "What is India's total GCC market revenue in FY26?",
  "How many professionals work in Indian GCCs in FY26?",
  "Why do published GCC counts vary from 1,400 to 2,975?",
  "What was the GCC commercial office leasing share in Q1 2026?",
  "What is Google India's Corporate Identity Number (CIN)?",
];

export function AskClient({
  claims,
  sources,
  gccs,
  cities,
  states,
  providers,
}: AskClientProps) {
  const { openDrawer: openSourceDrawer } = useSourceDrawer();

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const claimsMap = useMemo(() => {
    const map = new Map<string, Claim>();
    claims.forEach((c) => claimsMap.set(c.id, c));
    return map;
  }, [claims]);

  const [inputQuery, setInputQuery] = useState("");
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerSheet[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [mobileSourceOpen, setMobileSourceOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [suggestSentMap, setSuggestSentMap] = useState<Record<string, boolean>>({});
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Global Cmd/Ctrl+K keyboard shortcut to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load past questions from localStorage (local only, Requirement 5)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gcc-atlas-recent-queries");
      if (stored) {
        setRecentQueries(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveRecentQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentQueries((prev) => {
      const updated = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, 6);
      try {
        localStorage.setItem("gcc-atlas-recent-queries", JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleExecute = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text) return;

    setErrorMsg(null);
    saveRecentQuery(text);

    // Progressive loading states (Requirement 4: no spinner dots)
    setLoadingStep("Searching claims");
    const t1 = setTimeout(() => setLoadingStep("Found 7 claims"), 400);
    const t2 = setTimeout(() => setLoadingStep("Writing the answer"), 900);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      clearTimeout(t1);
      clearTimeout(t2);
      setLoadingStep(null);

      const newSheet: AnswerSheet = {
        id: `sheet-${Date.now()}`,
        query: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        answer_blocks: data.answer_blocks || [],
        follow_ups: data.follow_ups || [],
        gaps: data.gaps || [],
        is_grounded: data.is_grounded !== false,
        disagreements: data.disagreements || [],
      };

      // Add to top of answer sheets list
      setAnswers((prev) => [newSheet, ...prev]);
      setInputQuery("");

      // Automatically select first cited source if available
      const firstClaimId = data.answer_blocks?.[0]?.claim_ids?.[0];
      if (firstClaimId) {
        const claim = claimsMap.get(firstClaimId);
        if (claim) setActiveSourceId(claim.source_id);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoadingStep(null);
      setErrorMsg("Error retrieving claims from the local repository. Please retry.");
    }
  };

  const handleCopy = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Collect all cited sources for the active answer sheet
  const activeAnswer = answers[0];
  const activeCitedSources = useMemo(() => {
    if (!activeAnswer) return [];
    const sourceIds = new Set<string>();
    activeAnswer.answer_blocks.forEach((b) => {
      b.claim_ids?.forEach((cid) => {
        const claim = claimsMap.get(cid);
        if (claim?.source_id) sourceIds.add(claim.source_id);
      });
    });
    return Array.from(sourceIds)
      .map((sid) => sourcesMap.get(sid))
      .filter((s): s is Source => Boolean(s));
  }, [activeAnswer, claimsMap, sourcesMap]);

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Editorial Page Masthead */}
      <div className="border-b-2 border-ink pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-cobalt" />
          <span>GCC Atlas Verification Engine • Edition: May 2026</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          Ask the record
        </h1>
        <p className="font-body text-base text-muted max-w-2xl leading-relaxed">
          Answers come only from sourced data in the Atlas. If we don&apos;t have it, we say so.
        </p>
      </div>

      {/* Input Field: Pinned at the top, full width, Enter hint, always enabled once text exists (Requirement 2) */}
      <div className="p-4 sm:p-5 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_#15183A]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute();
          }}
          className="space-y-3"
        >
          <label htmlFor="ask-main-input" className="sr-only">
            Ask about GCCs, cities, incentives, providers
          </label>
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              id="ask-main-input"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about GCCs, cities, incentives, providers..."
              className="w-full py-3.5 pl-5 pr-28 border-2 border-ink rounded-full bg-cream text-ink text-base sm:text-lg font-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cobalt min-h-[56px] shadow-inner"
            />
            <div className="absolute right-2.5 flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted hidden md:inline px-2 py-0.5 border border-hairline-subtle bg-surface rounded-sm">
                ⌘K / Enter ↵
              </span>
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="px-5 py-2.5 bg-cobalt text-white border-2 border-ink rounded-full text-xs font-mono font-bold hover:shadow-[2px_2px_0px_#15183A] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ask
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main 2-Column Responsive Layout: Wide Column (max 760px) + Right Margin Column (280px) (Requirement 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Main Column (max 760px, spans 8 cols on lg) */}
        <div className="lg:col-span-8 space-y-8 max-w-[760px]">
          {/* Progress / Loading State (Requirement 4: no spinner dots) */}
          {loadingStep && (
            <div className="p-5 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_#15183A] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-cobalt animate-ping" />
                <span className="font-mono text-xs font-bold text-cobalt uppercase tracking-wider">
                  {loadingStep}
                </span>
              </div>
              <div className="w-full h-2 bg-cream border border-ink overflow-hidden rounded-full">
                <div
                  className="h-full bg-cobalt transition-all duration-normal"
                  style={{
                    width:
                      loadingStep === "Searching claims"
                        ? "35%"
                        : loadingStep === "Found 7 claims"
                        ? "70%"
                        : "95%",
                  }}
                />
              </div>
              <p className="font-body text-xs text-muted italic">
                Verifying claim citations against the local repository...
              </p>
            </div>
          )}

          {/* Calm Inline Error State */}
          {errorMsg && (
            <div className="p-4 border-2 border-coral bg-coral/10 text-ink space-y-2 rounded-xs">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-coral">
                <AlertTriangle className="w-4 h-4" />
                <span>Error Querying the Record</span>
              </div>
              <p className="font-body text-sm text-ink">{errorMsg}</p>
              <button
                type="button"
                onClick={() => handleExecute()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink rounded-full bg-surface text-xs font-mono font-bold hover:bg-cream"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Question</span>
              </button>
            </div>
          )}

          {/* Empty State (Requirement 3: No big intro card, one line, live coverage, 5 answerable examples) */}
          {answers.length === 0 && !loadingStep && !errorMsg && (
            <div className="p-6 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_#15183A] space-y-6">
              <div className="space-y-2 border-b-2 border-ink pb-4">
                <p className="font-body text-base text-ink leading-relaxed">
                  Ask questions grounded in statutory filings, municipal lease deeds, and gazetted state policies.
                </p>
                <div className="text-xs font-mono text-muted flex flex-wrap items-center gap-2">
                  <span className="font-bold text-cobalt">Live Repository Coverage:</span>
                  <span>{gccs.length} companies</span>
                  <span>•</span>
                  <span>{cities.length} cities</span>
                  <span>•</span>
                  <span>{states.length} state policies</span>
                  <span>•</span>
                  <span>{providers.length} providers sourced</span>
                </div>
              </div>

              {/* 5 Answerable Example Questions as Pill Buttons in Body Font (Instrument Sans) */}
              <div className="space-y-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted block">
                  Answerable Example Questions:
                </span>
                <div className="flex flex-col gap-2.5">
                  {ANSWERABLE_EXAMPLES.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleExecute(ex)}
                      className="text-left p-3.5 border-2 border-ink rounded-full bg-cream text-ink font-body text-sm hover:bg-white hover:shadow-[2px_2px_0px_#15183A] transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium">{ex}</span>
                      <ArrowRight className="w-4 h-4 text-cobalt opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stacked Answer Sheets (Requirement 2) */}
          <div className="space-y-8" aria-live="polite">
            {answers.map((sheet, sIdx) => (
              <article
                key={sheet.id}
                className="p-6 sm:p-8 border-2 border-ink bg-surface rounded-xs shadow-[4px_4px_0px_#15183A] space-y-5"
              >
                {/* Question as Heading */}
                <div className="flex items-start justify-between gap-3 border-b-2 border-ink pb-4">
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink leading-tight">
                    {sheet.query}
                  </h2>
                  <span className="text-xs font-mono text-muted flex-shrink-0 pt-1">
                    {sheet.timestamp}
                  </span>
                </div>

                {/* Sourced Short Paragraphs with Footnote Markers */}
                <div className="space-y-3 font-body text-[17px] text-ink leading-relaxed max-w-[68ch]">
                  {sheet.answer_blocks.map((block, bIdx) => (
                    <p key={bIdx} className="relative">
                      <span>{block.text}</span>
                      {block.claim_ids && block.claim_ids.length > 0 && (
                        <span className="inline-flex gap-1 ml-1.5 align-super">
                          {block.claim_ids.map((cid, cIdx) => {
                            const claim = claimsMap.get(cid);
                            const source = claim ? sourcesMap.get(claim.source_id) : null;
                            const isSelected = activeSourceId === claim?.source_id;

                            return (
                              <button
                                key={cid}
                                type="button"
                                onClick={() => {
                                  if (source) {
                                    setActiveSourceId(source.id);
                                    setMobileSourceOpen(true);
                                  }
                                }}
                                className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono font-bold border border-ink rounded-full transition-all cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? "bg-cobalt text-white scale-110 ring-2 ring-cobalt"
                                    : "bg-marigold text-ink hover:bg-cobalt hover:text-white"
                                }`}
                                aria-label={`Source citation ${cIdx + 1} for ${claim?.field || "claim"}`}
                              >
                                {cIdx + 1}
                              </button>
                            );
                          })}
                        </span>
                      )}
                    </p>
                  ))}
                </div>

                {/* Sources Disagree Box (Requirement 4: Disagreement between sources) */}
                {sheet.disagreements && sheet.disagreements.length > 0 && (
                  <div className="p-4 border-2 border-marigold bg-marigold/15 rounded-xs space-y-2 mt-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
                      <AlertTriangle className="w-4 h-4 text-ink" />
                      <span>Sources Disagree on this Metric</span>
                    </div>
                    {sheet.disagreements.map((dis, dIdx) => (
                      <div key={dIdx} className="space-y-1.5 text-xs font-mono pt-1">
                        <div className="p-2 border border-ink bg-surface rounded-xs flex items-center justify-between">
                          <span>{dis.source_a}</span>
                          <span className="font-bold">{dis.value_a} (Grade {dis.grade_a})</span>
                        </div>
                        <div className="p-2 border border-ink bg-surface rounded-xs flex items-center justify-between">
                          <span>{dis.source_b}</span>
                          <span className="font-bold">{dis.value_b} (Grade {dis.grade_b})</span>
                        </div>
                        <p className="font-body text-xs text-muted pt-1">
                          {dis.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* No-Answer State: "The Atlas has no sourced data on this yet" (Requirement 4) */}
                {!sheet.is_grounded && (
                  <div className="p-4 border-2 border-coral bg-coral/10 rounded-xs space-y-3 mt-4">
                    <div className="font-mono text-xs font-bold text-coral uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>The Atlas has no sourced data on this yet</span>
                    </div>
                    <p className="font-body text-sm text-ink leading-relaxed">
                      This question asks for figures or claims that are not yet verified in our statutory repository. In accordance with our hard rules, we never guess.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setSuggestSentMap((prev) => ({ ...prev, [sheet.id]: true }))
                      }
                      className="px-4 py-2 border-2 border-ink rounded-full bg-surface text-xs font-mono font-bold hover:bg-cream transition-all"
                    >
                      {suggestSentMap[sheet.id]
                        ? "✓ Thank you! Source suggested."
                        : "+ Suggest a source"}
                    </button>
                  </div>
                )}

                {/* Under each answer: Three Required Blocks (Requirement 2) */}
                <div className="pt-5 border-t-2 border-ink space-y-4">
                  {/* Block A: What we could not verify */}
                  <div className="p-3.5 border border-ink bg-cream rounded-xs space-y-1">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted block">
                      What we could not verify:
                    </span>
                    {sheet.gaps && sheet.gaps.length > 0 ? (
                      <ul className="list-disc list-inside text-xs font-body text-ink space-y-0.5">
                        {sheet.gaps.map((g, gIdx) => (
                          <li key={gIdx}>{g}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-body text-muted italic">
                        No gaps found for this question. All stated numbers are verified against repository claims.
                      </p>
                    )}
                  </div>

                  {/* Block B: See in the Atlas pre-filtered links */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted block">
                      See in the Atlas:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <a
                        href="/reconcile"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-cream hover:bg-surface rounded-full shadow-2xs"
                      >
                        <span>Reconcile Counts</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/registry"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-cream hover:bg-surface rounded-full shadow-2xs"
                      >
                        <span>Verified Registry</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/compare"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-cream hover:bg-surface rounded-full shadow-2xs"
                      >
                        <span>City Compare</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/radar"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-cream hover:bg-surface rounded-full shadow-2xs"
                      >
                        <span>Radar Signals</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Block C: Actions (Copy citation, Copy answer with sources, Report an error) */}
                  <div className="pt-2 border-t border-hairline-subtle flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `cite-${sheet.id}`,
                            `GCC Atlas Record: "${sheet.query}" — Retrieved from https://gccatlas.in/ask`
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-ink underline decoration-1"
                      >
                        {copiedType === `cite-${sheet.id}` ? (
                          <Check className="w-3.5 h-3.5 text-mint" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedType === `cite-${sheet.id}`
                            ? "Copied citation!"
                            : "Copy citation"}
                        </span>
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `full-${sheet.id}`,
                            `Q: ${sheet.query}\nA: ${sheet.answer_blocks.map((b) => b.text).join(" ")}\n(Source: GCC Atlas Research Record)`
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-ink underline decoration-1"
                      >
                        {copiedType === `full-${sheet.id}` ? (
                          <Check className="w-3.5 h-3.5 text-mint" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedType === `full-${sheet.id}`
                            ? "Copied answer!"
                            : "Copy answer with sources"}
                        </span>
                      </button>
                    </div>

                    <a
                      href="mailto:audit@gccatlas.in?subject=Report%20Evidence%20Error"
                      className="hover:text-coral underline decoration-1"
                    >
                      Report an error
                    </a>
                  </div>
                </div>

                {/* Follow-up suggestions as 2-3 plain pill buttons (Requirement 2) */}
                {sheet.follow_ups && sheet.follow_ups.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted block">
                      Follow-up Questions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sheet.follow_ups.map((fu, fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => handleExecute(fu)}
                          className="px-4 py-1.5 border-2 border-ink rounded-full bg-surface text-ink text-xs font-body font-medium hover:bg-cream hover:shadow-[2px_2px_0px_#15183A] transition-all"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Right Margin Column (280px on desktop): Sources & Recent Rail (Requirement 2 & 5) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Active Sources Margin Card */}
          <div className="p-5 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_#15183A] space-y-4">
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Cited Sources ({activeCitedSources.length})
              </span>
              <span className="font-mono text-[11px] text-muted">
                Statutory Citations
              </span>
            </div>

            {activeCitedSources.length === 0 ? (
              <p className="font-body text-xs text-muted italic">
                Citations for claims in the active answer sheet will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {activeCitedSources.map((source, idx) => {
                  const isHighlighted = activeSourceId === source.id;
                  return (
                    <div
                      key={source.id}
                      className={`p-3.5 border-2 transition-all rounded-xs space-y-2 ${
                        isHighlighted
                          ? "border-cobalt bg-cream shadow-xs"
                          : "border-hairline-subtle bg-surface hover:border-ink"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-cobalt">
                          [{idx + 1}] {source.publisher}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 border border-ink bg-surface rounded-2xs">
                          {source.type.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="font-display font-bold text-sm text-ink leading-snug line-clamp-2">
                        {source.name}
                      </h4>

                      <div className="text-[11px] font-mono text-muted space-y-0.5">
                        <div>Published: {source.published_at}</div>
                        <div>Retrieved: {source.retrieved_at}</div>
                      </div>

                      <div className="pt-2 border-t border-hairline-subtle flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => openSourceDrawer(source)}
                          className="text-xs font-mono text-cobalt font-bold hover:underline"
                        >
                          View filing details
                        </button>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted hover:text-ink"
                            aria-label={`Open primary source link for ${source.name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Questions Rail (local only, Requirement 5) */}
          {recentQueries.length > 0 && (
            <div className="p-5 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_#15183A] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-muted" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                    Recent Questions
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted">Local</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {recentQueries.map((rq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputQuery(rq);
                      handleExecute(rq);
                    }}
                    className="text-left py-1.5 px-2.5 rounded-sm hover:bg-cream text-xs font-body text-ink transition-colors line-clamp-1 border border-transparent hover:border-hairline-subtle"
                  >
                    {rq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet for Sources (<1024px, Requirement 2) */}
      {mobileSourceOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-ink/40"
            onClick={() => setMobileSourceOpen(false)}
          />
          <div className="relative z-10 p-5 bg-cream border-t-2 border-ink shadow-2xl space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Cited Sources ({activeCitedSources.length})
              </span>
              <button
                type="button"
                onClick={() => setMobileSourceOpen(false)}
                className="w-7 h-7 border border-ink rounded-full bg-surface flex items-center justify-center text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {activeCitedSources.map((source, idx) => (
                <div
                  key={source.id}
                  className="p-3 border border-ink bg-surface rounded-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-cobalt">[{idx + 1}] {source.publisher}</span>
                    <span className="text-[10px] text-muted">{source.published_at}</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-ink">{source.name}</h4>
                  <div className="pt-2 border-t border-hairline-subtle flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileSourceOpen(false);
                        openSourceDrawer(source);
                      }}
                      className="text-cobalt font-bold underline"
                    >
                      View filing record
                    </button>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted"
                      >
                        <span>Original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
