import { Metadata } from "next";
import { signalsRepo } from "../../lib/repo/signalsRepo";
import { sourcesRepo } from "../../lib/repo/sourcesRepo";
import { RadarClient } from "./RadarClient";

export const metadata: Metadata = {
  title: "Radar (Who Is Coming Next) — ZeroDay",
  description:
    "Predictive signal detection monitoring RoC incorporations, GST registrations, leadership hires, and commercial leases with exponential decay scoring.",
};

export default function RadarPage() {
  const signals = signalsRepo.getAll();
  const sources = sourcesRepo.getAll();

  return <RadarClient signals={signals} sources={sources} />;
}
