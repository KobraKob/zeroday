import { ProofLink, Evidence } from "./schema";

export type ProviderEvidenceBreakdown = {
  score: number;
  totalLinks: number;
  activeLinks: number;
  disputedLinks: number;
  distinctGccCount: number;
  yearsRange: { min: number | null; max: number | null };
  evidenceCounts: {
    attestation: number;
    filing_or_lease: number;
    press: number;
    case_study: number;
  };
  formulaExplanation: string;
};

const KIND_WEIGHTS: Record<Evidence["kind"], number> = {
  attestation: 3,
  filing: 3,
  lease: 3,
  press: 2,
  case_study: 1,
};

export function computeProviderScore(proofLinks: ProofLink[]): ProviderEvidenceBreakdown {
  let score = 0;
  let activeLinks = 0;
  let disputedLinks = 0;
  const distinctGccs = new Set<string>();
  const years: number[] = [];
  const evidenceCounts = {
    attestation: 0,
    filing_or_lease: 0,
    press: 0,
    case_study: 0,
  };

  proofLinks.forEach((link) => {
    distinctGccs.add(link.gcc_id);
    if (link.year) {
      years.push(link.year);
    }

    if (link.status === "disputed") {
      disputedLinks++;
      return; // 0 weight for disputed
    }

    activeLinks++;

    // Compute max weight from evidence items in this link
    let linkMaxWeight = 0;
    link.evidence.forEach((ev) => {
      const weight = KIND_WEIGHTS[ev.kind] ?? 1;
      if (weight > linkMaxWeight) {
        linkMaxWeight = weight;
      }

      if (ev.kind === "attestation") {
        evidenceCounts.attestation++;
      } else if (ev.kind === "filing" || ev.kind === "lease") {
        evidenceCounts.filing_or_lease++;
      } else if (ev.kind === "press") {
        evidenceCounts.press++;
      } else if (ev.kind === "case_study") {
        evidenceCounts.case_study++;
      }
    });

    score += linkMaxWeight;
  });

  const minYear = years.length > 0 ? Math.min(...years) : null;
  const maxYear = years.length > 0 ? Math.max(...years) : null;

  return {
    score,
    totalLinks: proofLinks.length,
    activeLinks,
    disputedLinks,
    distinctGccCount: distinctGccs.size,
    yearsRange: { min: minYear, max: maxYear },
    evidenceCounts,
    formulaExplanation:
      "Score = Σ(ProofLinks × KindWeight). Attestation=3, Filing/Lease=3, Press=2, Case Study=1, Disputed=0.",
  };
}
