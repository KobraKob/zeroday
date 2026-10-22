import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Claim, ClaimSchema } from "../../lib/schema";

export interface ClaimProposal {
  claim: Claim;
  exact_quote: string;
  source_id: string;
  as_of: string;
}

export function extractClaimsFromDocument(
  sourceId: string,
  documentText: string,
  modelName: string = "claude-3-5-sonnet"
): { accepted: ClaimProposal[]; rejected: Array<{ proposal: any; reason: string }> } {
  const accepted: ClaimProposal[] = [];
  const rejected: Array<{ proposal: any; reason: string }> = [];

  // Simulated extraction patterns for document parsing
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
  ];

  for (const p of patterns) {
    const match = documentText.match(p.regex);
    if (match) {
      const exactQuote = match[0];

      // Verbatim string check requirement
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
          as_of: "2026-10-21",
          source_id: sourceId,
          confidence: "C", // AI extracted claims are capped at C
          status: "pending_review",
          exact_quote: exactQuote,
        },
        exact_quote: exactQuote,
        source_id: sourceId,
        as_of: "2026-10-21",
      };

      accepted.push(proposal);
    }
  }

  // Log to /data/ai-log.jsonl
  const inputHash = crypto.createHash("sha256").update(documentText).digest("hex");
  const logEntry = {
    timestamp: new Date().toISOString(),
    input_hash: inputHash,
    model: modelName,
    source_id: sourceId,
    accepted_count: accepted.length,
    rejected_count: rejected.length,
  };

  const logPath = path.resolve(__dirname, "../../data/ai-log.jsonl");
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n");

  return { accepted, rejected };
}
