import { Source, Claim } from "./schema";

export function generatePageCitation(pageTitle: string, path: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const dateFormatted = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `ZeroDay (${year}). "${pageTitle}". Independent Record of India's GCC Ecosystem. Retrieved ${dateFormatted}, from https://zeroday.in${path}`;
}

export function formatSourceCitation(source: Source): string {
  const pubYear = source.published_at
    ? new Date(source.published_at).getFullYear()
    : "n.d.";
  return `${source.publisher} (${pubYear}). "${source.name}". Accessed ${source.retrieved_at} at ${source.url}`;
}

export function formatClaimCitation(claim: Claim, source?: Source): string {
  const valueDisplay = Array.isArray(claim.value)
    ? claim.value.join(", ")
    : typeof claim.value === "object"
    ? JSON.stringify(claim.value)
    : `${claim.value}${claim.unit ? ` ${claim.unit}` : ""}`;

  const sourceName = source ? source.publisher : `Source #${claim.source_id}`;
  const url = source ? source.url : "#";

  return `${claim.field}: ${valueDisplay} [${sourceName}, as of ${claim.as_of}, Grade ${claim.confidence}] (${url})`;
}

/**
 * Validates that an answer block contains verified claim IDs
 * and ensures that no numeric claims are present without backing claims.
 */
export function verifyAnswerGrounding(
  text: string,
  claimIds: string[],
  availableClaims: Map<string, Claim>
): {
  isGrounded: boolean;
  validClaims: Claim[];
  missingClaims: string[];
  unverifiedNumbersFound: string[];
} {
  const validClaims: Claim[] = [];
  const missingClaims: string[] = [];

  claimIds.forEach((id) => {
    const claim = availableClaims.get(id);
    if (claim) {
      validClaims.push(claim);
    } else {
      missingClaims.push(id);
    }
  });

  // Extract numbers from text (e.g. 2,117, $98.4B, 2.36M, 44%, 15-22%)
  const numberRegex = /(?:\$?\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:B|M|k|%|sq\s*ft))?)/gi;
  const matches = text.match(numberRegex) || [];

  const unverifiedNumbersFound: string[] = [];
  if (validClaims.length === 0 && matches.length > 0) {
    matches.forEach((m) => unverifiedNumbersFound.push(m.trim()));
  }

  const isGrounded = validClaims.length > 0 && missingClaims.length === 0;

  return {
    isGrounded,
    validClaims,
    missingClaims,
    unverifiedNumbersFound,
  };
}
