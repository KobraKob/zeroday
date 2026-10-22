import { CountDefinition } from "../schema";
import { loadDefinitions } from "./dataLoader";

export const definitionsRepo = {
  getAll(): CountDefinition[] {
    return loadDefinitions();
  },

  getById(id: string): CountDefinition | undefined {
    return loadDefinitions().find((d) => d.id === id);
  },

  getByUnit(unit: CountDefinition["unit"]): CountDefinition | undefined {
    return loadDefinitions().find((d) => d.unit === unit);
  },
};
