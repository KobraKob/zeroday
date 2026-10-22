import Fuse from "fuse.js";
import { Gcc } from "../schema";
import { loadGccs } from "./dataLoader";

export interface GccFilterOptions {
  city?: string;
  sector?: string;
  parentHqCountry?: string;
  headcountBand?: string;
  status?: string;
  hasCin?: boolean;
}

export const gccRepo = {
  getAll(): Gcc[] {
    return loadGccs();
  },

  getById(id: string): Gcc | undefined {
    return loadGccs().find((g) => g.id === id);
  },

  getBySlug(slug: string): Gcc | undefined {
    return loadGccs().find((g) => g.slug === slug);
  },

  search(query: string, filters: GccFilterOptions = {}): Gcc[] {
    let gccs = loadGccs();

    // Apply structured filters
    if (filters.city) {
      gccs = gccs.filter((g) => g.cities.includes(filters.city!));
    }
    if (filters.sector) {
      gccs = gccs.filter((g) => g.sector === filters.sector);
    }
    if (filters.parentHqCountry) {
      gccs = gccs.filter((g) => g.parent_hq_country === filters.parentHqCountry);
    }
    if (filters.headcountBand) {
      gccs = gccs.filter((g) => g.headcount_band === filters.headcountBand);
    }
    if (filters.status) {
      gccs = gccs.filter((g) => g.status === filters.status);
    }
    if (filters.hasCin !== undefined) {
      gccs = gccs.filter((g) => (filters.hasCin ? Boolean(g.cin) : !g.cin));
    }

    if (!query || query.trim() === "") {
      return gccs;
    }

    const fuse = new Fuse(gccs, {
      keys: ["name", "parent_name", "sector", "cities", "functions", "india_entity_name"],
      threshold: 0.35,
    });

    return fuse.search(query).map((res) => res.item);
  },
};
