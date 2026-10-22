import { Claim } from "../schema";
import { loadClaims } from "./dataLoader";

export const claimsRepo = {
  getAll(): Claim[] {
    return loadClaims();
  },

  getById(id: string): Claim | undefined {
    return loadClaims().find((c) => c.id === id);
  },

  getByIds(ids: string[]): Claim[] {
    const idSet = new Set(ids);
    return loadClaims().filter((c) => idSet.has(c.id));
  },

  getBySubject(subjectType: Claim["subject_type"], subjectId: string): Claim[] {
    return loadClaims().filter(
      (c) => c.subject_type === subjectType && c.subject_id === subjectId
    );
  },

  searchClaims(query: string): Claim[] {
    const q = query.toLowerCase().trim();
    return loadClaims().filter(
      (c) =>
        c.field.toLowerCase().includes(q) ||
        String(c.value).toLowerCase().includes(q) ||
        (c.note && c.note.toLowerCase().includes(q))
    );
  },
};
