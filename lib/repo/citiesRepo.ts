import { City } from "../schema";
import { loadCities } from "./dataLoader";

export const citiesRepo = {
  getAll(): City[] {
    return loadCities();
  },

  getById(id: string): City | undefined {
    return loadCities().find((c) => c.id === id);
  },

  getByIds(ids: string[]): City[] {
    const idSet = new Set(ids);
    return loadCities().filter((c) => idSet.has(c.id));
  },
};
