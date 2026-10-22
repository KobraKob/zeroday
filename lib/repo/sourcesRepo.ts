import { Source } from "../schema";
import { loadSources } from "./dataLoader";

export const sourcesRepo = {
  getAll(): Source[] {
    return loadSources();
  },

  getById(id: string): Source | undefined {
    return loadSources().find((s) => s.id === id);
  },

  getByIds(ids: string[]): Source[] {
    const idSet = new Set(ids);
    return loadSources().filter((s) => idSet.has(s.id));
  },
};
