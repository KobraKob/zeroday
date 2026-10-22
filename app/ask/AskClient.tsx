"use client";

import React, { useState } from "react";
import { Claim, Source } from "../../lib/schema";
import { PageHeader } from "../../components/PageHeader";
import { SourceFootnote } from "../../components/SourceFootnote";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import {
  Sparkles,
  Send,
  Shield,
  AlertCircle,
  CornerDownRight,
  User,
  Bot,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "zeroday";
  text?: string;
  answer_blocks?: Array<{ text: string; claim_ids: string[] }>;
  follow_ups?: string[];
  gaps?: string[];
  is_grounded?: boolean;
  engine?: string;
}

interface AskClientProps {
  claims: Claim[];
  sources: Source[];
}

export function AskClient({ claims, sources }: AskClientProps) {
  const sourcesMap = new Map<string, Source>();
  sources.forEach((s) => sourcesMap.set(s.id, s));

  const claimsMap = new Map<string, Claim>();
  claims.forEach((c) => claimsMap.set(c.id, c));

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "zeroday",
      text: "Hello! I am Zero, the grounded epistemic auditor for ZeroDay. Every answer I provide is compiled exclusively from primary statutory public filings, MCA Corporate Identification Numbers (CIN), and gazette decrees. If a metric is unverified, I explicitly disclose the evidence gap rather than hallucinating.",
      follow_ups: [
        "What is India's total GCC market revenue in FY26?",
        "How many GCC units does Bengaluru have?",
        "Why do published GCC counts vary from 1,400 to 2,975?",
        "What was GCC office leasing share in Q1 2026?",
        "What is Google India's established year and CIN?",
      ],
      is_grounded: true,
      engine: "Zero (ZeroDay Vector Auditor)",
    },
  ]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend }),
      });

      const data = await res.json();

      const zdMsg: Message = {
        id: `zd-${Date.now()}`,
        sender: "zeroday",
        answer_blocks: data.answer_blocks,
        follow_ups: data.follow_ups,
        gaps: data.gaps,
        is_grounded: data.is_grounded,
        engine: data.engine,
      };

      setMessages((prev) => [...prev, zdMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `zd-err-${Date.now()}`,
          sender: "zeroday",
          text: "Error retrieving evidence claims from local repository. Please re-submit query.",
          is_grounded: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      {/* Editorial Header */}
      <PageHeader
        rubric="Grounded Vector Intelligence"
        findingHeadline="Ask Zero: Primary statutory evidence without speculation"
        findingDescription="Powered by Groq high-speed inference and ZeroDay's semantic vector database. Every response is compiled strictly from audited claims. Unverified questions are explicitly disclosed."
        pageTitle="Ask Zero — ZeroDay Intelligence"
        path="/ask"
        metadata="ZeroDay AI Auditor"
      />

      {/* Chat Messages Log */}
      <div className="p-6 border border-hairline bg-surface dark:bg-[#111827] space-y-6 min-h-[440px] max-h-[640px] overflow-y-auto shadow-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-sm ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "zeroday" && (
              <div className="w-8 h-8 border border-verdigris text-white bg-verdigris flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                0D
              </div>
            )}

            <div
              className={`max-w-xl p-4 space-y-3 ${
                msg.sender === "user"
                  ? "bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700 font-sans"
                  : "bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              }`}
            >
              {msg.text && (
                <p className="leading-relaxed text-sm font-sans">
                  {msg.text}
                </p>
              )}

              {/* Sourced Answer Blocks */}
              {msg.answer_blocks &&
                msg.answer_blocks.map((block, bIdx) => (
                  <div key={bIdx} className="space-y-2">
                    <p className="leading-relaxed text-sm font-sans text-slate-900 dark:text-slate-100">
                      {block.text}
                    </p>

                    {/* Cited Claims */}
                    {block.claim_ids && block.claim_ids.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                        <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block">
                          Audited Citations Attached:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {block.claim_ids.map((cId) => {
                            const claim = claimsMap.get(cId);
                            const source = claim
                              ? sourcesMap.get(claim.source_id)
                              : null;
                            if (!claim) return null;
                            return (
                              <div
                                key={cId}
                                className="inline-flex items-center gap-1.5 p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                              >
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {claim.field.replace(/_/g, " ")}:
                                </span>
                                <span className="tabular-nums font-bold text-verdigris">
                                  {String(claim.value)} {claim.unit || ""}
                                </span>
                                <ConfidenceStamp grade={claim.confidence} size="sm" />
                                {source && (
                                  <SourceFootnote
                                    source={source}
                                    claim={claim}
                                    fieldLabel={claim.field}
                                    showMarkerOnly={true}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* Engine Badge */}
              {msg.engine && (
                <div className="pt-1 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Engine: {msg.engine}</span>
                  <span className="text-verdigris">Verified Grounding</span>
                </div>
              )}

              {/* Data Gaps Notice */}
              {msg.gaps && msg.gaps.length > 0 && (
                <div className="p-3 border border-red-500/50 bg-red-500/10 text-xs text-red-600 dark:text-red-400 font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase block text-[11px]">Unverified Evidence Metric:</span>
                    {msg.gaps.map((g, gIdx) => (
                      <p key={gIdx} className="leading-snug">
                        {g}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Prompts */}
              {msg.follow_ups && msg.follow_ups.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block">
                    Grounded Research Queries:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.follow_ups.map((fu, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => handleSend(fu)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 hover:border-verdigris hover:text-verdigris transition-colors duration-fast text-left"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-verdigris shrink-0" />
                        <span>{fu}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="w-8 h-8 border border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-xs bg-slate-100 dark:bg-slate-800 shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-sm justify-start">
            <div className="w-8 h-8 border border-verdigris text-white bg-verdigris flex items-center justify-center font-mono font-bold text-xs">
              0D
            </div>
            <div className="p-3.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-verdigris animate-pulse rounded-full"></span>
              <span>Zero is querying verified vector repository via Groq...</span>
            </div>
          </div>
        )}
      </div>

      {/* Query Input Bar — Explicit High-Contrast Fix for Dark & Light Mode */}
      <div className="p-4 border border-hairline bg-surface dark:bg-[#111827] shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Zero an audited question (e.g. 'What is the GCC market size?' or 'How many GCC units in Bengaluru?')..."
            className="flex-1 py-3 px-4 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-sans text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus:border-verdigris min-h-[48px] shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-mono font-bold uppercase tracking-wider hover:bg-verdigris dark:hover:bg-verdigris dark:hover:text-white transition-colors duration-fast disabled:opacity-40 min-h-[48px] flex items-center gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Ask Zero</span>
          </button>
        </form>
      </div>
    </div>
  );
}
