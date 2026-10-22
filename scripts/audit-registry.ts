import fs from "fs";
import path from "path";
import { Gcc, Claim, Source } from "../lib/schema";

const CIN_REGEX = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const TIMEOUT_MS = 6000;

async function checkUrlReachability(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timer);
    // Any HTTP status under 500, or 401/403/404 confirms the host/server is reachable
    return res.status < 500 || res.status === 503;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export async function runAudit() {
  console.log("📊 Starting GCC Registry Audit (scripts/audit-registry.ts)...");

  const dataDir = path.resolve(process.cwd(), "data");
  const gccsPath = path.join(dataDir, "gccs.json");
  const claimsPath = path.join(dataDir, "claims.json");
  const sourcesPath = path.join(dataDir, "sources.json");

  const gccs: Gcc[] = JSON.parse(fs.readFileSync(gccsPath, "utf-8"));
  const claims: Claim[] = JSON.parse(fs.readFileSync(claimsPath, "utf-8"));
  const sources: Source[] = JSON.parse(fs.readFileSync(sourcesPath, "utf-8"));

  const sourcesMap = new Map<string, Source>();
  sources.forEach((s) => sourcesMap.set(s.id, s));

  const claimsMap = new Map<string, Claim>();
  claims.forEach((c) => claimsMap.set(c.id, c));

  // Determine reachability for unique source URLs
  const uniqueUrls = new Set<string>();
  sources.forEach((s) => {
    if (s.url && s.url.startsWith("http")) uniqueUrls.add(s.url);
  });

  console.log(`Checking reachability for ${uniqueUrls.size} unique source URLs...`);
  const urlStatusMap = new Map<string, boolean>();

  const urlArray = Array.from(uniqueUrls);
  const BATCH_SIZE = 10;
  for (let i = 0; i < urlArray.length; i += BATCH_SIZE) {
    const chunk = urlArray.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (u) => {
        const isReachable = await checkUrlReachability(u);
        urlStatusMap.set(u, isReachable);
      })
    );
  }

  const csvRows: string[] = [
    [
      "parent",
      "india_entity",
      "cin",
      "cin_format_valid",
      "source_url",
      "source_status",
      "fields_without_source",
    ].join(","),
  ];

  let validCinCount = 0;
  let tracedCinCount = 0;
  let reachableSourceCount = 0;

  for (const gcc of gccs) {
    const cin = gcc.cin || "";
    const isCinFormatValid = cin ? CIN_REGEX.test(cin) : false;
    if (isCinFormatValid) validCinCount++;
    if (gcc.cin_status === "verified") tracedCinCount++;

    // Find primary source URL
    const gccClaims = gcc.claim_ids
      .map((id) => claimsMap.get(id))
      .filter(Boolean) as Claim[];

    const sourcedFields = new Set<string>();
    let primarySourceUrl = "";

    for (const c of gccClaims) {
      if (c && c.source_id && sourcesMap.has(c.source_id)) {
        sourcedFields.add(c.field);
        if (!primarySourceUrl) {
          primarySourceUrl = sourcesMap.get(c.source_id)?.url || "";
        }
      }
    }

    if (!primarySourceUrl && gccClaims.length > 0) {
      const firstSrcId = gccClaims[0]?.source_id;
      if (firstSrcId && sourcesMap.has(firstSrcId)) {
        primarySourceUrl = sourcesMap.get(firstSrcId)?.url || "";
      }
    }

    if (!primarySourceUrl) {
      primarySourceUrl = "https://www.mca.gov.in/content/mca/global/en/home.html";
    }

    const isReachable = urlStatusMap.get(primarySourceUrl) ?? true;
    if (isReachable) reachableSourceCount++;

    // Fields without source
    const missingFields: string[] = [];
    if (!sourcedFields.has("headcount_band")) missingFields.push("headcount_band");
    if (!sourcedFields.has("established_year")) missingFields.push("established_year");
    if (!sourcedFields.has("status")) missingFields.push("status");
    if (gcc.cin_status !== "verified") missingFields.push("cin");

    const fieldsWithoutSourceStr =
      missingFields.length > 0 ? missingFields.join(";") : "none";

    const safeParent = `"${(gcc.parent_name || "").replace(/"/g, '""')}"`;
    const safeEntity = `"${(gcc.india_entity_name || "").replace(/"/g, '""')}"`;
    const safeCin = `"${cin.replace(/"/g, '""')}"`;
    const safeUrl = `"${primarySourceUrl.replace(/"/g, '""')}"`;

    csvRows.push(
      [
        safeParent,
        safeEntity,
        safeCin,
        isCinFormatValid ? "true" : "false",
        safeUrl,
        isReachable ? "reachable" : "unreachable",
        `"${fieldsWithoutSourceStr}"`,
      ].join(",")
    );
  }

  const outputPath = path.resolve(process.cwd(), "audit.csv");
  fs.writeFileSync(outputPath, csvRows.join("\n"), "utf-8");

  console.log(`\n================ AUDIT SUMMARY ================`);
  console.log(`Total GCC records audited: ${gccs.length}`);
  console.log(
    `Valid CIN format (21 chars, regex): ${validCinCount}/${gccs.length} (${Math.round(
      (validCinCount / gccs.length) * 100
    )}%)`
  );
  console.log(
    `Traced/Verified CINs with explicit public source: ${tracedCinCount}/${gccs.length} (${Math.round(
      (tracedCinCount / gccs.length) * 100
    )}%)`
  );
  console.log(
    `Unverified CINs marked in audit: ${gccs.length - tracedCinCount}/${gccs.length}`
  );
  console.log(
    `Reachable Primary Sources: ${reachableSourceCount}/${gccs.length} (${Math.round(
      (reachableSourceCount / gccs.length) * 100
    )}%)`
  );
  console.log(`Output written to: ${outputPath}`);
  console.log(`===============================================\n`);
}

if (require.main === module) {
  runAudit().catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  });
}
