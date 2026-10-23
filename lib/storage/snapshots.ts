import crypto from "node:crypto";

export const SNAPSHOT_BUCKET = process.env.SUPABASE_SNAPSHOT_BUCKET || "snapshots";

export interface StoredSnapshot {
  storage_bucket: string;
  object_key: string | null;
  content_type: string;
  byte_size: number;
  etag: string | null;
  raw_content: string | null;
}

interface SnapshotInput {
  sourceId: string;
  snapshotId: string;
  content: string;
  contentHash?: string;
  contentType?: string;
}

function getStorageConfig() {
  const baseUrl = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/+$/, "");
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";

  return { baseUrl, apiKey };
}

function safeSegment(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120) || "unknown";
}

function objectUrl(bucket: string, objectKey: string): string {
  const config = getStorageConfig();
  if (!config.baseUrl) throw new Error("SUPABASE_URL is required for source snapshot Storage.");
  const path = objectKey.split("/").map((part) => encodeURIComponent(part)).join("/");
  return config.baseUrl + "/storage/v1/object/" + encodeURIComponent(bucket) + "/" + path;
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    apikey: apiKey,
    Authorization: "Bearer " + apiKey,
  };
}

/**
 * Save extracted source text to private Supabase Storage.
 * A local/test run without Storage credentials may keep text in Postgres.
 * Production intentionally fails closed instead of silently filling PostgreSQL
 * with large whitepaper text.
 */
export async function storeSnapshotContent(input: SnapshotInput): Promise<StoredSnapshot> {
  const contentType = input.contentType || "text/plain; charset=utf-8";
  const body = Buffer.from(input.content, "utf8");
  const hash = input.contentHash ||
    crypto.createHash("sha256").update(body).digest("hex");
  const config = getStorageConfig();

  if (!config.baseUrl || !config.apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Storage-backed snapshots require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)."
      );
    }

    return {
      storage_bucket: SNAPSHOT_BUCKET,
      object_key: null,
      content_type: contentType,
      byte_size: body.byteLength,
      etag: null,
      raw_content: input.content,
    };
  }

  const sourceFolder = safeSegment(input.sourceId);
  const objectKey = sourceFolder + "/" + hash + ".txt";
  const response = await fetch(objectUrl(SNAPSHOT_BUCKET, objectKey), {
    method: "POST",
    headers: {
      ...authHeaders(config.apiKey),
      "Content-Type": contentType,
      "x-upsert": "true",
      "cache-control": "3600",
    },
    body,
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(
      "Supabase Storage upload failed (" + response.status + ") for snapshot " +
      safeSegment(input.snapshotId) + ": " + detail
    );
  }

  return {
    storage_bucket: SNAPSHOT_BUCKET,
    object_key: objectKey,
    content_type: contentType,
    byte_size: body.byteLength,
    etag: response.headers.get("etag")?.replaceAll('"', "") || hash,
    raw_content: null,
  };
}

/** Read a private snapshot server-side. Never create public URLs for source material. */
export async function readSnapshotContent(bucket: string, objectKey: string): Promise<Buffer> {
  const config = getStorageConfig();
  if (!config.apiKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to read private source snapshots.");

  const response = await fetch(objectUrl(bucket, objectKey), {
    method: "GET",
    headers: authHeaders(config.apiKey),
  });

  if (!response.ok) {
    throw new Error("Supabase Storage download failed (" + response.status + ") for " + objectKey + ".");
  }

  return Buffer.from(await response.arrayBuffer());
}

/** Deterministically rebuild a hash while migrating legacy raw_content records. */
export function snapshotHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}
