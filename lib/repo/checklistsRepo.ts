import { Checklist } from "../schema";
import { loadChecklists } from "./dataLoader";

export const checklistsRepo = {
  getAll(): Checklist[] {
    return loadChecklists();
  },

  getByStage(stage: string): Checklist | undefined {
    return loadChecklists().find((c) => c.stage === stage);
  },
};
