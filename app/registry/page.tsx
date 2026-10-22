import { Metadata } from "next";
import { gccRepo } from "../../lib/repo/gccRepo";
import { claimsRepo } from "../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { RegistryClient } from "./RegistryClient";

export const metadata: Metadata = {
  title: "GCC Registry — ZeroDay",
  description:
    "Explore verified capability centres in India with verified RoC CIN numbers, city footprints, sectors, and provenance source drawer links.",
};

export default function RegistryPage() {
  const gccs = gccRepo.getAll();
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();

  return <RegistryClient initialGccs={gccs} claims={claims} sources={sources} />;
}
