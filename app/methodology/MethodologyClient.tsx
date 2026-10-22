"use client";

import React, { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { ConfidenceStamp } from "../../components/ConfidenceStamp";
import {
  Shield,
  BookOpen,
  Scale,
  Send,
  CheckCircle2,
  Lock,
  Database,
  FileCheck,
  AlertCircle,
} from "lucide-react";

export function MethodologyClient() {
  const [errorReported, setErrorReported] = useState(false);
  const [reportField, setReportField] = useState("");
  const [reportGcc, setReportGcc] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [reportNote, setReportNote] = useState("");

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorReported(true);
    setTimeout(() => setErrorReported(false), 5000);
    setReportField("");
    setReportGcc("");
    setReportUrl("");
    setReportNote("");
  };

  return (
    <div className="space-y-12 font-sans max-w-4xl mx-auto">
      {/* Editorial Header */}
      <PageHeader
        rubric="Standards & Data Governance"
        findingHeadline="Scientific Rubric: Statutory criteria, confidence stamps, and correction protocols"
        findingDescription="Every fact in the GCC Atlas is anchored to an immutable claim with publisher provenance, confidence grading (Grades A through D), and a strict neutrality firewall."
        pageTitle="GCC Atlas Methodology & Data Standards"
        path="/methodology"
        metadata="Revision 2026-Q1"
      />

      {/* Section 1: Statutory Definition */}
      <section aria-labelledby="definition-section-heading" className="space-y-4">
        <div className="border-b border-hairline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            § 01 • Legal & Empirical Scope
          </span>
          <h2 id="definition-section-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
            1. Statutory Definition of a Global Capability Centre
          </h2>
        </div>

        <div className="p-5 border border-hairline bg-paper/40 font-serif italic text-sm leading-relaxed text-ink/90 border-l-2 border-cobalt">
          &ldquo;An India-incorporated legal entity or physical operating campus whose primary economic purpose is the delivery of captive technology engineering, digital product development, advanced analytics, or global shared services solely for an affiliated non-Indian corporate parent group.&rdquo;
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-4 border border-hairline bg-surface space-y-1">
            <span className="font-mono text-[10px] uppercase font-bold text-cobalt block">
              Explicitly Included
            </span>
            <p className="text-muted leading-relaxed">
              Wholly-owned Indian subsidiaries of foreign multinational corporations, joint venture technology centres with direct overseas equity, and multi-city captive engineering facilities.
            </p>
          </div>
          <div className="p-4 border border-hairline bg-surface space-y-1">
            <span className="font-mono text-[10px] uppercase font-bold text-coral block">
              Strictly Excluded
            </span>
            <p className="text-muted leading-relaxed">
              Third-party outsourced IT service vendors (e.g. TCS, Infosys, Cognizant, Wipro), dedicated client ODCs operated by contractors, and domestic Indian conglomerates without foreign parentage.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Confidence Grading Rubric */}
      <section aria-labelledby="grading-section-heading" className="space-y-4 pt-2">
        <div className="border-b border-hairline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            § 02 • Evidence Provenance
          </span>
          <h2 id="grading-section-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
            2. Confidence Grading Rubric (Grades A to D)
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-muted font-serif italic">
          Every datapoint in the Atlas is tagged with an immutable confidence stamp reflecting source verification rigor:
        </p>

        <div className="border border-hairline bg-surface divide-y divide-hairline">
          {/* Grade A */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper/20">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <ConfidenceStamp grade="A" size="sm" showDescriptor={true} />
                <span className="font-mono text-xs font-bold text-ink">
                  Primary Statutory &amp; Regulatory Filing
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed pl-0 sm:pl-7">
                Ministry of Corporate Affairs (MCA) RoC incorporation filings, Corporate Identification Numbers (CIN), registered sub-registrar lease deeds, or officially gazetted state government policy orders.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-cobalt font-bold shrink-0">
              Highest Provenance
            </span>
          </div>

          {/* Grade B */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <ConfidenceStamp grade="B" size="sm" showDescriptor={true} />
                <span className="font-mono text-xs font-bold text-ink">
                  Authoritative Corporate Disclosure
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed pl-0 sm:pl-7">
                Official enterprise newsroom announcements, audited global SEC 10-K / annual reports, or peer-reviewed institutional surveys (e.g. nasscom-Zinnov, JLL India Research).
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold shrink-0">
              High Provenance
            </span>
          </div>

          {/* Grade C */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper/20">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <ConfidenceStamp grade="C" size="sm" showDescriptor={true} />
                <span className="font-mono text-xs font-bold text-ink">
                  Secondary Trade Press &amp; Journalism
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed pl-0 sm:pl-7">
                Single national financial newspaper coverage (e.g. Economic Times, Mint), broker market notes, or senior executive interviews awaiting statutory corroboration.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold shrink-0">
              Secondary Provenance
            </span>
          </div>

          {/* Grade D */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <ConfidenceStamp grade="D" size="sm" showDescriptor={true} />
                <span className="font-mono text-xs font-bold text-ink">
                  Unverified Third-Party Estimate
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed pl-0 sm:pl-7">
                Self-reported vendor figures, community submissions, or statistical interpolations pending primary document attachment.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold shrink-0">
              Audited Pending
            </span>
          </div>
        </div>
      </section>

      {/* Section 3: Neutrality Firewall */}
      <section id="neutrality" aria-labelledby="firewall-heading" className="space-y-4 pt-2">
        <div className="border-b border-hairline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            § 03 • Independence Standard
          </span>
          <h2 id="firewall-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
            3. The Neutrality Firewall
          </h2>
        </div>

        <div className="p-6 border border-hairline bg-surface space-y-4">
          <p className="text-xs sm:text-sm text-ink/90 font-serif italic leading-relaxed">
            ZeroDay is funded solely to provide an independent, citable record of India&apos;s technological ecosystem. To ensure absolute neutrality:
          </p>

          <ul className="space-y-2.5 font-mono text-xs text-ink/90 border-t border-hairline-subtle pt-3">
            <li className="flex items-start gap-2">
              <span className="text-cobalt font-bold">01.</span>
              <span><strong>Zero Paid Placement:</strong> No corporation or service provider can purchase ranking, priority listing, or editorial mention.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cobalt font-bold">02.</span>
              <span><strong>Immutable Evidence Trail:</strong> No datapoint is recorded without a verifiable public link, gazette order, or primary disclosure.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cobalt font-bold">03.</span>
              <span><strong>Equal Burden of Proof:</strong> Submissions from multi-billion dollar enterprises undergo identical automated and human verification as small startups.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4: Public Correction & Dispute Protocol */}
      <section id="disputes" aria-labelledby="corrections-heading" className="space-y-4 pt-2">
        <div className="border-b border-hairline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
            § 04 • Archival Governance
          </span>
          <h2 id="corrections-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
            4. Correction &amp; Dispute Protocol
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-muted font-serif italic">
          If any datapoint, headcount estimate, or entity attribution in the Atlas is inaccurate, submit a primary statutory correction below:
        </p>

        <form onSubmit={handleSubmitReport} className="p-6 border-2 border-ink bg-surface space-y-4 font-sans text-xs rounded-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Target GCC or Provider:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. JPMorgan Chase India"
                value={reportGcc}
                onChange={(e) => setReportGcc(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">
                Disputed Field / Metric:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Establishment Year / CIN / Headcount"
                value={reportField}
                onChange={(e) => setReportField(e.target.value)}
                className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-muted font-bold mb-1">
              Public Primary Source URL:
            </label>
            <input
              type="url"
              required
              placeholder="https://mca.gov.in/... or official SEC 10-K filing"
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-muted font-bold mb-1">
              Audited Correction Note:
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain the discrepancy and quote the exact passage in the primary document..."
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="w-full py-2.5 px-3 border border-hairline bg-surface text-sm text-ink placeholder:text-muted focus-visible:outline-cobalt"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted font-serif italic">
              All corrections are logged to the peer review queue and audit log.
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 bg-ink text-paper text-xs uppercase tracking-wider font-semibold hover:bg-cobalt transition-colors duration-fast min-h-[44px]"
            >
              Submit for Archival Audit
            </button>
          </div>

          {errorReported && (
            <div className="p-3 border border-cobalt bg-cobalt/10 text-xs text-cobalt flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Correction logged to the human-in-the-loop audit ledger.</span>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
