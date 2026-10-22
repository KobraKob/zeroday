import { Metadata } from "next";
import { claimsRepo } from "../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { gccRepo } from "../../lib/repo/gccRepo";
import { citiesRepo } from "../../lib/repo/citiesRepo";
import { statesRepo } from "../../lib/repo/statesRepo";
import { providersRepo } from "../../lib/repo/providersRepo";
import { AskClient } from "./AskClient";

export const metadata: Metadata = {
  title: "Ask the record — GCC Atlas",
  description:
    "Answers come only from sourced data in the Atlas. If we don't have it, we say so.",
};

export default function AskPage() {
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();
  const gccs = gccRepo.getAll();
  const cities = citiesRepo.getAll();
  const states = statesRepo.getAll();
  const providers = providersRepo.getAll();

  return (
    <AskClient
      claims={claims}
      sources={sources}
      gccs={gccs}
      cities={cities}
      states={states}
      providers={providers}
    />
  );
}
