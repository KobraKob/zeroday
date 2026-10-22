import { Metadata } from "next";
import { reviewsRepo } from "../../../lib/repo/reviewsRepo";
import { sourcesRepo } from "../../../lib/repo/sourcesRepo";
import { ReviewClient } from "./ReviewClient";

export const metadata: Metadata = {
  title: "Admin Review Queue — ZeroDay",
  description:
    "Editorial audit queue reviewing AI-proposed claims against exact verbatim quotes and primary public source documents.",
};

export default function AdminReviewPage() {
  const pendingClaims = reviewsRepo.getPendingClaims();
  const sources = sourcesRepo.getAll();

  return <ReviewClient initialClaims={pendingClaims} sources={sources} />;
}
