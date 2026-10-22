import { Metadata } from "next";
import { citiesRepo } from "../../lib/repo/citiesRepo";
import { statesRepo } from "../../lib/repo/statesRepo";
import { claimsRepo } from "../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { CompareClient } from "./CompareClient";

export const metadata: Metadata = {
  title: "City & State Compare — ZeroDay",
  description:
    "Compare commercial office rents, vacancy rates, talent cost indexes, and official government policy incentives side-by-side across Indian tech hubs.",
};

export default function ComparePage() {
  const cities = citiesRepo.getAll();
  const states = statesRepo.getAll();
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();

  return (
    <CompareClient
      cities={cities}
      states={states}
      claims={claims}
      sources={sources}
    />
  );
}
