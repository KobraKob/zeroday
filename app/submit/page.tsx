import { Metadata } from "next";
import { providersRepo } from "../../lib/repo/providersRepo";
import { reviewsRepo } from "../../lib/repo/reviewsRepo";
import { SubmitClient } from "./SubmitClient";

export const metadata: Metadata = {
  title: "Attest an Engagement — ZeroDay",
  description:
    "Evidence-first intake for GCC client engagements, with clear scope, identity details, and review status before anything enters the public record.",
};

export default function SubmitPage() {
  const providers = providersRepo.getAll();
  const initialAttestations = reviewsRepo.getAttestations();

  return (
    <SubmitClient
      providers={providers}
      initialAttestations={initialAttestations}
    />
  );
}
