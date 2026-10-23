import { NextRequest, NextResponse } from "next/server";
import { runNewsIngest } from "../../../../lib/jobs/news-ingest";
import { runPolicyMonitor } from "../../../../lib/jobs/policy-monitor";
import { runLinkCheck } from "../../../../lib/jobs/link-check";
import { runFreshnessAudit } from "../../../../lib/jobs/freshness";
import { runJobWithTelemetry } from "../../../../lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { job: string } }
) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const headerSecret = req.headers.get("x-cron-secret");

  // Fail closed: a missing secret must never expose ingestion jobs publicly.
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron jobs are not configured." },
      { status: 503 }
    );
  }

  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const provided = bearer || headerSecret;

  if (!provided || provided !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid cron secret" },
      { status: 401 }
    );
  }

  const { job } = params;

  try {
    let result;
    switch (job) {
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
        return NextResponse.json({ error: `Unknown job: ${job}` }, { status: 404 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  context: { params: { job: string } }
) {
  // Allow GET for Vercel Cron invocation
  return POST(req, context);
}
