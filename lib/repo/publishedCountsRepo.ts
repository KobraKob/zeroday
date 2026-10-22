import { PublishedCount } from "../schema";
import { loadPublishedCounts } from "./dataLoader";

export const publishedCountsRepo = {
  getAll(): PublishedCount[] {
    return loadPublishedCounts();
  },

  getById(id: string): PublishedCount | undefined {
    return loadPublishedCounts().find((p) => p.id === id);
  },
};
