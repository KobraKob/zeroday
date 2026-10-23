import { Metadata } from "next";
import { eventsRepo } from "../../lib/repo/eventsRepo";
import { ChangelogClient } from "./ChangelogClient";

export const metadata: Metadata = {
  title: "Public Registry Changelog — ZeroDay",
  description:
    "Review recorded ecosystem events, including GCC additions, claim changes, policy updates, freshness downgrades, and source checks. Seed records are labelled.",
};

// ISR with on-demand revalidation
export const revalidate = 60;

export default function ChangelogPage() {
  const events = eventsRepo.getAll();
  return <ChangelogClient events={events} />;
}
