import fs from "node:fs";
import path from "node:path";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "../lib/db/client";
import { storeSnapshotContent } from "../lib/storage/snapshots";

const DATA_DIR = path.resolve(process.cwd(), "data");
const BATCH_SIZE = 200;

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error("Data file not found: " + filePath);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function normaliseDate(value?: string): Date {
  if (!value) return new Date();
  const input = /^\d{4}-\d{2}$/.test(value) ? value + "-01" : value;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function splitBatches<T>(values: T[], size = BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    batches.push(values.slice(index, index + size));
  }
  return batches;
}

async function insertInBatches<T>(
  values: T[],
  writer: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  for (const batch of splitBatches(values)) {
    await writer(batch);
  }
}

function writeUnverifiedCsv(rows: any[]): string {
  const headers = [
    "id", "subject_type", "subject_id", "field", "value",
    "confidence", "as_of", "source_id", "status", "reason",
  ];
  const quote = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
  const output = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => quote(row[key])).join(",")),
  ].join("\n");
  const filePath = path.join(DATA_DIR, "unverified-records.csv");
  fs.writeFileSync(filePath, output + "\n", "utf8");
  return filePath;
}

export async function runMigration() {
  console.log("Starting ZeroDay JSON-to-Supabase migration.");

  const rawSources = readJson<any[]>("sources.json");
  const rawClaims = readJson<any[]>("claims.json");
  const rawGccs = readJson<any[]>("gccs.json");
  const rawCities = readJson<any[]>("cities.json");
  const rawStates = readJson<any[]>("states.json");
  const rawProviders = readJson<any[]>("providers.json");
  const rawSignals = readJson<any[]>("signals.json");
  const rawProofLinks = readJson<any[]>("proofLinks.json");
  const rawPolicies = readJson<any[]>("policy-sources.json");

  const now = new Date();
  const nowIso = now.toISOString();

  // Policy monitor source IDs must reference a row in sources before snapshots
  // can be attached. Keep richer existing source metadata when IDs overlap.
  const sourceById = new Map<string, any>();
  rawSources.forEach((source) => sourceById.set(source.id, source));
  rawPolicies.forEach((policy) => {
    if (!policy.id || sourceById.has(policy.id)) return;
    sourceById.set(policy.id, {
      id: policy.id,
      name: policy.policy_name || policy.name || policy.id,
      type: "policy",
      url: policy.url,
      publisher: policy.publisher || policy.state_name || "State Government",
      retrieved_at: nowIso.slice(0, 10),
      published_at: policy.published_at || null,
      license_note: null,
    });
  });
  const allSources = [...sourceById.values()];
  const sourceIdSet = new Set(allSources.map((source) => source.id));

  const unverifiedRecords: any[] = [];
  const processedClaims = rawClaims.map((claim) => {
    const hasSource = Boolean(claim.source_id && sourceIdSet.has(claim.source_id));
    if (!hasSource) {
      unverifiedRecords.push({
        id: claim.id,
        subject_type: claim.subject_type,
        subject_id: claim.subject_id,
        field: claim.field,
        value: typeof claim.value === "object" ? JSON.stringify(claim.value) : String(claim.value),
        confidence: claim.confidence || "D",
        as_of: claim.as_of || "unknown",
        source_id: claim.source_id || "MISSING",
        status: "unverified",
        reason: !claim.source_id
          ? "No source_id specified"
          : "Source ID '" + claim.source_id + "' not found in source registry",
      });
    }

    return {
      id: claim.id,
      subject_type: claim.subject_type,
      subject_id: claim.subject_id,
      field: claim.field,
      value: claim.value,
      unit: claim.unit || null,
      as_of: claim.as_of || "unknown",
      source_id: hasSource ? claim.source_id : null,
      confidence: claim.confidence || "D",
      status: hasSource ? "approved" : "unverified",
      valid_from: normaliseDate(claim.as_of),
      valid_to: null,
      last_checked_at: now,
      created_by: "import",
      exact_quote: claim.exact_quote || null,
      note: claim.note || null,
      demo: Boolean(claim.demo),
    };
  });

  const entities = [
    ...rawGccs.map((item) => ({
      id: item.id,
      type: "gcc",
      name: item.name,
      slug: item.slug,
      data: item,
      created_at: now,
      updated_at: now,
    })),
    ...rawCities.map((item) => ({
      id: item.id,
      type: "city",
      name: item.name,
      slug: item.id,
      data: item,
      created_at: now,
      updated_at: now,
    })),
    ...rawStates.map((item) => ({
      id: item.id,
      type: "state",
      name: item.name,
      slug: item.id,
      data: item,
      created_at: now,
      updated_at: now,
    })),
    ...rawProviders.map((item) => ({
      id: item.id,
      type: "provider",
      name: item.name,
      slug: item.slug,
      data: item,
      created_at: now,
      updated_at: now,
    })),
  ];

  const transformedSources = allSources.map((source) => ({
    id: source.id,
    name: source.name,
    type: source.type || "report",
    url: source.url,
    publisher: source.publisher || "Unknown publisher",
    published_at: source.published_at || null,
    retrieved_at: source.retrieved_at || nowIso.slice(0, 10),
    license_note: source.license_note || null,
    status: source.status || "active",
    last_checked_at: now,
    created_at: now,
  }));

  const transformedSignals = rawSignals.map((signal) => ({
    id: signal.id,
    title: (signal.company_name || signal.id) + " — " + signal.type,
    type: signal.type,
    date: signal.date || nowIso.slice(0, 10),
    entity_id: signal.gcc_id || null,
    entity_type: signal.gcc_id ? "gcc" : null,
    summary: signal.note || "",
    company_name: signal.company_name || null,
    city: signal.city || null,
    source_id: signal.source_id && sourceIdSet.has(signal.source_id) ? signal.source_id : null,
    demo: Boolean(signal.demo),
    claim_ids: signal.gcc_id
      ? processedClaims.filter((claim) => claim.subject_type === "gcc" && claim.subject_id === signal.gcc_id).map((claim) => claim.id)
      : [],
    created_at: now,
  }));

  const transformedProofLinks = rawProofLinks.map((link) => ({
    id: link.id,
    provider_id: link.provider_id,
    gcc_id: link.gcc_id,
    service: link.service,
    year: link.year || null,
    evidence: Array.isArray(link.evidence) ? link.evidence : [],
    status: link.status || "public",
    created_at: now,
  }));

  const csvPath = writeUnverifiedCsv(unverifiedRecords);
  console.log("Prepared " + transformedSources.length + " sources, " + processedClaims.length +
    " claims, " + entities.length + " entities, " + transformedSignals.length +
    " signals, and " + transformedProofLinks.length + " proof links.");
  console.log("Wrote " + unverifiedRecords.length + " unverified records to " + csvPath);

  const database = getDb();
  if (!database) {
    console.warn(
      "DATABASE_URL is not configured. This was a local validation/dry run only; no cloud database writes occurred."
    );
    return {
      dryRun: true,
      databaseWritten: false,
      sourcesCount: transformedSources.length,
      claimsCount: processedClaims.length,
      unverifiedCount: unverifiedRecords.length,
      entitiesCount: entities.length,
      signalsCount: transformedSignals.length,
      proofLinksCount: transformedProofLinks.length,
    };
  }

  // Apply the SQL migrations before running this script. Inserts are idempotent:
  // existing IDs are preserved and never overwritten by the seed bundle.
  await insertInBatches(transformedSources, (batch) =>
    database.insert(schema.sources).values(batch as any).onConflictDoNothing()
  );
  await insertInBatches(processedClaims, (batch) =>
    database.insert(schema.claims).values(batch as any).onConflictDoNothing()
  );
  await insertInBatches(entities, (batch) =>
    database.insert(schema.entities).values(batch as any).onConflictDoNothing()
  );
  await insertInBatches(transformedSignals, (batch) =>
    database.insert(schema.signals).values(batch as any).onConflictDoNothing()
  );
  await insertInBatches(transformedProofLinks, (batch) =>
    database.insert(schema.proofLinks).values(batch as any).onConflictDoNothing()
  );

  // Move historical snapshots from text-in-Postgres to private object storage.
  // Each row is updated only after the object upload succeeds.
  const legacySnapshots = await database
    .select({
      id: schema.sourceSnapshots.id,
      source_id: schema.sourceSnapshots.source_id,
      raw_content: schema.sourceSnapshots.raw_content,
      content_hash: schema.sourceSnapshots.content_hash,
      storage_bucket: schema.sourceSnapshots.storage_bucket,
      object_key: schema.sourceSnapshots.object_key,
    })
    .from(schema.sourceSnapshots)
    .where(and(
      isNotNull(schema.sourceSnapshots.raw_content),
      isNull(schema.sourceSnapshots.object_key),
    ));

  let snapshotsMigrated = 0;
  for (const snapshot of legacySnapshots) {
    const content = snapshot.raw_content;
    if (content === null) continue;

    const stored = await storeSnapshotContent({
      sourceId: snapshot.source_id || "orphan-snapshot",
      snapshotId: snapshot.id,
      content,
      contentHash: snapshot.content_hash,
    });

    if (!stored.object_key) continue; // local mode without Storage credentials

    await database
      .update(schema.sourceSnapshots)
      .set({
        raw_content: null,
        storage_bucket: stored.storage_bucket,
        object_key: stored.object_key,
        content_type: stored.content_type,
        byte_size: stored.byte_size,
      })
      .where(eq(schema.sourceSnapshots.id, snapshot.id));

    snapshotsMigrated++;
  }

  const countExpression = sql.raw("count(*)::int");
  const [sourceTotal, claimTotal, entityTotal, signalTotal, proofTotal] = await Promise.all([
    database.select({ count: countExpression }).from(schema.sources),
    database.select({ count: countExpression }).from(schema.claims),
    database.select({ count: countExpression }).from(schema.entities),
    database.select({ count: countExpression }).from(schema.signals),
    database.select({ count: countExpression }).from(schema.proofLinks),
  ]);

  const result = {
    dryRun: false,
    databaseWritten: true,
    sourcesSeeded: transformedSources.length,
    claimsSeeded: processedClaims.length,
    unverifiedCount: unverifiedRecords.length,
    entitiesSeeded: entities.length,
    signalsSeeded: transformedSignals.length,
    proofLinksSeeded: transformedProofLinks.length,
    snapshotsMigratedToStorage: snapshotsMigrated,
    databaseTotals: {
      sources: sourceTotal[0]?.count ?? 0,
      claims: claimTotal[0]?.count ?? 0,
      entities: entityTotal[0]?.count ?? 0,
      signals: signalTotal[0]?.count ?? 0,
      proofLinks: proofTotal[0]?.count ?? 0,
    },
  };

  console.log("Supabase migration and seed verification completed:", JSON.stringify(result, null, 2));
  return result;
}

if (require.main === module) {
  runMigration()
    .then((result) => {
      if (!result.databaseWritten && process.argv.includes("--require-db")) {
        process.exitCode = 2;
      }
    })
    .catch((error) => {
      console.error("Database migration failed. No success status was recorded.", error);
      process.exitCode = 1;
    });
}
