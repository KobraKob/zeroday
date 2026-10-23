import { runNewsIngest } from "../../lib/jobs/news-ingest";
import { runPolicyMonitor } from "../../lib/jobs/policy-monitor";
import { runLinkCheck } from "../../lib/jobs/link-check";
import { runFreshnessAudit } from "../../lib/jobs/freshness";
import { runJobWithTelemetry } from "../../lib/jobs/runner";

const jobName = process.argv[2];

async function main() {
  if (!jobName) {
    console.error("Usage: tsx scripts/jobs/run-job.ts <news-ingest | policy-monitor | link-check | freshness>");
    process.exit(1);
  }

  let result;
  switch (jobName) {
    case "news-ingest":
      result = await runJobWithTelemetry("news-ingest", () => runNewsIngest());
      break;
    case "policy-monitor":
      result = await runJobWithTelemetry("policy-monitor", () => runPolicyMonitor());
      break;
    case "link-check":
      result = await runJobWithTelemetry("link-check", () => runLinkCheck());
      break;
    case "freshness":
      result = await runJobWithTelemetry("freshness", () => runFreshnessAudit());
      break;
    default:
      console.error(`Unknown job name: ${jobName}`);
      process.exit(1);
  }

  console.log("Job Execution Complete:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Fatal job error:", err);
  process.exit(1);
});
