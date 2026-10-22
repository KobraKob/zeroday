"use client";

import React, { useState } from "react";
import { Provider } from "../../lib/schema";
import { SubmittedAttestation } from "../../lib/repo/reviewsRepo";
import { PageHeader } from "../../components/PageHeader";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import {
  Award,
  CheckCircle2,
  Clock,
  Send,
  Shield,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface SubmitClientProps {
  providers: Provider[];
  initialAttestations: SubmittedAttestation[];
}

export function SubmitClient({
  providers,
  initialAttestations,
}: SubmitClientProps) {
  const [attestations, setAttestations] = useState<SubmittedAttestation[]>(
    initialAttestations
  );

  const [providerId, setProviderId] = useState(providers[0]?.id || "");
  const [gccName, setGccName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("real_estate");
  const [attesterName, setAttesterName] = useState("");
  const [attesterRole, setAttesterRole] = useState("");
  const [attesterEmail, setAttesterEmail] = useState("");
  const [year, setYear] = useState(2025);
  const [projectSummary, setProjectSummary] = useState("");

  const [submittedItem, setSubmittedItem] = useState<SubmittedAttestation | null>(
    null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gccName || !attesterName || !attesterEmail || !projectSummary) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    const newAttestation: SubmittedAttestation = {
      id: `attest-${Date.now()}`,
      provider_id: providerId,
      gcc_name: gccName,
      service_category: serviceCategory,
      attester_name: attesterName,
      attester_role: attesterRole,
      attester_email: attesterEmail,
      year: Number(year),
      project_summary: projectSummary,
      submitted_at: new Date().toISOString(),
      status: "pending_verification",
    };

    setAttestations([newAttestation, ...attestations]);
    setSubmittedItem(newAttestation);

    setGccName("");
    setAttesterName("");
    setAttesterRole("");
    setAttesterEmail("");
    setProjectSummary("");
  };

  const providersMap = new Map<string, Provider>();
  providers.forEach((p) => providersMap.set(p.id, p));

  return (
    <div className="space-y-12 font-sans max-w-4xl mx-auto">
      {/* Editorial Header */}
      <PageHeader
        rubric="Peer Review & Attestation"
        findingHeadline="Submit a verified GCC client attestation for provider work"
        findingDescription="All provider ratings are anchored to verifiable client engagements. Attestations require corporate email domain verification and undergo editorial review before contributing to evidence score depth."
        pageTitle="Submit GCC Client Attestation"
        path="/submit"
        metadata="Open Review"
      />

      {/* Submission Form */}
      <section aria-labelledby="form-heading" className="p-6 sm:p-8 border border-hairline bg-surface space-y-6">
        <div className="border-b border-hairline-subtle pb-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            Archival Intake Form
          </span>
          <h2 id="form-heading" className="font-display text-xl font-bold text-ink">
            Engagement Attestation Record
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Service Provider Firm:
              </label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink min-h-[44px] focus-visible:outline-cobalt"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                GCC Client Organization:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Goldman Sachs India Services"
                value={gccName}
                onChange={(e) => setGccName(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Service Category:
              </label>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink min-h-[44px] focus-visible:outline-cobalt"
              >
                <option value="real_estate">Real Estate & Workplace</option>
                <option value="advisory">Management Advisory</option>
                <option value="legal">Corporate Legal</option>
                <option value="audit">Audit & Tax Assurance</option>
                <option value="bot">Build-Operate-Transfer (BOT)</option>
                <option value="recruitment">Executive Search</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Engagement Year:
              </label>
              <input
                type="number"
                min="2015"
                max="2026"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink focus-visible:outline-cobalt min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Your Corporate Role:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Head of Real Estate / VP Tech"
                value={attesterRole}
                onChange={(e) => setAttesterRole(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Attester Full Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kulkarni"
                value={attesterName}
                onChange={(e) => setAttesterName(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Corporate Email (For Domain Proof):
              </label>
              <input
                type="email"
                required
                placeholder="ramesh@company.com"
                value={attesterEmail}
                onChange={(e) => setAttesterEmail(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-muted font-bold mb-1">
              Scope Summary &amp; Deliverables:
            </label>
            <textarea
              required
              rows={3}
              placeholder="State the commercial project scope, campus location, square footage, or staffing milestone achieved..."
              value={projectSummary}
              onChange={(e) => setProjectSummary(e.target.value)}
              className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted font-serif italic">
              Verification requires corporate email domain confirmation.
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-ink text-paper text-xs uppercase tracking-wider font-semibold hover:bg-cobalt transition-colors duration-fast min-h-[44px]"
            >
              Submit Attestation
            </button>
          </div>
        </form>

        {submittedItem && (
          <div className="p-4 border border-cobalt bg-cobalt/10 text-xs font-mono text-cobalt flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Attestation successfully registered to the pending peer review queue.</span>
          </div>
        )}
      </section>

      {/* Recent Attestations Log */}
      <section className="space-y-4">
        <div className="border-b border-hairline pb-2 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            Public Attestations Ledger ({attestations.length})
          </h2>
          <span className="font-mono text-xs text-muted">Review Queue</span>
        </div>

        <div className="border border-hairline bg-surface divide-y divide-hairline text-xs font-sans">
          {attestations.map((a) => {
            const provider = providersMap.get(a.provider_id);
            return (
              <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink uppercase text-[10px] px-1.5 py-0.5 border border-hairline bg-paper">
                      {a.service_category.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-ink">
                      {a.gcc_name}
                    </span>
                    <span className="text-muted font-mono">
                      &rarr; {provider?.name || a.provider_id}
                    </span>
                  </div>
                  <p className="text-muted font-serif italic text-xs">
                    &ldquo;{a.project_summary}&rdquo;
                  </p>
                  <div className="text-[10px] font-mono text-muted">
                    Attested by {a.attester_name} ({a.attester_role}) • Year: {a.year}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 border ${
                      a.status === "verified"
                        ? "border-cobalt text-cobalt bg-cobalt/10"
                        : "border-hairline text-muted bg-paper/50"
                    }`}
                  >
                    {a.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
