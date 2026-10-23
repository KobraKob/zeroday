import { Metadata } from "next";
import { publishedCountsRepo } from "../../lib/repo/publishedCountsRepo";
import { definitionsRepo } from "../../lib/repo/definitionsRepo";
import { gccRepo } from "../../lib/repo/gccRepo";
import { claimsRepo } from "../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { ReconcileClient } from "./ReconcileClient";

export const metadata: Metadata = {
  title: "Reconcile — ZeroDay",
  description:
    "Why do reports disagree on how many GCCs India has? Compare published numbers, recompute counts under parent vs legal entity vs centre rules, and inspect primary citations.",
};

export default function ReconcilePage() {
  const publishedCounts = publishedCountsRepo.getAll();
  const definitions = definitionsRepo.getAll();
  const gccs = gccRepo.getAll();
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();

  return (
    <ReconcileClient
      publishedCounts={publishedCounts}
      definitions={definitions}
      gccs={gccs}
      claims={claims}
      sources={sources}
    />
  );
}
