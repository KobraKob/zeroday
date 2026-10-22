import { Metadata } from "next";
import { providersRepo } from "../../lib/repo/providersRepo";
import { reviewsRepo } from "../../lib/repo/reviewsRepo";
import { SubmitClient } from "./SubmitClient";

export const metadata: Metadata = {
  title: "Submit Client Attestation — ZeroDay",
  description:
    "Direct client attestation form for GCC leaders to confirm service provider project deliveries with verified corporate credentials.",
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
