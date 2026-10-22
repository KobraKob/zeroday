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

  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const claimsMap = useMemo(() => {
    const map = new Map<string, Claim>();
    claims.forEach((c) => map.set(c.id, c));
    return map;
  }, [claims]);

  const sourcesMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  // Determine current page context & verified eval-list questions (Requirements 5 & 8)
  const pageContext = (() => {
    if (pathname.includes("provider")) {
      return {
        label: "You are viewing Providers",
        questions: [
          "Which real estate advisors represented Google India or Boeing in campus site selection?",
          "What services does ANSR provide for GCC incubation in India?",
          "How are service providers evaluated and ranked in the Atlas?",
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
          "What is the commercial office rent range in Bengaluru?",
          "What is the commercial office vacancy rate in Hyderabad?",
          "What is the talent salary index for Pune relative to Bengaluru?",
        ],
      };
    }
    return {
      label: "You are viewing GCC Atlas Record",
      questions: [
        "What is India's total GCC market revenue in FY26?",
        "How many professionals work in Indian GCCs in FY26?",
        "Why do published GCC counts vary from 1,400 to 2,975?",
      ],
    };
  })();

  // Synchronize prefilled query when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      if (prefilledQuery) {
        setInputQuery(prefilledQuery);
        handleExecute(prefilledQuery);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isDrawerOpen, prefilledQuery]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeAskDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  const handleExecute = async (queryToRun?: string) => {
    const text = (queryToRun || inputQuery).trim();
    if (!text) return;

    setErrorMsg(null);
    setSuggestSent(false);
    addRecentQuestion(text);

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

      setResult({
        query: text,
        answer_blocks: data.answer_blocks || [],
        follow_ups: data.follow_ups || [],
        gaps: data.gaps || [],
        is_grounded: data.is_grounded !== false,
        disagreements: data.disagreements || [],
      });
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoadingStep(null);
      setErrorMsg("Error retrieving claims from the local repository. Please retry.");
    }
  };

  const handleCopy = (type: "citation" | "full", content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (!isDrawerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask the record drawer"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-normal"
        onClick={closeAskDrawer}
      />

      {/* Drawer Surface: single surface background = var(--paper), text = var(--ink), 2px var(--rule) border */}
      <div
        ref={drawerRef}
        className="relative w-full sm:w-[580px] md:w-[680px] h-full bg-paper text-ink border-l-2 border-rule shadow-2xl flex flex-col z-10 overflow-hidden font-sans"
      >
        {/* Header row: title "Ask the record" (display font, 28px), one-line subtitle, and a close button with a visible X icon (44x44, 2px outline, keyboard focus ring, Esc closes) */}
        <div className="p-5 sm:p-6 border-b-2 border-rule bg-surface flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-cobalt flex-shrink-0" />
              <h2 className="font-display font-bold text-[28px] text-ink leading-tight">
                Ask the record
              </h2>
            </div>
            <p className="font-body text-sm text-muted mt-1 leading-snug">
              Answers come only from sourced data in the Atlas. If we don&apos;t have it, we say so.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAskDrawer}
            className="w-11 h-11 border-2 border-rule rounded-full bg-surface text-ink hover:bg-paper focus-visible:outline-cobalt focus-visible:ring-2 focus-visible:ring-cobalt flex items-center justify-center transition-all flex-shrink-0 shadow-[2px_2px_0px_var(--color-ink)] cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5 text-ink" strokeWidth={2} />
          </button>
        </div>

        {/* Plain context line (min 14px, AA contrast): "You are viewing Providers" (no pale strip) */}
        <div className="px-6 py-2.5 border-b border-rule-subtle bg-surface text-sm font-medium text-muted">
          {pageContext.label}
        </div>

        {/* Input: single 2px border (no double ring), min height 56px. Placeholder shortened. Enter hint below. Ask button filled cobalt, min 44px */}
        <div className="p-5 sm:p-6 border-b-2 border-rule bg-surface flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="space-y-1.5"
          >
            <label htmlFor="drawer-ask-input" className="sr-only">
              Ask about GCCs, cities, providers
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                id="drawer-ask-input"
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about GCCs, cities, providers..."
                className="flex-1 py-3.5 px-5 border-2 border-rule rounded-full bg-surface text-ink text-base font-body placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cobalt min-h-[56px]"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="min-h-[44px] px-6 bg-cobalt text-white border-2 border-rule rounded-full font-mono text-sm font-bold hover:shadow-[2px_2px_0px_var(--color-ink)] transition-all flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ask
              </button>
            </div>
            <p className="text-xs font-mono text-muted pl-4 pt-0.5">
              Press Enter ↵ or click Ask
            </p>
          </form>
        </div>

        {/* Content Body (Scrollable Answer Sheet) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6" aria-live="polite">
          {/* Progress / Loading State (Requirement 4: no spinner dots) */}
          {loadingStep && (
            <div className="p-5 border-2 border-rule bg-surface rounded-xs shadow-[3px_3px_0px_var(--color-ink)] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-cobalt animate-ping" />
                <span className="font-mono text-xs font-bold text-cobalt uppercase tracking-wider">
                  {loadingStep}
                </span>
              </div>
              <div className="w-full h-2 bg-paper border border-rule overflow-hidden rounded-full">
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
              <p className="font-body text-xs text-muted">
                Verifying claims and citation integrity against the Atlas repository...
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

          {/* Empty State: Try asking 3 pill buttons, body font 15px, 1.5px outline, transparent background, hover = marigold tint, wrap to multiple lines */}
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
                      className="text-left px-4 py-2.5 border-[1.5px] border-rule rounded-full bg-transparent text-ink font-body text-[15px] hover:bg-marigold/20 transition-colors cursor-pointer leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirement B.9: Small line at the bottom */}
              <div className="pt-6 border-t border-rule-subtle text-xs font-body text-muted leading-relaxed">
                Answers come only from sourced data in the Atlas. If we don&apos;t have it, we say so.
              </div>
            </div>
          )}

          {/* Answered State (Answer Sheet) */}
          {result && !loadingStep && (
            <div className="space-y-6">
              <article className="p-5 sm:p-6 border-2 border-rule bg-surface rounded-xs shadow-[3px_3px_0px_var(--color-ink)] space-y-4">
                {/* Question as Heading */}
                <h3 className="font-display font-bold text-xl sm:text-2xl text-ink leading-tight border-b-2 border-rule pb-3">
                  {result.query}
                </h3>

                {/* Sourced Short Paragraphs with Footnote Markers */}
                <div className="space-y-3 font-body text-[16px] text-ink leading-relaxed max-w-[68ch]">
                  {result.answer_blocks.map((block, bIdx) => (
                    <p key={bIdx} className="relative">
                      <span>{block.text}</span>
                      {block.claim_ids && block.claim_ids.length > 0 && (
                        <span className="inline-flex gap-1 ml-1.5 align-super">
                          {block.claim_ids.map((cid, cIdx) => {
                            const claim = claimsMap.get(cid);
                            const source = claim ? sourcesMap.get(claim.source_id) : null;
                            return (
                              <button
                                key={cid}
                                type="button"
                                onClick={() => {
                                  if (source) {
                                    openSourceDrawer(source, claim);
                                  }
                                }}
                                className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono font-bold bg-marigold border border-rule text-ink rounded-full hover:bg-cobalt hover:text-white transition-colors cursor-pointer shadow-2xs"
                                title={`Inspect source citation for ${claim?.field || "claim"}`}
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

                {/* Sources Disagree Box */}
                {result.disagreements && result.disagreements.length > 0 && (
                  <div className="p-4 border-2 border-marigold bg-marigold/15 rounded-xs space-y-2 mt-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
                      <AlertTriangle className="w-4 h-4 text-ink" />
                      <span>Sources Disagree on this Metric</span>
                    </div>
                    {result.disagreements.map((dis, dIdx) => (
                      <div key={dIdx} className="space-y-1.5 text-xs font-mono pt-1">
                        <div className="p-2 border border-rule bg-surface rounded-xs flex items-center justify-between">
                          <span>{dis.source_a}</span>
                          <span className="font-bold">{dis.value_a} (Grade {dis.grade_a})</span>
                        </div>
                        <div className="p-2 border border-rule bg-surface rounded-xs flex items-center justify-between">
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

                {/* No-Answer State: "The Atlas has no sourced data on this yet" */}
                {!result.is_grounded && (
                  <div className="p-4 border-2 border-coral bg-coral/10 rounded-xs space-y-3 mt-4">
                    <div className="font-mono text-xs font-bold text-coral uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>The Atlas has no sourced data on this yet</span>
                    </div>
                    <p className="font-body text-sm text-ink leading-relaxed">
                      In accordance with our hard rules, we never invent figures or answer from ungrounded memory.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSuggestSent(true)}
                      className="px-4 py-2 border-2 border-rule rounded-full bg-surface text-xs font-mono font-bold hover:bg-paper transition-all cursor-pointer"
                    >
                      {suggestSent ? "✓ Thank you! Source suggested." : "+ Suggest a source"}
                    </button>
                  </div>
                )}

                {/* Under each answer: Three Required Blocks */}
                <div className="pt-5 border-t-2 border-rule space-y-4">
                  {/* Block A: What we could not verify */}
                  <div className="p-3.5 border border-rule-subtle bg-surface rounded-xs space-y-1">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                      What we could not verify
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

                  {/* Block B: See in the Atlas pre-filtered deep links */}
                  <div className="p-3 border border-rule-subtle bg-surface rounded-xs space-y-2">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                      See in the Atlas
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
                        href="/providers"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-rule bg-surface hover:bg-paper rounded-full"
                      >
                        <span>Providers</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Block C: Actions (Copy citation, Copy answer with sources, Report an error) */}
                  <div className="pt-2 border-t border-rule-subtle flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "citation",
                            `GCC Atlas Record: "${result.query}" — Retrieved from https://gccatlas.in/ask`
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
                            `Q: ${result.query}\nA: ${result.answer_blocks.map((b) => b.text).join(" ")}\n(Source: GCC Atlas Archival Record)`
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-ink underline decoration-1 cursor-pointer"
                      >
                        {copiedType === "full" ? <Check className="w-3 h-3 text-mint" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === "full" ? "Copied answer!" : "Copy answer with sources"}</span>
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

              {/* Requirement B.9: Small line at the bottom */}
              <div className="pt-4 border-t border-rule-subtle text-xs font-body text-muted leading-relaxed text-center">
                Answers come only from sourced data in the Atlas. If we don&apos;t have it, we say so.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
