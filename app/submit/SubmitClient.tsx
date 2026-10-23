"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Provider } from "../../lib/schema";
import { SubmittedAttestation } from "../../lib/repo/reviewsRepo";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface SubmitClientProps {
  providers: Provider[];
  initialAttestations: SubmittedAttestation[];
}

const SERVICE_CATEGORIES = [
  { value: "real_estate", label: "Real estate & workplace" },
  { value: "advisory", label: "Management advisory" },
  { value: "legal", label: "Corporate legal" },
  { value: "audit", label: "Audit & tax assurance" },
  { value: "bot", label: "Build–operate–transfer (BOT)" },
  { value: "recruitment", label: "Executive search" },
  { value: "payroll_eor", label: "Payroll & employer of record" },
  { value: "other", label: "Other specialist service" },
];

const CURRENT_YEAR = new Date().getFullYear();

function categoryLabel(value: string): string {
  return SERVICE_CATEGORIES.find((category) => category.value === value)?.label || value.replace(/_/g, " ");
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function SubmitClient({ providers, initialAttestations }: SubmitClientProps) {
  const [attestations, setAttestations] = useState<SubmittedAttestation[]>(initialAttestations);
  const [providerId, setProviderId] = useState("");
  const [gccName, setGccName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [attesterName, setAttesterName] = useState("");
  const [attesterRole, setAttesterRole] = useState("");
  const [attesterEmail, setAttesterEmail] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [projectSummary, setProjectSummary] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<SubmittedAttestation | null>(null);
  const [sessionPreviewIds, setSessionPreviewIds] = useState<string[]>([]);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === providerId),
    [providers, providerId]
  );

  const fieldCompletion = [
    providerId.trim().length > 0,
    gccName.trim().length > 0,
    serviceCategory.trim().length > 0,
    year.trim().length > 0 && Number(year) >= 2015 && Number(year) <= CURRENT_YEAR,
    attesterName.trim().length > 0,
    attesterRole.trim().length > 0,
    validEmail(attesterEmail),
    projectSummary.trim().length >= 24,
  ];
  const completedFields = fieldCompletion.filter(Boolean).length;
  const completionPercent = Math.round((completedFields / fieldCompletion.length) * 100);

  const engagementComplete = fieldCompletion[0] && fieldCompletion[1] && fieldCompletion[2] && fieldCompletion[3];
  const attesterComplete = fieldCompletion[4] && fieldCompletion[5] && fieldCompletion[6];
  const scopeComplete = fieldCompletion[7];

  const fieldErrors = {
    providerId: attemptedSubmit && !providerId ? "Choose the provider involved in this engagement." : "",
    gccName: attemptedSubmit && !gccName.trim() ? "Enter the GCC or client organisation." : "",
    serviceCategory: attemptedSubmit && !serviceCategory ? "Choose the service delivered." : "",
    year: attemptedSubmit && (!year || Number(year) < 2015 || Number(year) > CURRENT_YEAR) ? "Enter a year between 2015 and " + CURRENT_YEAR + "." : "",
    attesterName: attemptedSubmit && !attesterName.trim() ? "Enter your full name." : "",
    attesterRole: attemptedSubmit && !attesterRole.trim() ? "Add your role at the client organisation." : "",
    attesterEmail: attemptedSubmit && !attesterEmail.trim()
      ? "Enter your work email."
      : attemptedSubmit && !validEmail(attesterEmail)
        ? "Enter a valid email address."
        : "",
    projectSummary: attemptedSubmit && projectSummary.trim().length < 24
      ? "Add at least 24 characters describing the scope or outcome."
      : "",
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttemptedSubmit(true);

    const form = event.currentTarget;
    const hasInvalidValue =
      !providerId ||
      !selectedProvider ||
      !gccName.trim() ||
      !serviceCategory ||
      !year ||
      Number(year) < 2015 ||
      Number(year) > CURRENT_YEAR ||
      !attesterName.trim() ||
      !attesterRole.trim() ||
      !validEmail(attesterEmail) ||
      projectSummary.trim().length < 24;

    if (hasInvalidValue) {
      const firstInvalidId =
        !providerId || !selectedProvider ? "attest-provider" :
        !gccName.trim() ? "attest-gcc" :
        !serviceCategory ? "attest-service" :
        !year || Number(year) < 2015 || Number(year) > CURRENT_YEAR ? "attest-year" :
        !attesterName.trim() ? "attest-name" :
        !attesterRole.trim() ? "attest-role" :
        !validEmail(attesterEmail) ? "attest-email" :
        "attest-summary";
      document.getElementById(firstInvalidId)?.focus();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const newAttestation: SubmittedAttestation = {
      id: "attest-session-" + Date.now(),
      provider_id: providerId,
      gcc_name: gccName.trim(),
      service_category: serviceCategory,
      attester_name: attesterName.trim(),
      attester_role: attesterRole.trim(),
      attester_email: attesterEmail.trim(),
      year: Number(year),
      project_summary: projectSummary.trim(),
      submitted_at: new Date().toISOString(),
      status: "pending_verification",
    };

    setAttestations((previous) => [newAttestation, ...previous]);
    setSessionPreviewIds((previous) => [newAttestation.id, ...previous]);
    setSubmittedItem(newAttestation);
    setAttemptedSubmit(false);
    setProviderId("");
    setGccName("");
    setServiceCategory("");
    setAttesterName("");
    setAttesterRole("");
    setAttesterEmail("");
    setYear(String(CURRENT_YEAR));
    setProjectSummary("");
  };

  useEffect(() => {
    if (!submittedItem) return;
    document.getElementById("attest-result")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest",
    });
  }, [submittedItem]);

  const clearPreparedPreview = () => setSubmittedItem(null);

  return (
    <div className="attest-page">
      <header className="attest-hero">
        <div className="attest-hero-copy">
          <div className="attest-kicker">
            <span className="attest-kicker-mark" aria-hidden="true"><CircleDot size={12} /></span>
            <span>ZeroDay / Trust infrastructure</span>
            <span className="attest-kicker-index">INTAKE 03.01</span>
          </div>
          <h1>Make the work<br /><em>verifiable.</em></h1>
          <p className="attest-hero-description">
            Record a real client engagement. We separate a provider’s claims from evidence supplied by the people who worked with them.
          </p>
          <div className="attest-hero-points">
            <span><ShieldCheck size={15} /> Evidence before reputation</span>
            <span><Fingerprint size={15} /> Identity reviewed separately</span>
            <span><FileCheck2 size={15} /> No public listing without review</span>
          </div>
        </div>

        <div className="attest-journey" aria-label="Attestation review journey">
          <div className="attest-journey-top">
            <div>
              <span className="attest-overline">How the record moves</span>
              <h2>From engagement to evidence.</h2>
            </div>
            <span className="attest-journey-stamp">REVIEW PATH / 01</span>
          </div>
          <div className="attest-journey-track">
            <div className="attest-journey-rule" aria-hidden="true"><span style={{ height: completionPercent + "%" }} /></div>
            <div className={"attest-journey-step" + (engagementComplete ? " is-complete" : " is-current")}>
              <span className="attest-journey-node">{engagementComplete ? <Check size={14} /> : "01"}</span>
              <div><strong>Engagement</strong><small>Client · provider · service</small></div>
            </div>
            <div className={"attest-journey-step" + (attesterComplete ? " is-complete" : engagementComplete ? " is-current" : "")}>
              <span className="attest-journey-node">{attesterComplete ? <Check size={14} /> : "02"}</span>
              <div><strong>Identity</strong><small>Role and contact details</small></div>
            </div>
            <div className={"attest-journey-step" + (scopeComplete ? " is-complete" : attesterComplete ? " is-current" : "")}>
              <span className="attest-journey-node">{scopeComplete ? <Check size={14} /> : "03"}</span>
              <div><strong>Evidence review</strong><small>Scope and deliverables</small></div>
            </div>
          </div>
          <div className="attest-journey-foot">
            <span><span className="attest-live-dot" /> Draft progress updates as you type</span>
            <span>{completedFields} / {fieldCompletion.length} details complete</span>
          </div>
        </div>
      </header>

      <div className="attest-metrics" aria-label="Attestation intake facts">
        <div className="attest-metric">
          <span className="attest-metric-label">Provider index</span>
          <strong>{providers.length.toLocaleString("en-IN")}</strong>
          <small>firms currently listed</small>
        </div>
        <div className="attest-metric">
          <span className="attest-metric-label">Supported services</span>
          <strong>{SERVICE_CATEGORIES.length.toString().padStart(2, "0")}</strong>
          <small>engagement categories</small>
        </div>
        <div className="attest-metric attest-metric-note">
          <span className="attest-metric-label">Evidence rule</span>
          <strong>Review first.</strong>
          <small>Prepared records do not affect scores or public rankings.</small>
        </div>
      </div>

      {submittedItem && (
        <section id="attest-result" className="attest-result" aria-live="polite" aria-labelledby="attest-result-title">
          <div className="attest-result-icon"><CheckCircle2 size={22} /></div>
          <div className="attest-result-copy">
            <span className="attest-overline">Session preview created</span>
            <h2 id="attest-result-title">Your engagement record is prepared.</h2>
            <p>
              {submittedItem.gcc_name} → {selectedProvider?.name || providers.find((provider) => provider.id === submittedItem.provider_id)?.name || "Selected provider"} · {submittedItem.year}
            </p>
            <small>This preview exists only in the current page session. Server-side storage and email-domain verification are not connected in this build.</small>
          </div>
          <button type="button" className="attest-result-dismiss" onClick={clearPreparedPreview} aria-label="Dismiss prepared record message">×</button>
        </section>
      )}

      <div className="attest-workspace">
        <section className="attest-form-panel" aria-labelledby="attest-form-title">
          <div className="attest-form-head">
            <div>
              <span className="attest-overline">New engagement record / 01</span>
              <h2 id="attest-form-title">Tell us what happened.</h2>
              <p>Complete the three sections. Be specific enough that another reviewer could understand the work.</p>
            </div>
            <div className="attest-form-id"><span>RECORD</span><strong>ZD–A</strong></div>
          </div>

          <form onSubmit={handleSubmit} onInvalidCapture={() => setAttemptedSubmit(true)} className="attest-form">
            <fieldset className="attest-form-section">
              <legend><span className="attest-section-number">01</span><span>Engagement details</span></legend>
              <p className="attest-section-description">Connect one client organisation to the firm that delivered the service.</p>

              <div className="attest-field-grid">
                <div className="attest-field attest-field-full">
                  <label htmlFor="attest-provider">Service provider <span className="attest-required">Required</span></label>
                  <div className="attest-input-wrap">
                    <Building2 size={16} aria-hidden="true" />
                    <select id="attest-provider" required value={providerId} onChange={(event) => setProviderId(event.target.value)} aria-invalid={Boolean(fieldErrors.providerId)} aria-describedby={fieldErrors.providerId ? "attest-provider-error" : "attest-provider-help"}>
                      <option value="">Choose a listed provider</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                    <ChevronRight size={15} aria-hidden="true" />
                  </div>
                  {fieldErrors.providerId ? <small id="attest-provider-error" className="attest-field-error">{fieldErrors.providerId}</small> : <small id="attest-provider-help" className="attest-field-help">Select the firm directly involved in this engagement.</small>}
                </div>

                <div className="attest-field">
                  <label htmlFor="attest-gcc">Client organisation <span className="attest-required">Required</span></label>
                  <input id="attest-gcc" type="text" required maxLength={160} value={gccName} onChange={(event) => setGccName(event.target.value)} aria-invalid={Boolean(fieldErrors.gccName)} aria-describedby={fieldErrors.gccName ? "attest-gcc-error" : undefined} placeholder="Legal or recognised organisation name" />
                  {fieldErrors.gccName && <small id="attest-gcc-error" className="attest-field-error">{fieldErrors.gccName}</small>}
                </div>

                <div className="attest-field">
                  <label htmlFor="attest-service">Service delivered <span className="attest-required">Required</span></label>
                  <div className="attest-input-wrap">
                    <select id="attest-service" required value={serviceCategory} onChange={(event) => setServiceCategory(event.target.value)} aria-invalid={Boolean(fieldErrors.serviceCategory)} aria-describedby={fieldErrors.serviceCategory ? "attest-service-error" : undefined}>
                      <option value="">Choose service type</option>
                      {SERVICE_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                    <ChevronRight size={15} aria-hidden="true" />
                  </div>
                  {fieldErrors.serviceCategory && <small id="attest-service-error" className="attest-field-error">{fieldErrors.serviceCategory}</small>}
                </div>

                <div className="attest-field attest-field-year">
                  <label htmlFor="attest-year">Engagement year <span className="attest-required">Required</span></label>
                  <input id="attest-year" type="number" inputMode="numeric" min="2015" max={CURRENT_YEAR} required value={year} onChange={(event) => setYear(event.target.value)} aria-invalid={Boolean(fieldErrors.year)} aria-describedby={fieldErrors.year ? "attest-year-error" : undefined} />
                  {fieldErrors.year && <small id="attest-year-error" className="attest-field-error">{fieldErrors.year}</small>}
                </div>
              </div>
            </fieldset>

            <fieldset className="attest-form-section">
              <legend><span className="attest-section-number">02</span><span>Your authority</span></legend>
              <p className="attest-section-description">Identify yourself as someone with first-hand knowledge of the engagement.</p>

              <div className="attest-field-grid attest-field-grid-two">
                <div className="attest-field">
                  <label htmlFor="attest-name">Full name <span className="attest-required">Required</span></label>
                  <input id="attest-name" type="text" autoComplete="name" required maxLength={120} value={attesterName} onChange={(event) => setAttesterName(event.target.value)} aria-invalid={Boolean(fieldErrors.attesterName)} aria-describedby={fieldErrors.attesterName ? "attest-name-error" : undefined} placeholder="Name used in your professional role" />
                  {fieldErrors.attesterName && <small id="attest-name-error" className="attest-field-error">{fieldErrors.attesterName}</small>}
                </div>
                <div className="attest-field">
                  <label htmlFor="attest-role">Corporate role <span className="attest-required">Required</span></label>
                  <input id="attest-role" type="text" autoComplete="organization-title" required maxLength={120} value={attesterRole} onChange={(event) => setAttesterRole(event.target.value)} aria-invalid={Boolean(fieldErrors.attesterRole)} aria-describedby={fieldErrors.attesterRole ? "attest-role-error" : undefined} placeholder="Your role during the engagement" />
                  {fieldErrors.attesterRole && <small id="attest-role-error" className="attest-field-error">{fieldErrors.attesterRole}</small>}
                </div>
                <div className="attest-field attest-field-full">
                  <label htmlFor="attest-email">Work email <span className="attest-required">Required</span></label>
                  <div className="attest-input-wrap">
                    <Mail size={16} aria-hidden="true" />
                    <input id="attest-email" type="email" autoComplete="email" required maxLength={254} value={attesterEmail} onChange={(event) => setAttesterEmail(event.target.value)} aria-invalid={Boolean(fieldErrors.attesterEmail)} aria-describedby={fieldErrors.attesterEmail ? "attest-email-error" : "attest-email-help"} placeholder="name@organisation.com" />
                  </div>
                  {fieldErrors.attesterEmail ? <small id="attest-email-error" className="attest-field-error">{fieldErrors.attesterEmail}</small> : <small id="attest-email-help" className="attest-field-help">A work address is preferred. Domain verification is not automated yet.</small>}
                </div>
              </div>
            </fieldset>

            <fieldset className="attest-form-section attest-form-section-last">
              <legend><span className="attest-section-number">03</span><span>Scope and outcome</span></legend>
              <p className="attest-section-description">Give reviewers enough detail to distinguish a delivered engagement from a provider’s marketing claim.</p>

              <div className="attest-field">
                <label htmlFor="attest-summary">Engagement summary <span className="attest-required">Required</span></label>
                <textarea id="attest-summary" required minLength={24} maxLength={1200} rows={5} value={projectSummary} onChange={(event) => setProjectSummary(event.target.value)} aria-invalid={Boolean(fieldErrors.projectSummary)} aria-describedby={fieldErrors.projectSummary ? "attest-summary-error" : "attest-summary-help"} placeholder="Describe the service delivered, the work you observed, and the result that can be shared publicly." />
                <div className="attest-summary-footer">
                  {fieldErrors.projectSummary ? <small id="attest-summary-error" className="attest-field-error">{fieldErrors.projectSummary}</small> : <small id="attest-summary-help" className="attest-field-help">Do not include confidential, personal, or commercially sensitive information.</small>}
                  <span className={projectSummary.length > 1080 ? "is-near-limit" : ""}>{projectSummary.length.toLocaleString("en-IN")} / 1,200</span>
                </div>
              </div>
            </fieldset>

            <div className="attest-submit-footer">
              <div className="attest-submit-assurance">
                <LockKeyhole size={17} aria-hidden="true" />
                <div><strong>Review before publication</strong><small>Preparing a record does not verify it or change provider scores.</small></div>
              </div>
              <button type="submit" className="attest-submit-button">
                <span>Prepare record</span><ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="attest-session-notice"><AlertCircle size={14} aria-hidden="true" /> This form currently creates a session-only preview. Durable submission and email verification are not connected.</p>
          </form>
        </section>

        <aside className="attest-side-rail" aria-label="Live record preview and guidance">
          <section className="attest-preview-card" aria-labelledby="attest-preview-title">
            <div className="attest-preview-top">
              <div><span className="attest-overline">Live intake preview</span><h2 id="attest-preview-title">Evidence record</h2></div>
              <span className={"attest-preview-state" + (completionPercent === 100 ? " is-ready" : "")}><span />{completionPercent === 100 ? "Complete" : "Draft"}</span>
            </div>

            <div className="attest-completion">
              <div className="attest-ring" role="img" aria-label={completionPercent + " percent of required details complete"}>
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="42" />
                  <circle className="attest-ring-progress" cx="50" cy="50" r="42" pathLength="100" strokeDasharray={completionPercent + " 100"} />
                </svg>
                <div><strong>{completionPercent}%</strong><small>complete</small></div>
              </div>
              <div className="attest-completion-copy">
                <strong>{completedFields === fieldCompletion.length ? "Ready for review prep" : "Build the record"}</strong>
                <p>{completedFields} of {fieldCompletion.length} details completed. Required fields are tracked as you work.</p>
              </div>
            </div>

            <div className="attest-preview-divider" />
            <div className="attest-preview-record">
              <div className="attest-record-pair"><span>CLIENT / GCC</span><strong>{gccName.trim() || "Not added yet"}</strong></div>
              <div className="attest-record-arrow" aria-hidden="true"><ArrowDownRight size={17} /></div>
              <div className="attest-record-pair"><span>SERVICE PROVIDER</span><strong>{selectedProvider?.name || "Choose a listed provider"}</strong></div>
              <div className="attest-record-meta">
                <span>{serviceCategory ? categoryLabel(serviceCategory) : "Service not selected"}</span>
                <span>{year || "Year not set"}</span>
              </div>
              <div className="attest-record-summary">
                <span>ENGAGEMENT NOTE</span>
                <p>{projectSummary.trim() || "Your summary will appear here as you describe the engagement."}</p>
              </div>
            </div>

            {selectedProvider && (
              <div className="attest-provider-footprint">
                <div className="attest-footprint-head"><span><MapPin size={14} /> Listed provider footprint</span><strong>{selectedProvider.cities.length} {selectedProvider.cities.length === 1 ? "city" : "cities"}</strong></div>
                <div className="attest-city-chips">
                  {selectedProvider.cities.map((city) => <span key={city}>{city}</span>)}
                </div>
              </div>
            )}
          </section>

          <section className="attest-guidance-card" aria-labelledby="attest-guidance-title">
            <div className="attest-guidance-icon"><ShieldCheck size={18} /></div>
            <div className="attest-guidance-heading"><span className="attest-overline">Evidence standard</span><h2 id="attest-guidance-title">Specific beats impressive.</h2></div>
            <ul>
              <li><Check size={14} /><span>Describe work you directly observed.</span></li>
              <li><Check size={14} /><span>Use names and outcomes that can be checked.</span></li>
              <li><Check size={14} /><span>Leave confidential metrics and private information out.</span></li>
            </ul>
            <div className="attest-guidance-foot"><Clock3 size={14} /><span>Editorial review happens separately from this preview.</span></div>
          </section>
        </aside>
      </div>

      <section className="attest-ledger" aria-labelledby="attest-ledger-title">
        <div className="attest-ledger-heading">
          <div><span className="attest-overline">Record index</span><h2 id="attest-ledger-title">Attestations in the current view.</h2><p>Example records are labelled. New entries created here remain session previews.</p></div>
          <div className="attest-ledger-count"><strong>{attestations.length}</strong><span>records visible</span></div>
        </div>
        {attestations.length > 0 ? (
          <div className="attest-ledger-list">
            {attestations.map((attestation) => {
              const provider = providers.find((item) => item.id === attestation.provider_id);
              const isSessionPreview = sessionPreviewIds.includes(attestation.id);
              const isSeededExample = attestation.id.startsWith("attest-seed");
              return (
                <article key={attestation.id} className="attest-ledger-item">
                  <div className="attest-ledger-mark" aria-hidden="true">{isSessionPreview ? <Sparkles size={17} /> : isSeededExample ? <CircleDot size={17} /> : <FileCheck2 size={17} />}</div>
                  <div className="attest-ledger-main">
                    <div className="attest-ledger-meta">
                      <span className="attest-category-chip">{categoryLabel(attestation.service_category)}</span>
                      {isSessionPreview && <span className="attest-ledger-flag is-preview">Session preview</span>}
                      {isSeededExample && <span className="attest-ledger-flag">Sample record</span>}
                    </div>
                    <h3>{attestation.gcc_name}</h3>
                    <p>{provider?.name || attestation.provider_id} <span aria-hidden="true">·</span> {attestation.year}</p>
                    <blockquote>{attestation.project_summary}</blockquote>
                    <small>Prepared by {attestation.attester_name} · {formatDate(attestation.submitted_at)}</small>
                  </div>
                  <div className="attest-ledger-status">
                    <span className={"attest-status-dot" + (attestation.status === "verified" ? " is-verified" : "")} />
                    <span>{isSessionPreview ? "Local preview" : titleCase(attestation.status)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="attest-ledger-empty"><FileCheck2 size={20} /><strong>No records in this view yet.</strong><span>A record will appear here when a session preview is prepared.</span></div>
        )}
      </section>
    </div>
  );
}
