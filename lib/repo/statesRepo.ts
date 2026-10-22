import { State } from "../schema";
import { loadStates } from "./dataLoader";

export const statesRepo = {
  getAll(): State[] {
    return loadStates();
  },

  getById(id: string): State | undefined {
    return loadStates().find((s) => s.id === id);
  },
};
