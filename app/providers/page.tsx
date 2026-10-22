import { Metadata } from "next";
import { providersRepo } from "../../lib/repo/providersRepo";
import { proofLinksRepo } from "../../lib/repo/proofLinksRepo";
import { gccRepo } from "../../lib/repo/gccRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { ProvidersClient } from "./ProvidersClient";

export const metadata: Metadata = {
  title: "Proof & Providers — ZeroDay",
  description:
    "Independent, citable record of service providers working with Global Capability Centres. Transparent evidence scores, verified client engagements, and zero paid rankings.",
};

export default function ProvidersPage() {
  const providers = providersRepo.getAll();
  const proofLinks = proofLinksRepo.getAll();
  const gccs = gccRepo.getAll();
  const sources = sourcesRepo.getAll();

  return (
    <ProvidersClient
      providers={providers}
      proofLinks={proofLinks}
      gccs={gccs}
      sources={sources}
    />
  );
}
