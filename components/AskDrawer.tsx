"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAsk } from "./AskContext";
import { useSourceDrawer } from "./SourceDrawerContext";
import { Claim, Source } from "../lib/schema";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
} from "lucide-react";

interface AskDrawerProps {
  claims?: Claim[];
  sources?: Source[];
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

interface AnswerBlock {
  text: string;
  claim_ids: string[];
}

interface AnswerResult {
  query: string;
  answer_blocks: AnswerBlock[];
  follow_ups: string[];
  gaps: string[];
  is_grounded: boolean;
  disagreements?: SourceDisagreement[];
}

export function AskDrawer({ claims = [], sources = [] }: AskDrawerProps) {
  const { isDrawerOpen, closeAskDrawer, prefilledQuery, addRecentQuestion } = useAsk();
  const { openDrawer: openSourceDrawer } = useSourceDrawer();
  const pathname = usePathname();

  const [inputQuery, setInputQuery] = useState("");
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [suggestSent, setSuggestSent] = useState(false);

  // Lazy loading citations if not passed via props (optimizes SSR bundle & eliminates lag)
  const [loadedClaims, setLoadedClaims] = useState<Claim[]>(claims);
  const [loadedSources, setLoadedSources] = useState<Source[]>(sources);

  useEffect(() => {
    if (isDrawerOpen && loadedClaims.length === 0) {
      fetch("/api/claims/citations")
        .then((res) => res.json())
        .then((data) => {
          if (data.claims) setLoadedClaims(data.claims);
          if (data.sources) setLoadedSources(data.sources);
        })
        .catch(() => {});
    }
  }, [isDrawerOpen, loadedClaims.length]);

  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const claimsMap = useMemo(() => {
    const map = new Map<string, Claim>();
    loadedClaims.forEach((c) => map.set(c.id, c));
    return map;
  }, [loadedClaims]);

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    loadedSources.forEach((s) => map.set(s.id, s));
    return map;
  }, [loadedSources]);

  // Determine current page context & verified eval-list questions
  const pageContext = (() => {
    if (pathname.includes("provider")) {
      return {
        label: "You are viewing Providers",
        questions: [
          "Which real estate advisors represented Google India or Boeing in campus site selection?",
          "What services does ANSR provide for GCC incubation in India?",
          "How are service providers evaluated and ranked in ZeroDay?",
        ],
      };
    }
    if (pathname.includes("reconcile")) {
      return {
        label: "You are viewing Reconcile",
        questions: [
          "Why do published GCC counts vary from 1,400 to 2,975?",
          "What is India's total GCC market revenue in FY26?",
          "How many professionals work in Indian GCCs in FY26?",
        ],
      };
    }
    if (pathname.includes("registry") || pathname.includes("gcc")) {
      return {
        label: "You are viewing Registry",
        questions: [
          "What is Google India Private Limited's Corporate Identification Number (CIN)?",
          "When was Microsoft India Development Center (IDC) established?",
          "How many Mega GCCs exist in India with 5000+ employees?",
        ],
      };
    }
    if (pathname.includes("radar")) {
      return {
        label: "You are viewing Radar",
        questions: [
          "What was the GCC share of commercial office leasing in Q1 2026?",
          "How many Mega GCCs exist in India with 5000+ employees?",
          "What compensation pay premium do GCCs offer over legacy IT services?",
        ],
      };
    }
    if (pathname.includes("compare")) {
      return {
        label: "You are viewing Compare",
        questions: [
          "How does Bengaluru compare to Hyderabad on active GCC counts and state subsidies?",
          "What are Karnataka's statutory incentives under the GCC Policy 2024-2029?",
          "What are the top 3 sectors by headcount in Bengaluru vs Hyderabad?",
        ],
      };
    }
    if (pathname.includes("changelog")) {
      return {
        label: "You are viewing Changelog",
        questions: [
          "What are the most recent verified GCC incorporations in India?",
          "Which policies have been gazetted in 2026?",
          "How are stale claims handled in ZeroDay?",
        ],
      };
    }
    return {
      label: "You are viewing ZeroDay Record",
      questions: [
        "Why do published GCC counts vary between NASSCOM and ANSR?",
        "What is Karnataka's statutory incentive package for Mega GCCs?",
        "How does ZeroDay reconcile published GCC counts?",
      ],
    };
  })();

  // Focus input and handle prefill on open
  useEffect(() => {
    if (isDrawerOpen) {
      if (prefilledQuery) {
        setInputQuery(prefilledQuery);
        handleExecute(prefilledQuery);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    } else {
      setLoadingStep(null);
      setErrorMsg(null);
    }
  }, [isDrawerOpen, prefilledQuery]);

  // Global Escape Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeAskDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeAskDrawer]);

  const handleExecute = async (queryText?: string) => {
    const query = (queryText !== undefined ? queryText : inputQuery).trim();
    if (!query) return;

    setErrorMsg(null);
    setLoadingStep("Searching claims");
    setResult(null);

    addRecentQuestion(query);

    const t1 = setTimeout(() => setLoadingStep("Searching claims"), 200);
    const t2 = setTimeout(() => setLoadingStep("Verifying citations"), 500);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (!res.ok) {
        throw new Error(`Engine returned status ${res.status}`);
      }

      const data: AnswerResult = await res.json();
      setLoadingStep(null);
      setResult(data);
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

  if (!isDrawerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask ZeroDay Grounded Intelligence Drawer"
      className="fixed inset-0 z-50 flex justify-end font-sans"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-paper/60 backdrop-blur-xs transition-opacity"
        onClick={closeAskDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel: full width on mobile, 520px on sm/desktop */}
      <div
        ref={drawerRef}
        className="relative w-full sm:w-[520px] bg-paper border-l-2 border-rule h-full flex flex-col shadow-[-8px_0px_32px_rgba(0,0,0,0.35)] z-10 transition-transform duration-fast ease-out"
      >
        {/* Drawer Header: Compact, calm, authoritative */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-rule bg-surface flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-cobalt rounded-full animate-pulse" />
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-ink">
              Ask ZeroDay
            </h2>
            <span className="font-mono text-[10px] text-muted border-l border-rule pl-2">
              Edition: 2026
            </span>
          </div>
          <button
            type="button"
            onClick={closeAskDrawer}
            className="w-8 h-8 border border-rule rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-paper cursor-pointer transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Page Context Pill */}
        <div className="px-5 py-2.5 bg-paper border-b border-rule-subtle text-xs font-mono text-muted flex items-center justify-between flex-shrink-0">
          <span className="truncate">{pageContext.label}</span>
          <span className="text-[10px] text-cobalt uppercase font-bold tracking-wider">
            Grounded Mode
          </span>
        </div>

        {/* Pinned Input Bar */}
        <div className="p-4 border-b-2 border-rule bg-surface flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="relative flex items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about India's GCC ecosystem..."
              className="w-full pl-3.5 pr-20 py-2.5 text-sm font-body border-2 border-rule rounded-full bg-paper text-ink focus:outline-none focus:border-cobalt transition-colors"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || Boolean(loadingStep)}
              className="absolute right-1.5 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-cobalt text-white border-2 border-rule rounded-full hover:shadow-[1px_1px_0px_var(--color-ink)] disabled:opacity-40 transition-all cursor-pointer"
            >
              Ask
            </button>
          </form>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Calm Loading State */}
          {loadingStep && (
            <div className="p-5 border-2 border-rule bg-surface rounded-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-ink">
                <span className="font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-cobalt inline-block rounded-full animate-ping" />
                  {loadingStep}...
                </span>
                <span className="text-muted text-[10px]">VERIFYING CITATIONS</span>
              </div>
              <div className="w-full bg-paper border border-rule h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cobalt h-full transition-all duration-300 rounded-full"
                  style={{
                    width:
                      loadingStep === "Searching claims"
                        ? "45%"
                        : "85%",
                  }}
                />
              </div>
              <p className="font-body text-xs text-muted">
                Verifying claims and citation integrity against the ZeroDay repository...
              </p>
            </div>
          )}

          {/* Calm Error State */}
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
                className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-rule rounded-full bg-surface text-xs font-mono font-bold hover:bg-paper cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Question</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!result && !loadingStep && !errorMsg && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted">
                  Try asking
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {pageContext.questions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputQuery(q);
                        handleExecute(q);
                      }}
                      className="text-left px-4 py-2.5 border-[1.5px] border-rule rounded-full bg-transparent text-ink font-body text-xs hover:bg-marigold/20 transition-colors cursor-pointer leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-rule-subtle text-xs font-body text-muted leading-relaxed">
                Answers come only from sourced data in ZeroDay. If we don&apos;t have it, we say so.
              </div>
            </div>
          )}

          {/* Answered State (Answer Sheet) */}
          {result && !loadingStep && (
            <div className="space-y-6">
              <article className="p-5 sm:p-6 border-2 border-rule bg-surface rounded-xs shadow-[3px_3px_0px_var(--color-ink)] space-y-4">
                {/* Question Heading */}
                <h3 className="font-display font-bold text-base text-ink leading-snug">
                  {result.query}
                </h3>

                {/* Grounded Badge / Neutrality */}
                <div className="flex items-center gap-2 pt-1 pb-2 border-b border-rule-subtle text-[11px] font-mono text-muted">
                  {result.is_grounded ? (
                    <span className="text-mint font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      100% Sourced Citations
                    </span>
                  ) : (
                    <span className="text-marigold font-bold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Data Gap Acknowledged
                    </span>
                  )}
                  <span>•</span>
                  <span>Zero Commercial Sponsorship</span>
                </div>

                {/* Answer Blocks with Footnote Numbers */}
                <div className="space-y-3 text-sm font-body text-ink leading-relaxed">
                  {result.answer_blocks.map((block, idx) => (
                    <p key={idx} className="relative">
                      {block.text}
                      {block.claim_ids.map((cid, cIdx) => {
                        const claim = claimsMap.get(cid);
                        const source = claim ? sourcesMap.get(claim.source_id) : null;
                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => openSourceDrawer(source, claim, claim?.field, cIdx + 1)}
                            className="inline-flex items-center align-super ml-1 text-cobalt font-mono font-bold text-[10px] hover:underline cursor-pointer"
                            title="Inspect primary source verification"
                          >
                            [{cIdx + 1}]
                          </button>
                        );
                      })}
                    </p>
                  ))}
                </div>

                {/* Sources Disagree Box (if present) */}
                {result.disagreements && result.disagreements.length > 0 && (
                  <div className="p-3 border-2 border-coral bg-coral/10 rounded-xs space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-coral uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Sources Disagree on this Metric</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      {result.disagreements.map((d, dIdx) => (
                        <div key={dIdx} className="grid grid-cols-2 gap-2 p-2 bg-surface border border-hairline rounded-xs">
                          <div>
                            <span className="text-muted text-[10px] block">{d.source_a}</span>
                            <span className="font-bold text-ink">{d.value_a}</span>
                          </div>
                          <div>
                            <span className="text-muted text-[10px] block">{d.source_b}</span>
                            <span className="font-bold text-ink">{d.value_b}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps / What ZeroDay Doesn't Know */}
                <div className="pt-3 border-t border-rule-subtle space-y-3">
                  <div className="p-3 border border-rule-subtle bg-paper rounded-xs space-y-1.5">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                      What ZeroDay Does Not Know Yet:
                    </span>
                    {result.gaps && result.gaps.length > 0 ? (
                      <ul className="list-disc list-inside text-xs font-body text-ink space-y-0.5">
                        {result.gaps.map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-body text-muted">
                        No gaps found for this query. All claims are verified against sources.
                      </p>
                    )}
                  </div>

                  {/* See in ZeroDay deep links */}
                  <div className="p-3 border border-rule-subtle bg-surface rounded-xs space-y-2">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                      See in ZeroDay
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <a
                        href="/reconcile"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-rule bg-surface hover:bg-paper rounded-full"
                      >
                        <span>Reconcile Ledger</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/registry"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-rule bg-surface hover:bg-paper rounded-full"
                      >
                        <span>GCC Registry</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/changelog"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-rule bg-surface hover:bg-paper rounded-full"
                      >
                        <span>Changelog</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-rule-subtle flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "citation",
                            `ZeroDay Record: "${result.query}" — Retrieved from https://zeroday.in/ask`
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-ink underline decoration-1 cursor-pointer"
                      >
                        {copiedType === "citation" ? <Check className="w-3 h-3 text-mint" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === "citation" ? "Copied citation!" : "Copy citation"}</span>
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "full",
                            `Q: ${result.query}\nA: ${result.answer_blocks.map((b) => b.text).join(" ")}\n(Source: ZeroDay Archival Record)`
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-ink underline decoration-1 cursor-pointer"
                      >
                        {copiedType === "full" ? <Check className="w-3 h-3 text-mint" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === "full" ? "Copied answer!" : "Copy answer with sources"}</span>
                      </button>
                    </div>

                    <a
                      href="mailto:audit@zeroday.in?subject=Report%20Evidence%20Error"
                      className="hover:text-coral underline decoration-1"
                    >
                      Report an error
                    </a>
                  </div>
                </div>
              </article>

              {/* Follow-up suggestions */}
              {result.follow_ups && result.follow_ups.length > 0 && (
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted block">
                    Follow-up Questions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.follow_ups.map((fu, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => {
                          setInputQuery(fu);
                          handleExecute(fu);
                        }}
                        className="px-4 py-2 border-2 border-rule rounded-full bg-surface text-ink text-xs font-body font-medium hover:bg-paper hover:shadow-[2px_2px_0px_var(--color-ink)] transition-all cursor-pointer"
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-rule-subtle text-xs font-body text-muted leading-relaxed text-center">
                Answers come only from sourced data in ZeroDay. If we don&apos;t have it, we say so.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
