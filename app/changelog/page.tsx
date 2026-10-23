import { Metadata } from "next";
import { eventsRepo } from "../../lib/repo/eventsRepo";
import { ChangelogClient } from "./ChangelogClient";

export const metadata: Metadata = {
  title: "Public Registry Changelog — ZeroDay",
  description:
    "Live audit log of all ecosystem events: newly incorporated GCCs, verified claim changes, state policy gazettes, and confidence adjustments.",
};

// ISR with on-demand revalidation
export const revalidate = 60;

export default function ChangelogPage() {
  const events = eventsRepo.getAll();
  return <ChangelogClient events={events} />;
}
