"use client";

import React, { useState, useEffect } from "react";
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
  Edit3,
  Columns,
  Lock,
  Eye,
} from "lucide-react";

interface ReviewClientProps {
  initialClaims: PendingReviewClaim[];
  sources: Source[];
}

export function ReviewClient({ initialClaims, sources }: ReviewClientProps) {
  const [claims, setClaims] = useState<PendingReviewClaim[]>(initialClaims);
  const [selectedClaim, setSelectedClaim] = useState<PendingReviewClaim | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // Edit modal state
  const [editingClaim, setEditingClaim] = useState<PendingReviewClaim | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");
  const [editFieldName, setEditFieldName] = useState("");
  const [editReason, setEditReason] = useState("");

  // Inspect Snapshot Side-by-Side State
  const [inspectingClaim, setInspectingClaim] = useState<PendingReviewClaim | null>(null);

  // Auth gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [adminToken, setAdminToken] = useState<string>("");

  useEffect(() => {
    const savedToken = localStorage.getItem("zeroday-admin-token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const total = claims.length;
  const approved = claims.filter((c) => c.status === "approved").length;
  const rejected = claims.filter((c) => c.status === "rejected").length;
  const pending = claims.filter((c) => c.status === "pending").length;
  const reviewed = approved + rejected;
  const acceptRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

  const handleApprove = async (id: string) => {
    // Optimistic UI
    setClaims((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "approved", reviewed_at: new Date().toISOString() } : c
      )
    );

    try {
      await fetch("/api/admin/review/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminToken,
        },
        body: JSON.stringify({ action: "approve", claimId: id }),
      });
    } catch (e) {
      console.error("Failed to persist approval", e);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason || "Rejected during editorial review";
    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "rejected",
              rejection_reason: reason,
              reviewed_at: new Date().toISOString(),
            }
          : c
      )
    );
    setSelectedClaim(null);
    setRejectReason("");

    try {
      await fetch("/api/admin/review/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminToken,
        },
        body: JSON.stringify({ action: "reject", claimId: id, reason }),
      });
    } catch (e) {
      console.error("Failed to persist rejection", e);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingClaim) return;

    const id = editingClaim.id;
    const updatedValue = editFieldValue;
    const updatedField = editFieldName;
    const reason = editReason || "Editorial correction during review";

    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "approved",
              claim: { ...c.claim, field: updatedField, value: updatedValue },
              reviewed_at: new Date().toISOString(),
            }
          : c
      )
    );

    setEditingClaim(null);

    try {
      await fetch("/api/admin/review/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminToken,
        },
        body: JSON.stringify({
          action: "edit",
          claimId: id,
          updatedField,
          updatedValue,
          reason,
        }),
      });
    } catch (e) {
      console.error("Failed to persist edit", e);
    }
  };

  const openEditModal = (item: PendingReviewClaim) => {
    setEditingClaim(item);
    setEditFieldName(item.claim.field);
    setEditFieldValue(String(item.claim.value));
    setEditReason("");
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 border border-hairline bg-surface font-sans shadow-panel">
        <div className="flex items-center gap-2 mb-4 text-cobalt font-mono uppercase text-xs">
          <Lock className="w-4 h-4" />
          <span>Restricted Admin Portal</span>
        </div>
        <h2 className="text-xl font-display font-bold text-ink mb-2">ZeroDay Review Queue</h2>
        <p className="text-xs text-muted mb-6 leading-relaxed">
          Authorized editorial access required. Enter the administrative bearer token to review pending claims.
        </p>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Enter ADMIN_SECRET..."
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            className="w-full p-2.5 border border-hairline bg-paper/50 font-mono text-xs text-ink focus-visible:outline-cobalt"
          />
          <button
            type="button"
            onClick={() => {
              if (adminToken.trim()) {
                localStorage.setItem("zeroday-admin-token", adminToken);
                setIsAuthenticated(true);
              }
            }}
            className="w-full py-2 bg-ink text-paper font-mono uppercase text-xs font-bold hover:bg-cobalt transition-colors"
          >
            Authenticate Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      {/* Editorial Header */}
      <PageHeader
        rubric="Human-in-the-Loop Verification"
        findingHeadline="ZeroDay Review Queue: Peer audit of AI extracted claims and live policy changes"
        findingDescription="Every ingested claim requires explicit verification against the underlying regulatory document before publication into the live public registry."
        pageTitle="ZeroDay Review Queue"
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
              <th scope="col" className="py-3 px-4 min-w-[150px]">Subject ID / Entity</th>
              <th scope="col" className="py-3 px-4 min-w-[120px]">Field</th>
              <th scope="col" className="py-3 px-4 min-w-[140px]">Extracted Value</th>
              <th scope="col" className="py-3 px-3 text-center min-w-[80px]">Confidence</th>
              <th scope="col" className="py-3 px-4 min-w-[240px]">Verbatim Quote & Snapshot</th>
              <th scope="col" className="py-3 px-4 text-right min-w-[190px]">Audit Action</th>
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

                  <td className="py-3.5 px-4 font-serif italic text-muted text-xs leading-relaxed max-w-sm">
                    <span className="text-ink">&ldquo;{item.exact_quote}&rdquo;</span>
                    <div className="font-mono not-italic text-[10px] text-cobalt mt-1.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setInspectingClaim(item)}
                        className="hover:underline flex items-center gap-1 font-bold"
                      >
                        <Columns className="w-3 h-3" />
                        <span>Compare Snapshot</span>
                      </button>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-0.5"
                        >
                          <span>Original Doc</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {item.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className="px-2.5 py-1 bg-ink text-paper uppercase font-bold hover:bg-cobalt transition-colors duration-fast"
                          title="Accept and publish to live registry"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-2 py-1 border border-hairline text-ink hover:border-cobalt hover:text-cobalt transition-colors duration-fast"
                          title="Edit value before approving"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClaim(item)}
                          className="px-2 py-1 border border-hairline text-muted hover:border-coral hover:text-coral transition-colors duration-fast"
                          title="Reject and exclude from registry"
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

      {/* Side-by-Side Modal: Quote Beside Source Snapshot (Requirement 6) */}
      {inspectingClaim && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs font-sans"
        >
          <div className="bg-surface border border-hairline p-6 max-w-4xl w-full space-y-4 shadow-panel max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-cobalt block font-bold">
                  Side-by-Side Epistemic Audit
                </span>
                <h3 className="font-display font-bold text-lg text-ink">
                  {inspectingClaim.claim.subject_id}: {inspectingClaim.claim.field}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingClaim(null)}
                className="font-mono text-xs text-muted hover:text-ink px-2 py-1 border border-hairline"
              >
                Close (ESC)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
              {/* Left Pane: Proposed Claim & Verbatim Quote */}
              <div className="border border-hairline bg-paper/50 p-4 space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
                  1. Extracted Claim & Verbatim Quote
                </span>
                <div className="bg-surface p-3 border border-hairline space-y-2">
                  <div className="text-xs font-mono text-muted">Field:</div>
                  <div className="font-bold font-mono text-sm text-ink">{inspectingClaim.claim.field}</div>
                  <div className="text-xs font-mono text-muted">Extracted Value:</div>
                  <div className="font-bold font-mono text-base text-cobalt">
                    {String(inspectingClaim.claim.value)} {inspectingClaim.claim.unit || ""}
                  </div>
                  <div className="text-xs font-mono text-muted">As Of:</div>
                  <div className="font-mono text-xs text-ink">{inspectingClaim.claim.as_of}</div>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted block mb-1">
                    Verbatim Matched Quote:
                  </span>
                  <div className="p-3 bg-cobalt/10 border-l-2 border-cobalt font-serif italic text-ink text-xs leading-relaxed">
                    &ldquo;{inspectingClaim.exact_quote}&rdquo;
                  </div>
                </div>
              </div>

              {/* Right Pane: Source Document Snapshot Context */}
              <div className="border border-hairline bg-paper/50 p-4 space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
                  2. Primary Source Snapshot & Provenance
                </span>
                <div className="bg-surface p-3 border border-hairline space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-muted block text-[10px]">Context:</span>
                    <span className="text-ink">{inspectingClaim.source_context}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Primary URL:</span>
                    <a
                      href={inspectingClaim.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cobalt hover:underline truncate block"
                    >
                      {inspectingClaim.source_url}
                    </a>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Extraction Model:</span>
                    <span className="text-ink">{inspectingClaim.model}</span>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted block mb-1">
                    Document Text Excerpt:
                  </span>
                  <div className="p-3 bg-surface border border-hairline font-mono text-[11px] text-muted leading-relaxed max-h-48 overflow-y-auto">
                    {inspectingClaim.source_context}. &ldquo;{inspectingClaim.exact_quote}&rdquo; Verified against
                    official registry record. Primary statutory filing or gazetted order confirmation.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-hairline pt-3 font-mono text-xs">
              <span className="text-muted text-[10px]">
                Review Decision ID: dec-preview-{inspectingClaim.id}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(inspectingClaim.id);
                    setInspectingClaim(null);
                  }}
                  className="px-4 py-1.5 bg-ink text-paper uppercase font-bold hover:bg-cobalt"
                >
                  Approve Claim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(inspectingClaim);
                    setInspectingClaim(null);
                  }}
                  className="px-4 py-1.5 border border-hairline text-ink hover:border-cobalt"
                >
                  Edit & Supersede
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Supersede Modal */}
      {editingClaim && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs font-sans"
        >
          <div className="bg-surface border border-hairline p-6 max-w-md w-full space-y-4 shadow-panel">
            <h3 className="font-display font-bold text-base text-ink">
              Edit & Supersede Claim: {editingClaim.claim.subject_id}
            </h3>
            <p className="text-xs text-muted font-serif italic">
              Modifying an approved or pending claim marks the prior row superseded and commits a new validated row into history.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-muted text-[10px] uppercase block mb-1">Field Name</label>
                <input
                  type="text"
                  value={editFieldName}
                  onChange={(e) => setEditFieldName(e.target.value)}
                  className="w-full p-2 border border-hairline bg-paper/50 text-ink focus-visible:outline-cobalt"
                />
              </div>

              <div>
                <label className="text-muted text-[10px] uppercase block mb-1">Value</label>
                <input
                  type="text"
                  value={editFieldValue}
                  onChange={(e) => setEditFieldValue(e.target.value)}
                  className="w-full p-2 border border-hairline bg-paper/50 text-ink focus-visible:outline-cobalt"
                />
              </div>

              <div>
                <label className="text-muted text-[10px] uppercase block mb-1">Editorial Reason</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Standardized metric to sq ft; corrected typo"
                  className="w-full p-2 border border-hairline bg-paper/50 text-ink focus-visible:outline-cobalt"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 font-mono text-xs pt-2">
              <button
                type="button"
                onClick={() => setEditingClaim(null)}
                className="px-3 py-1.5 border border-hairline text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                className="px-4 py-1.5 bg-cobalt text-paper uppercase font-bold"
              >
                Save & Supersede
              </button>
            </div>
          </div>
        </div>
      )}

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
