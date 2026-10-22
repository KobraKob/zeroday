import { ProofLink } from "../schema";
import { loadProofLinks } from "./dataLoader";

export const proofLinksRepo = {
  getAll(): ProofLink[] {
    return loadProofLinks();
  },

  getById(id: string): ProofLink | undefined {
    return loadProofLinks().find((pl) => pl.id === id);
  },

  getByProvider(providerId: string): ProofLink[] {
    return loadProofLinks().filter((pl) => pl.provider_id === providerId);
  },

  getByGcc(gccId: string): ProofLink[] {
    return loadProofLinks().filter((pl) => pl.gcc_id === gccId);
  },
};
