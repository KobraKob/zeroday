import { Metadata } from "next";
import { MethodologyClient } from "./MethodologyClient";

export const metadata: Metadata = {
  title: "Methodology & Governance — ZeroDay",
  description:
    "Data standards, confidence grading rubric (A/B/C/D), GCC definitions, neutrality firewall, and continuous grounded AI evaluation pass rates.",
};

export default function MethodologyPage() {
  return <MethodologyClient />;
}
