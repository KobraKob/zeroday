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
      text: "Welcome to the Grounded Query Interface. Every answer generated here is compiled exclusively from primary public claims recorded in the Atlas. If a requested datapoint is unverified in official filings, the engine explicitly discloses that it is not yet sourced rather than hallucinating.",
      follow_ups: [
        "What is India's total GCC market revenue in FY26?",
        "How many GCC units does Bengaluru have?",
        "How many Mega GCCs operate in India?",
        "What was GCC office leasing share in Q1 2026?",
        "What is Google India's established year and CIN?",
      ],
      is_grounded: true,
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
        rubric="Grounded Archival Query"
        findingHeadline="Query the verified evidence graph with strict primary source attribution"
        findingDescription="Every response is compiled strictly from audited claims. Any number without an attached primary source is rejected or marked as unverified."
        pageTitle="Ask GCC Atlas — Grounded AI"
        path="/ask"
        metadata="Grounded Verification"
      />

      {/* Chat Messages Log */}
      <div className="p-6 border border-hairline bg-surface space-y-6 min-h-[420px] max-h-[600px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "zeroday" && (
              <div className="w-7 h-7 border border-ink text-ink flex items-center justify-center font-serif font-bold text-xs bg-paper shrink-0">
                ZD
              </div>
            )}

            <div
              className={`max-w-xl p-4 space-y-3 ${
                msg.sender === "user"
                  ? "bg-ink text-paper border border-ink font-mono"
                  : "bg-paper/40 border border-hairline text-ink"
              }`}
            >
              {msg.text && (
                <p className="leading-relaxed text-xs font-serif italic">
                  {msg.text}
                </p>
              )}

              {/* Sourced Answer Blocks */}
              {msg.answer_blocks &&
                msg.answer_blocks.map((block, bIdx) => (
                  <div key={bIdx} className="space-y-2">
                    <p className="leading-relaxed text-xs font-sans text-ink">
                      {block.text}
                    </p>

                    {/* Cited Claims */}
                    {block.claim_ids.length > 0 && (
                      <div className="pt-2 border-t border-hairline-subtle space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-muted font-bold block">
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
                                className="inline-flex items-center gap-1.5 p-1.5 border border-hairline bg-surface text-[11px] font-mono"
                              >
                                <span className="font-semibold text-ink">
                                  {claim.field.replace(/_/g, " ")}:
                                </span>
                                <span className="tabular-nums font-bold">
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

              {/* Data Gaps Notice */}
              {msg.gaps && msg.gaps.length > 0 && (
                <div className="p-2.5 border border-vermilion bg-vermilion/10 text-[11px] text-vermilion font-mono flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{msg.gaps.join(" ")}</span>
                </div>
              )}

              {/* Follow-up Prompt Suggestions */}
              {msg.follow_ups && msg.follow_ups.length > 0 && (
                <div className="pt-2 border-t border-hairline-subtle space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-muted font-bold block">
                    Grounded Research Queries:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.follow_ups.map((fu, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => handleSend(fu)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-hairline bg-surface text-[11px] font-mono text-muted hover:border-ink hover:text-ink transition-colors duration-fast text-left"
                      >
                        <CornerDownRight className="w-3 h-3 text-verdigris" />
                        <span>{fu}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="w-7 h-7 border border-ink text-ink flex items-center justify-center font-bold text-xs bg-paper shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 border border-ink text-ink flex items-center justify-center font-mono font-bold text-xs bg-paper">
              ZD
            </div>
            <div className="p-3 border border-hairline bg-paper/40 text-muted font-mono text-[11px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-verdigris animate-pulse"></span>
              <span>Scanning verified evidence claims in local repository...</span>
            </div>
          </div>
        )}
      </div>

      {/* Query Input Bar */}
      <div className="p-4 border border-hairline bg-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Query audited figures (e.g. 'What is the GCC market size?' or 'How many GCC units in Bengaluru?')..."
            className="flex-1 py-2.5 px-3 border border-hairline bg-paper/50 text-xs font-mono text-ink placeholder:text-muted focus-visible:outline-verdigris min-h-[44px]"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-5 py-2.5 bg-ink text-paper text-xs font-mono font-semibold uppercase tracking-wider hover:bg-verdigris transition-colors duration-fast disabled:opacity-40 min-h-[44px] flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Query</span>
          </button>
        </form>
      </div>
    </div>
  );
}
