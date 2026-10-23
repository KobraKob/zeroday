import { Source } from "../schema";
import { loadSources } from "./dataLoader";
import { getDb, schema } from "../db/client";

export interface SourceWithStatus extends Source {
  status?: "active" | "dead" | "unverified";
  last_checked_at?: string;
}

let sourcesStore: SourceWithStatus[] | null = null;

function getStore(): SourceWithStatus[] {
  if (!sourcesStore) {
    const raw = loadSources();
    sourcesStore = raw.map((s) => ({
      ...s,
      status: "active",
      last_checked_at: s.retrieved_at,
    }));
  }
  return sourcesStore;
}

export const sourcesRepo = {
  getAll(): Source[] {
    return getStore();
  },

  getById(id: string): Source | undefined {
    return getStore().find((s) => s.id === id);
  },

  getByIds(ids: string[]): Source[] {
    const idSet = new Set(ids);
    return getStore().filter((s) => idSet.has(s.id));
  },

  updateStatus(id: string, status: "active" | "dead" | "unverified", lastCheckedAt?: string): boolean {
    const source = getStore().find((s) => s.id === id);
    if (!source) return false;

    source.status = status;
    source.last_checked_at = lastCheckedAt || new Date().toISOString();

    const database = getDb();
    if (database) {
      try {
        database
          .update(schema.sources)
          .set({
            status,
            last_checked_at: new Date(source.last_checked_at),
          })
          .catch(() => {});
      } catch {
        // ignore
      }
    }

    return true;
  },
};
