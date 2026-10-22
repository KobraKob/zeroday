import { Provider, ProviderCategorySchema } from "../schema";
import { loadProviders } from "./dataLoader";
import { z } from "zod";

type ProviderCategory = z.infer<typeof ProviderCategorySchema>;

export const providersRepo = {
  getAll(): Provider[] {
    return loadProviders();
  },

  getById(id: string): Provider | undefined {
    return loadProviders().find((p) => p.id === id);
  },

  getBySlug(slug: string): Provider | undefined {
    return loadProviders().find((p) => p.slug === slug);
  },

  getByCategory(category: ProviderCategory): Provider[] {
    return loadProviders().filter((p) => p.category === category);
  },
};
