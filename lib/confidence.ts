import { Claim, Source, Gcc, CountDefinition } from "./schema";

export type ConfidenceGrade = "A" | "B" | "C" | "D";

export type RecomputedGrade = {
  effectiveGrade: "A" | "B" | "C" | "D";
  originalGrade: "A" | "B" | "C" | "D";
  downgradedDueToAge: boolean;
  cappedDueToSinglePress: boolean;
  hasConflict: boolean;
  conflictingClaimIds: string[];
  reasons: string[];
};

const GRADE_ORDER: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

function downgradeOneLevel(grade: "A" | "B" | "C" | "D"): "A" | "B" | "C" | "D" {
  const idx = GRADE_ORDER.indexOf(grade);
  if (idx < GRADE_ORDER.length - 1) {
    return GRADE_ORDER[idx + 1];
  }
  return "D";
}

export function evaluateClaimConfidence(
  claim: Claim,
  source?: Source,
  allClaimsForSubject: Claim[] = []
): RecomputedGrade {
  let grade: "A" | "B" | "C" | "D" = claim.confidence;
  const reasons: string[] = [];
  let downgradedDueToAge = false;
  let cappedDueToSinglePress = false;
  let hasConflict = false;
  const conflictingClaimIds: string[] = [];

  // Check age: source older than 24 months (730 days)
  if (source?.published_at || claim.as_of) {
    const referenceDateStr = source?.published_at || claim.as_of;
    const refDate = new Date(referenceDateStr);
    const now = new Date("2026-10-21T00:00:00Z"); // current anchor date
    const diffMonths = (now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
    
    if (diffMonths > 24) {
      grade = downgradeOneLevel(grade);
      downgradedDueToAge = true;
      reasons.push("Source is older than 24 months (downgraded 1 grade level)");
    }
  }

  // Check single press source cap
  if (source?.type === "press") {
    // Check if there are other sources confirming this same field
    const otherClaimsSameField = allClaimsForSubject.filter(
      (c) => c.id !== claim.id && c.field === claim.field
    );
    if (otherClaimsSameField.length === 0) {
      if (grade === "A" || grade === "B") {
        grade = "C";
        cappedDueToSinglePress = true;
        reasons.push("Single secondary press source (capped at grade C)");
      }
    }
  }

  // Check conflicting claims on the same field
  const conflictingClaims = allClaimsForSubject.filter(
    (c) =>
      c.id !== claim.id &&
      c.field === claim.field &&
      JSON.stringify(c.value) !== JSON.stringify(claim.value)
  );

  if (conflictingClaims.length > 0) {
    hasConflict = true;
    conflictingClaims.forEach((c) => conflictingClaimIds.push(c.id));
    reasons.push(`Conflicting claim found on field '${claim.field}'`);
  }

  return {
    effectiveGrade: grade,
    originalGrade: claim.confidence,
    downgradedDueToAge,
    cappedDueToSinglePress,
    hasConflict,
    conflictingClaimIds,
    reasons,
  };
}

/**
 * Computes coverage:
 * Entities with at least 3 sourced fields / reported total published count (e.g. 2117 from Zinnov FY26)
 */
export function computeCoverage(
  gccs: Gcc[],
  claims: Claim[],
  reportedTotal: number = 2117
): {
  wellSourcedCount: number;
  totalRegistryCount: number;
  reportedTotal: number;
  coveragePercentage: number;
} {
  const claimsByGcc = new Map<string, Set<string>>();

  claims.forEach((c) => {
    if (c.subject_type === "gcc") {
      if (!claimsByGcc.has(c.subject_id)) {
        claimsByGcc.set(c.subject_id, new Set());
      }
      claimsByGcc.get(c.subject_id)!.add(c.field);
    }
  });

  let wellSourcedCount = 0;
  gccs.forEach((g) => {
    const fields = claimsByGcc.get(g.id);
    // Entity has at least 3 sourced fields
    if (fields && fields.size >= 3) {
      wellSourcedCount++;
    } else if (g.claim_ids.length >= 3) {
      wellSourcedCount++;
    }
  });

  const coveragePercentage = reportedTotal > 0
    ? Number(((wellSourcedCount / reportedTotal) * 100).toFixed(1))
    : 0;

  return {
    wellSourcedCount,
    totalRegistryCount: gccs.length,
    reportedTotal,
    coveragePercentage,
  };
}

/**
 * Recomputes registry count under different definition rules:
 * - 'parent_company': distinct parent corporate groups
 * - 'legal_entity': distinct registered India entities (using cin or india_entity_name or distinct entity fallback)
 * - 'centre_unit': sum of physical centre locations across cities (parent x city presence)
 */
export function recomputeCount(
  definitionUnit: "parent_company" | "legal_entity" | "centre_unit",
  gccs: Gcc[]
): {
  unit: "parent_company" | "legal_entity" | "centre_unit";
  count: number;
  explanation: string;
} {
  if (definitionUnit === "parent_company") {
    const distinctParents = new Set<string>();
    gccs.forEach((g) => {
      if (g.parent_name && g.parent_name.trim().length > 0) {
        distinctParents.add(g.parent_name.trim().toLowerCase());
      } else {
        distinctParents.add(g.name.trim().toLowerCase());
      }
    });
    return {
      unit: "parent_company",
      count: distinctParents.size,
      explanation: `Counts distinct parent multinational corporations (${distinctParents.size} unique parents across registry).`,
    };
  }

  if (definitionUnit === "legal_entity") {
    const distinctEntities = new Set<string>();
    gccs.forEach((g) => {
      if (g.cin && g.cin.trim().length > 0) {
        distinctEntities.add(g.cin.trim().toUpperCase());
      } else if (g.india_entity_name && g.india_entity_name.trim().length > 0) {
        distinctEntities.add(g.india_entity_name.trim().toLowerCase());
      } else {
        distinctEntities.add(`entity-${g.id}`);
      }
    });
    return {
      unit: "legal_entity",
      count: distinctEntities.size,
      explanation: `Counts distinct incorporated legal entities registered in India (${distinctEntities.size} legal entities).`,
    };
  }

  if (definitionUnit === "centre_unit") {
    // Centre units count each physical operational campus/city unit
    let totalUnits = 0;
    gccs.forEach((g) => {
      const cityCount = g.cities && g.cities.length > 0 ? g.cities.length : 1;
      totalUnits += cityCount;
    });
    return {
      unit: "centre_unit",
      count: totalUnits,
      explanation: `Counts distinct operational centre units across all campus city footprints (${totalUnits} physical centre units).`,
    };
  }

  return {
    unit: definitionUnit,
    count: gccs.length,
    explanation: "Default count based on primary registry records.",
  };
}
