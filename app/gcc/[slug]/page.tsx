import { notFound } from "next/navigation";
import { Metadata } from "next";
import { gccRepo } from "../../../lib/repo/gccRepo";
import { claimsRepo } from "../../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../../lib/repo/sourcesRepo";
import { signalsRepo } from "../../../lib/repo/signalsRepo";
import { proofLinksRepo } from "../../../lib/repo/proofLinksRepo";
import { providersRepo } from "../../../lib/repo/providersRepo";
import { GccDetailClient } from "./GccDetailClient";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gcc = gccRepo.getBySlug(params.slug);
  if (!gcc) {
    return { title: "GCC Not Found — ZeroDay" };
  }
  return {
    title: `${gcc.name} — ZeroDay Verified Record`,
    description: `Independent, citable record for ${gcc.name} (${gcc.parent_name}). Footprint in ${gcc.cities.join(", ")}, RoC filings, claims and provenance sources.`,
  };
}

export default function GccDetailPage({ params }: PageProps) {
  const gcc = gccRepo.getBySlug(params.slug);
  if (!gcc) {
    notFound();
  }

  const claims = claimsRepo.getByIds(gcc.claim_ids);
  const sources = sourcesRepo.getAll();
  const signals = signalsRepo.getByGcc(gcc.id).concat(signalsRepo.getByCompany(gcc.parent_name));
  const proofLinks = proofLinksRepo.getByGcc(gcc.id);
  const providers = providersRepo.getAll();

  return (
    <GccDetailClient
      gcc={gcc}
      claims={claims}
      sources={sources}
      signals={signals}
      proofLinks={proofLinks}
      providers={providers}
    />
  );
}
