import { gccRepo } from "../lib/repo/gccRepo";
import { claimsRepo } from "../lib/repo/claimsRepo";
import { sourcesRepo } from "../lib/repo/sourcesRepo";
import { definitionsRepo } from "../lib/repo/definitionsRepo";
import { publishedCountsRepo } from "../lib/repo/publishedCountsRepo";
import { HomeClient } from "./HomeClient";

export default function HomePage() {
  const gccs = gccRepo.getAll();
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();
  const definitions = definitionsRepo.getAll();
  const publishedCounts = publishedCountsRepo.getAll();

  return (
    <HomeClient
      gccs={gccs}
      claims={claims}
      sources={sources}
      definitions={definitions}
      publishedCounts={publishedCounts}
    />
  );
}
