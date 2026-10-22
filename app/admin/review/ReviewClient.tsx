"use client";

import React, { useState } from "react";
import { PendingReviewClaim } from "../../../lib/repo/reviewsRepo";
import { Source } from "../../../lib/schema";
import { PageHeader } from "../../../components/PageHeader";
import { ConfidenceStamp } from "../../../components/ConfidenceStamp";
import {
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Shield,
  Clock,
  Check,
} from "lucide-react";

interface ReviewClientProps {
  initialClaims: PendingReviewClaim[];
  sources: Source[];
}

export function ReviewClient({ initialClaims, sources }: ReviewClientProps) {
  const [claims, setClaims] = useState<PendingReviewClaim[]>(initialClaims);
  const [selectedClaim, setSelectedClaim] = useState<PendingReviewClaim | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const total = claims.length;
  const approved = claims.filter((c) => c.status === "approved").length;
  const rejected = claims.filter((c) => c.status === "rejected").length;
  const pending = claims.filter((c) => c.status === "pending").length;
  const reviewed = approved + rejected;
  const acceptRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

  const handleApprove = (id: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "approved", reviewed_at: new Date().toISOString() }
          : c
      )
    );
  };

  const handleReject = (id: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "rejected",
              rejection_reason: rejectReason || "Rejected during human review",
              reviewed_at: new Date().toISOString(),
            }
          : c
      )
    );
    setSelectedClaim(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Editorial Header */}
      <PageHeader
        rubric="Human-in-the-Loop Verification"
        findingHeadline="Editorial Review Queue: Peer audit of AI extracted claims and public submissions"
        findingDescription="Every ingested claim requires explicit verification against the underlying regulatory document before publication into the live registry."
        pageTitle="GCC Atlas Review Queue"
        path="/admin/review"
        metadata={`${pending} Pending Verification`}
      />

      {/* Audit Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-hairline bg-surface p-4 text-xs font-mono">
        <div>
          <span className="text-muted text-[10px] uppercase block">Total Queue</span>
          <span className="font-bold text-lg text-ink tabular-nums">{total}</span>
        </div>
        <div>
          <span className="text-muted text-[10px] uppercase block">Pending Audit</span>
          <span className="font-bold text-lg text-coral tabular-nums">{pending}</span>
        </div>
        <div>
          <span className="text-muted text-[10px] uppercase block">Approved Claims</span>
          <span className="font-bold text-lg text-cobalt tabular-nums">{approved}</span>
        </div>
        <div>
          <span className="text-muted text-[10px] uppercase block">Acceptance Rate</span>
          <span className="font-bold text-lg text-ink tabular-nums">{acceptRate}%</span>
        </div>
      </div>

      {/* Review Queue Ledger Table */}
      <div className="border border-hairline bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b-2 border-ink bg-paper/90 font-mono text-[10px] uppercase tracking-wider text-muted">
              <th scope="col" className="py-3 px-4 min-w-[160px]">Subject ID / Entity</th>
              <th scope="col" className="py-3 px-4 min-w-[130px]">Field</th>
              <th scope="col" className="py-3 px-4 min-w-[140px]">Extracted Value</th>
              <th scope="col" className="py-3 px-3 text-center min-w-[90px]">Confidence</th>
              <th scope="col" className="py-3 px-4 min-w-[200px]">Verbatim Source Excerpt</th>
              <th scope="col" className="py-3 px-4 text-right min-w-[150px]">Audit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {claims.map((item) => {
              const clm = item.claim;

              return (
                <tr key={item.id} className="hover:bg-paper/30 transition-colors">
                  <td className="py-3.5 px-4 font-display font-bold text-ink text-sm">
                    {clm.subject_id}
                  </td>

                  <td className="py-3.5 px-4 font-mono uppercase text-[11px] text-muted">
                    {clm.field.replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-ink tabular-nums">
                    {String(clm.value)} {clm.unit || ""}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <ConfidenceStamp grade={clm.confidence} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 font-serif italic text-muted text-xs leading-relaxed max-w-xs">
                    &ldquo;{item.exact_quote}&rdquo;
                    {item.source_url && (
                      <div className="font-mono not-italic text-[10px] text-cobalt mt-1 flex items-center gap-1">
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-0.5"
                        >
                          <span>Examine Document</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {item.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className="px-2.5 py-1 bg-ink text-paper uppercase font-bold hover:bg-cobalt transition-colors duration-fast"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClaim(item)}
                          className="px-2 py-1 border border-hairline text-muted hover:border-coral hover:text-coral transition-colors duration-fast"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 border ${
                          item.status === "approved"
                            ? "border-cobalt text-cobalt bg-cobalt/10"
                            : "border-coral text-coral bg-coral/10"
                        }`}
                      >
                        {item.status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {selectedClaim && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs font-sans"
        >
          <div className="bg-surface border border-hairline p-6 max-w-md w-full space-y-4 shadow-panel">
            <h3 className="font-display font-bold text-base text-ink">
              Reject Claim: {selectedClaim.claim.subject_id}
            </h3>
            <p className="text-xs text-muted font-serif italic">
              State the rejection rationale for the public audit log:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Unverified secondary blog; conflicting MCA entity CIN..."
              className="w-full p-2.5 border border-hairline bg-paper/50 font-mono text-xs text-ink focus-visible:outline-cobalt"
            />
            <div className="flex items-center justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-3 py-1.5 border border-hairline text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(selectedClaim.id)}
                className="px-4 py-1.5 bg-coral text-paper uppercase font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
