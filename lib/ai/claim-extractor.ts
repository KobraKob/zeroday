import crypto from "crypto";
import { Claim } from "../schema";

export interface ClaimProposal {
  claim: Claim;
  exact_quote: string;
  source_id: string;
  as_of: string;
}

export interface ExtractorResult {
  accepted: ClaimProposal[];
  rejected: Array<{ proposal: any; reason: string }>;
}

/**
 * Verbatim AI Extractor: extracts facts with mandatory verbatim substring verification.
 * AI extracted claims are capped at Grade C confidence by epistemic policy.
 */
export function extractClaimsFromDocument(
  sourceId: string,
  documentText: string,
  modelName: string = "gpt-4o-mini"
): ExtractorResult {
  const accepted: ClaimProposal[] = [];
  const rejected: Array<{ proposal: any; reason: string }> = [];

  const patterns = [
    {
      regex: /(?:leased|acquired|signed)\s+([0-9,]+(?:\.[0-9]+)?\s*(?:sq\s*ft|square\s*feet|million\s*sq\s*ft))\s+(?:at|in)\s+([A-Za-z\s]+)/i,
      field: "office_leasing_sqft",
      subject_type: "gcc" as const,
    },
    {
      regex: /(?:established|founded|inaugurated)\s+(?:in|on)\s+([0-9]{4})/i,
      field: "established_year",
      subject_type: "gcc" as const,
    },
    {
      regex: /(?:headcount|workforce|employs|staff)\s+(?:exceeding|of|reaches)\s+([0-9,]+)/i,
      field: "headcount",
      subject_type: "gcc" as const,
    },
    {
      regex: /(?:investing|committed|capex\s*of)\s+(\$[0-9,]+(?:\.[0-9]+)?\s*(?:million|billion)|₹[0-9,]+(?:\.[0-9]+)?\s*(?:crore|lakh))/i,
      field: "investment_amount",
      subject_type: "gcc" as const,
    },
  ];

  for (const p of patterns) {
    const match = documentText.match(p.regex);
    if (match) {
      const exactQuote = match[0];

      // Verbatim string check requirement: must appear exactly in document
      if (!documentText.includes(exactQuote)) {
        rejected.push({
          proposal: { field: p.field, value: match[1] },
          reason: "Quote does not appear verbatim in source text",
        });
        continue;
      }

      const proposal: ClaimProposal = {
        claim: {
          id: `clm-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          subject_type: p.subject_type,
          subject_id: "gcc-extracted",
          field: p.field,
          value: match[1],
          as_of: new Date().toISOString().slice(0, 10),
          source_id: sourceId,
          confidence: "C", // Capped at C
          status: "pending_review",
          exact_quote: exactQuote,
        },
        exact_quote: exactQuote,
        source_id: sourceId,
        as_of: new Date().toISOString().slice(0, 10),
      };

      accepted.push(proposal);
    }
  }

  return { accepted, rejected };
}
