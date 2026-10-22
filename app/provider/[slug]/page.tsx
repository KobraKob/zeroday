import { notFound } from "next/navigation";
import { Metadata } from "next";
import { providersRepo } from "../../../lib/repo/providersRepo";
import { proofLinksRepo } from "../../../lib/repo/proofLinksRepo";
import { gccRepo } from "../../../lib/repo/gccRepo";
import { sourcesRepo } from "../../../lib/repo/sourcesRepo";
import { ProviderDetailClient } from "./ProviderDetailClient";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const provider = providersRepo.getBySlug(params.slug);
  if (!provider) {
    return { title: "Provider Not Found — ZeroDay" };
  }
  return {
    title: `${provider.name} — GCC Proof & Evidence Record`,
    description: `Verified client engagements, evidence score formula, and proof links for ${provider.name}.`,
  };
}

export default function ProviderDetailPage({ params }: PageProps) {
  const provider = providersRepo.getBySlug(params.slug);
  if (!provider) {
    notFound();
  }

  const proofLinks = proofLinksRepo.getByProvider(provider.id);
  const gccs = gccRepo.getAll();
  const sources = sourcesRepo.getAll();

  return (
    <ProviderDetailClient
      provider={provider}
      proofLinks={proofLinks}
      gccs={gccs}
      sources={sources}
    />
  );
}
