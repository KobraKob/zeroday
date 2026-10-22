import { Metadata } from "next";
import { gccRepo } from "../../lib/repo/gccRepo";
import { citiesRepo } from "../../lib/repo/citiesRepo";
import { statesRepo } from "../../lib/repo/statesRepo";
import { providersRepo } from "../../lib/repo/providersRepo";
import { proofLinksRepo } from "../../lib/repo/proofLinksRepo";
import { checklistsRepo } from "../../lib/repo/checklistsRepo";
import { claimsRepo } from "../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { AdvisorClient } from "./AdvisorClient";

export const metadata: Metadata = {
  title: "Entry Advisor — ZeroDay",
  description:
    "Interactive guided briefing for foreign companies entering India. Shortlist cities, identify applicable state subsidies, review peer GCCs, and assemble an evidence-grounded entry brief.",
};

export default function AdvisorPage() {
  const gccs = gccRepo.getAll();
  const cities = citiesRepo.getAll();
  const states = statesRepo.getAll();
  const providers = providersRepo.getAll();
  const proofLinks = proofLinksRepo.getAll();
  const checklists = checklistsRepo.getAll();
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();

  return (
    <AdvisorClient
      gccs={gccs}
      cities={cities}
      states={states}
      providers={providers}
      proofLinks={proofLinks}
      checklists={checklists}
      claims={claims}
      sources={sources}
    />
  );
}
