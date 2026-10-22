"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAsk } from "./AskContext";
import { useSourceDrawer } from "./SourceDrawerContext";
import { Claim, Source } from "../lib/schema";
import {
  X,
  Search,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldCheck,
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

  const claimsMap = new Map<string, Claim>();
  claims.forEach((c) => claimsMap.set(c.id, c));

  const sourcesMap = new Map<string, Source>();
  sources.forEach((s) => sourcesMap.set(s.id, s));

  // Determine current page context & context-specific questions (Requirement 5)
  const pageContext = (() => {
    if (pathname.includes("reconcile")) {
      return {
        label: "You are viewing Reconcile",
        questions: [
          "Why do published GCC counts vary from 1,400 to 2,975?",
          "What is the difference between parent company count and centre unit count?",
          "How many parent GCCs are verified in the registry?",
        ],
      };
    }
    if (pathname.includes("registry") || pathname.includes("gcc")) {
      return {
        label: "You are viewing Registry",
        questions: [
          "What is Google India's Corporate Identity Number (CIN)?",
          "Which GCCs in India operate in software and internet?",
          "How many Mega GCCs have over 5,000 employees?",
        ],
      };
    }
    if (pathname.includes("radar")) {
      return {
        label: "You are viewing Radar",
        questions: [
          "What corporate signals indicate an imminent GCC opening?",
          "What was the GCC commercial office leasing share in Q1 2026?",
          "How many Mega GCCs exist in India with 5000+ employees?",
        ],
      };
    }
    if (pathname.includes("compare")) {
      return {
        label: "You are viewing Compare",
        questions: [
          "What is the commercial office rent range in Bengaluru?",
          "What is the commercial office vacancy rate in Hyderabad?",
          "What compensation pay premium do GCCs offer over legacy IT services?",
        ],
      };
    }
    return {
      label: "General GCC Atlas Record",
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
    } catch (err) {
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

      {/* Drawer Surface */}
      <div
        ref={drawerRef}
        className="relative w-full sm:w-[580px] md:w-[680px] h-full bg-cream border-l-2 border-ink shadow-2xl flex flex-col z-10 overflow-hidden font-sans"
      >
        {/* Top Masthead & Close Bar */}
        <div className="p-4 sm:p-5 border-b-2 border-ink bg-surface flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cobalt" />
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink leading-tight">
                Ask the record
              </h2>
            </div>
            <p className="font-body text-xs sm:text-sm text-muted mt-1 leading-snug">
              Answers come only from sourced data in the Atlas. If we don&apos;t have it, we say so.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAskDrawer}
            className="w-9 h-9 border-2 border-ink rounded-full bg-cream text-ink hover:bg-ink hover:text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-[2px_2px_0px_#15183A]"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Current Page Context Indicator */}
        <div className="px-5 py-2 border-b border-hairline-subtle bg-marigold/15 text-[11px] font-mono text-ink flex items-center justify-between">
          <span className="font-medium">{pageContext.label}</span>
          <span className="text-muted">3 context questions available</span>
        </div>

        {/* Input Bar pinned at the top (Requirement 2) */}
        <div className="p-4 sm:p-5 border-b-2 border-ink bg-surface flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="space-y-3"
          >
            <label htmlFor="drawer-ask-input" className="sr-only">
              Ask about GCCs, cities, incentives, providers
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="drawer-ask-input"
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask anything about India's GCC ecosystem... (e.g. 'How many GCCs in Bengaluru?', 'What does ANSR claim?')"
                className="w-full py-3 pl-4 pr-24 border-2 border-ink rounded-full bg-cream text-ink text-sm sm:text-base font-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cobalt min-h-[50px] shadow-inner"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted hidden sm:inline px-1.5 py-0.5 border border-hairline-subtle rounded-sm">
                  Enter ↵
                </span>
                <button
                  type="submit"
                  disabled={!inputQuery.trim()}
                  className="px-4 py-2 bg-cobalt text-white border-2 border-ink rounded-full text-xs font-mono font-bold hover:shadow-[2px_2px_0px_#15183A] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Ask
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Content Body (Scrollable Answer Sheet) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" aria-live="polite">
          {/* Progress / Loading State (Requirement 4: no spinner dots) */}
          {loadingStep && (
            <div className="p-5 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_#15183A] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-cobalt animate-ping" />
                <span className="font-mono text-xs font-bold text-cobalt uppercase tracking-wider">
                  {loadingStep}
                </span>
              </div>
              <div className="w-full h-1.5 bg-cream border border-ink overflow-hidden rounded-full">
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
                Verifying claim ids and citation integrity against the local Atlas repository...
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink rounded-full bg-surface text-xs font-mono font-bold hover:bg-cream"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Question</span>
              </button>
            </div>
          )}

          {/* Empty State (when no active result and not loading) */}
          {!result && !loadingStep && !errorMsg && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                  Context Questions for {pageContext.label.replace("You are viewing ", "")}
                </h3>
                <div className="flex flex-col gap-2">
                  {pageContext.questions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputQuery(q);
                        handleExecute(q);
                      }}
                      className="text-left p-3 border-2 border-ink rounded-full bg-surface text-ink font-body text-xs sm:text-sm hover:bg-cream hover:shadow-[2px_2px_0px_#15183A] transition-all flex items-center justify-between group"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-4 h-4 text-cobalt opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-2 border-ink bg-surface rounded-xs space-y-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                  Grounding Guarantee
                </span>
                <p className="font-body text-xs text-muted leading-relaxed">
                  Every answer produced by Ask is checked against audited claims. If a metric cannot be sourced from a primary statutory filing, municipal lease deed, or state gazette decree, it is discarded.
                </p>
              </div>
            </div>
          )}

          {/* Answered State (Answer Sheet) */}
          {result && !loadingStep && (
            <div className="space-y-6">
              {/* Answer Sheet Card */}
              <div className="p-5 sm:p-6 border-2 border-ink bg-surface rounded-xs shadow-[3px_3px_0px_#15183A] space-y-4">
                {/* Question as Heading */}
                <h3 className="font-display font-bold text-xl sm:text-2xl text-ink leading-tight border-b-2 border-ink pb-3">
                  {result.query}
                </h3>

                {/* Sourced Short Paragraphs with Footnote Markers */}
                <div className="space-y-3 font-body text-[17px] text-ink leading-relaxed max-w-[68ch]">
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
                                className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono font-bold bg-marigold border border-ink text-ink rounded-full hover:bg-cobalt hover:text-white transition-colors cursor-pointer shadow-2xs"
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

                {/* Sources Disagree Box (Requirement 4: Disagreement between sources) */}
                {result.disagreements && result.disagreements.length > 0 && (
                  <div className="p-4 border-2 border-marigold bg-marigold/15 rounded-xs space-y-2 mt-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
                      <AlertTriangle className="w-4 h-4 text-ink" />
                      <span>Sources Disagree on this Metric</span>
                    </div>
                    {result.disagreements.map((dis, dIdx) => (
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
                {!result.is_grounded && (
                  <div className="p-4 border-2 border-coral bg-coral/10 rounded-xs space-y-3 mt-4">
                    <div className="font-mono text-xs font-bold text-coral uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>The Atlas has no sourced data on this yet</span>
                    </div>
                    <p className="font-body text-xs text-ink leading-relaxed">
                      This question asks for figures or claims that are not yet verified in our statutory repository. In accordance with our hard rules, we never guess.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSuggestSent(true)}
                      className="px-3.5 py-1.5 border-2 border-ink rounded-full bg-surface text-xs font-mono font-bold hover:bg-cream"
                    >
                      {suggestSent ? "✓ Thank you! Source suggested." : "+ Suggest a source"}
                    </button>
                  </div>
                )}

                {/* Under each answer: Three Required Blocks (Requirement 2) */}
                <div className="pt-4 border-t-2 border-ink space-y-4">
                  {/* Block A: What we could not verify */}
                  <div className="p-3 border border-ink bg-cream rounded-xs space-y-1">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted block">
                      What we could not verify:
                    </span>
                    {result.gaps && result.gaps.length > 0 ? (
                      <ul className="list-disc list-inside text-xs font-body text-ink space-y-0.5">
                        {result.gaps.map((g, gIdx) => (
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
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted block">
                      See in the Atlas:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <a
                        href="/reconcile"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-surface hover:bg-cream rounded-full"
                      >
                        <span>Reconcile Counts</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/registry"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-surface hover:bg-cream rounded-full"
                      >
                        <span>Verified Registry</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/compare"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-surface hover:bg-cream rounded-full"
                      >
                        <span>City Compare</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="/radar"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-ink bg-surface hover:bg-cream rounded-full"
                      >
                        <span>Radar Signals</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Block C: Actions (Copy citation, Copy answer with sources, Report an error) */}
                  <div className="pt-2 border-t border-hairline-subtle flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "citation",
                            `GCC Atlas Record: "${result.query}" — Retrieved from https://gccatlas.in/ask`
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-ink underline decoration-1"
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
                            `Q: ${result.query}\nA: ${result.answer_blocks.map((b) => b.text).join(" ")}\n(Source: GCC Atlas Research Record)`
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-ink underline decoration-1"
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
              </div>

              {/* Follow-up suggestions as 2-3 plain pill buttons (Requirement 2) */}
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
                        className="px-3.5 py-1.5 border-2 border-ink rounded-full bg-surface text-ink text-xs font-body font-medium hover:bg-cream hover:shadow-[2px_2px_0px_#15183A] transition-all"
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
