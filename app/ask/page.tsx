import { Metadata } from "next";
import { claimsRepo } from "../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { AskClient } from "./AskClient";

export const metadata: Metadata = {
  title: "Ask ZeroDay — Grounded GCC Intelligence",
  description:
    "Grounded question answering strictly restricted to verified repository claims with zero hallucinated figures and direct provenance citations.",
};

export default function AskPage() {
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();

  return <AskClient claims={claims} sources={sources} />;
}
