import { Claim } from "../schema";
import { loadClaims } from "./dataLoader";
import { getDb, schema } from "../db/client";

export interface ClaimHistoryEntry extends Claim {
  valid_from?: string;
  valid_to?: string | null;
  last_checked_at?: string;
  created_by?: "human" | "ai" | "import";
  status: "pending" | "approved" | "superseded" | "rejected" | "unverified";
}

// In-memory synchronized store
let claimsStore: ClaimHistoryEntry[] | null = null;

function getStore(): ClaimHistoryEntry[] {
  if (!claimsStore) {
    const raw = loadClaims();
    claimsStore = raw.map((c) => ({
      ...c,
      status: (c.status === "pending_review" ? "pending" : (c.status as any)) || "approved",
      valid_from: c.as_of ? `${c.as_of}-01T00:00:00Z` : new Date().toISOString(),
      valid_to: null,
      last_checked_at: new Date().toISOString(),
      created_by: "import",
    }));
  }
  return claimsStore;
}

export const claimsRepo = {
  /**
   * Public read: Only approved claims are served publicly.
   */
  getAll(): Claim[] {
    return getStore().filter((c) => c.status === "approved" || c.status === ("verified" as any));
  },

  /**
   * Read all claims including pending, superseded, and rejected (for admin audit).
   */
  getAllWithHistory(): ClaimHistoryEntry[] {
    return [...getStore()];
  },

  getById(id: string): Claim | undefined {
    return getStore().find((c) => c.id === id);
  },

  getByIds(ids: string[]): Claim[] {
    const idSet = new Set(ids);
    return this.getAll().filter((c) => idSet.has(c.id));
  },

  getBySubject(subjectType: Claim["subject_type"], subjectId: string): Claim[] {
    return this.getAll().filter(
      (c) => c.subject_type === subjectType && c.subject_id === subjectId
    );
  },

  searchClaims(query: string): Claim[] {
    const q = query.toLowerCase().trim();
    return this.getAll().filter(
      (c) =>
        c.field.toLowerCase().includes(q) ||
        String(c.value).toLowerCase().includes(q) ||
        (c.note && c.note.toLowerCase().includes(q))
    );
  },

  /**
   * Append-only Claim Supersession:
   * Closes the old row by setting valid_to and status = 'superseded'.
   * Inserts the new row with valid_from = now(), valid_to = null, and status = 'approved'.
   */
  supersedeClaim(
    oldClaimId: string,
    update: {
      value: any;
      source_id?: string;
      confidence?: Claim["confidence"];
      exact_quote?: string;
      note?: string;
      as_of?: string;
      created_by?: "human" | "ai" | "import";
    }
  ): { oldClaim: ClaimHistoryEntry; newClaim: ClaimHistoryEntry } {
    const store = getStore();
    const oldIndex = store.findIndex((c) => c.id === oldClaimId);
    if (oldIndex === -1) {
      throw new Error(`Cannot supersede claim: Claim ${oldClaimId} not found`);
    }

    const nowIso = new Date().toISOString();
    const oldClaim = store[oldIndex];

    // 1. Close the old row
    oldClaim.valid_to = nowIso;
    oldClaim.status = "superseded";

    // 2. Insert new row
    const newClaim: ClaimHistoryEntry = {
      ...oldClaim,
      id: `clm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      value: update.value,
      source_id: update.source_id || oldClaim.source_id,
      confidence: update.confidence || oldClaim.confidence,
      exact_quote: update.exact_quote || oldClaim.exact_quote,
      note: update.note || oldClaim.note,
      as_of: update.as_of || nowIso.slice(0, 10),
      status: "approved",
      valid_from: nowIso,
      valid_to: null,
      last_checked_at: nowIso,
      created_by: update.created_by || "human",
    };

    store.push(newClaim);

    // Sync with Postgres if available
    const database = getDb();
    if (database) {
      try {
        database
          .update(schema.claims)
          .set({ valid_to: new Date(nowIso), status: "superseded" })
          .catch(() => {});

        database
          .insert(schema.claims)
          .values({
            id: newClaim.id,
            subject_type: newClaim.subject_type,
            subject_id: newClaim.subject_id,
            field: newClaim.field,
            value: newClaim.value,
            unit: newClaim.unit || null,
            as_of: newClaim.as_of,
            source_id: newClaim.source_id,
            confidence: newClaim.confidence,
            status: "approved",
            valid_from: new Date(nowIso),
            valid_to: null,
            last_checked_at: new Date(nowIso),
            created_by: newClaim.created_by || "human",
            exact_quote: newClaim.exact_quote || null,
            note: newClaim.note || null,
          })
          .catch(() => {});
      } catch {
        // ignore
      }
    }

    return { oldClaim, newClaim };
  },

  /**
   * Returns complete history for a given subject and field, ordered from newest to oldest.
   */
  getHistory(subjectType: Claim["subject_type"], subjectId: string, field: string): ClaimHistoryEntry[] {
    return getStore()
      .filter((c) => c.subject_type === subjectType && c.subject_id === subjectId && c.field === field)
      .sort((a, b) => new Date(b.valid_from || 0).getTime() - new Date(a.valid_from || 0).getTime());
  },

  /**
   * Updates confidence for staleness or dead source downgrades.
   */
  updateConfidence(claimId: string, newConfidence: Claim["confidence"], noteAddition?: string): boolean {
    const claim = getStore().find((c) => c.id === claimId);
    if (!claim) return false;

    claim.confidence = newConfidence;
    claim.last_checked_at = new Date().toISOString();
    if (noteAddition) {
      claim.note = claim.note ? `${claim.note} | ${noteAddition}` : noteAddition;
    }

    const database = getDb();
    if (database) {
      try {
        database
          .update(schema.claims)
          .set({
            confidence: newConfidence,
            last_checked_at: new Date(),
            note: claim.note,
          })
          .catch(() => {});
      } catch {
        // ignore
      }
    }

    return true;
  },

  /**
   * Inserts a new claim (e.g. from human or AI extraction).
   */
  createClaim(claim: Omit<ClaimHistoryEntry, "valid_from" | "valid_to">): ClaimHistoryEntry {
    const store = getStore();
    const entry: ClaimHistoryEntry = {
      ...claim,
      valid_from: new Date().toISOString(),
      valid_to: null,
      last_checked_at: new Date().toISOString(),
      status: claim.status || "approved",
    };
    store.push(entry);
    return entry;
  },
};
