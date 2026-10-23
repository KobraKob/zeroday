import crypto from "crypto";
import { getDb, schema } from "../db/client";

export interface JobExecutionResult {
  jobName: string;
  runId: string;
  status: "success" | "failed";
  durationMs: number;
  details: Record<string, any>;
  error?: string;
}

export async function runJobWithTelemetry(
  jobName: string,
  handler: (runId: string) => Promise<Record<string, any>>
): Promise<JobExecutionResult> {
  const runId = `run-${jobName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const startTime = Date.now();
  console.log(`[JOB START] ${jobName} (Run ID: ${runId}) at ${new Date().toISOString()}`);

  const database = getDb();

  // Log job start in database if available
  if (database) {
    try {
      await database.insert(schema.cronJobRuns).values({
        id: runId,
        job_name: jobName,
        status: "started",
        started_at: new Date(),
        details: {},
      });
    } catch (e) {
      console.warn("Could not record job start in DB:", e);
    }
  }

  try {
    const details = await handler(runId);
    const durationMs = Date.now() - startTime;

    console.log(`[JOB SUCCESS] ${jobName} finished in ${durationMs}ms`);

    if (database) {
      try {
        await database
          .update(schema.cronJobRuns)
          .set({
            status: "success",
            finished_at: new Date(),
            duration_ms: durationMs,
            details,
          })
          .where(schema.cronJobRuns.id.equals ? schema.cronJobRuns.id.equals(runId) as any : undefined as any);
      } catch (e) {
        // Fallback update
      }
    }

    return {
      jobName,
      runId,
      status: "success",
      durationMs,
      details,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[JOB FAILED] ${jobName} after ${durationMs}ms:`, err);

    if (database) {
      try {
        await database.update(schema.cronJobRuns).set({
          status: "failed",
          finished_at: new Date(),
          duration_ms: durationMs,
          details: { error: err.message },
        });
      } catch (e) {
        // Ignore
      }
    }

    return {
      jobName,
      runId,
      status: "failed",
      durationMs,
      details: {},
      error: err.message,
    };
  }
}
