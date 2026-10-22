import fs from "fs";
import path from "path";
import { GccSchema, Gcc } from "../lib/schema";

/**
 * Script to import and parse a CSV file of GCC records into validated JSON format.
 * Usage: npx tsx scripts/import-csv.ts <path-to-csv>
 */
export function parseGccCsv(csvContent: string): Gcc[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const gccs: Gcc[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Regex to handle quoted commas
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(lines[i])) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      let val = match[1] || "";
      val = val.replace(/^"|"$/g, "").replace(/""/g, '"').trim();
      matches.push(val);
      if (matches.length > headers.length) break;
    }

    if (matches.length < 5) continue;

    const rowObj: any = {
      id: matches[0] || `gcc-${Date.now()}-${i}`,
      slug: (matches[1] || matches[2] || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: matches[1] || "Unnamed GCC",
      parent_name: matches[2] || matches[1] || "Parent Enterprise",
      parent_hq_country: matches[3] || "United States",
      india_entity_name: matches[4] || null,
      cin: matches[5] || null,
      cities: matches[6] ? matches[6].split(";").map((c) => c.trim()) : ["Bengaluru"],
      sector: matches[7] || "Technology",
      functions: matches[8] ? matches[8].split(";").map((f) => f.trim()) : ["Engineering"],
      established_year: matches[9] ? parseInt(matches[9], 10) : undefined,
      headcount_band: matches[10] || undefined,
      status: (matches[11] as any) || "operating",
      claim_ids: [],
    };

    const parseResult = GccSchema.safeParse(rowObj);
    if (parseResult.success) {
      gccs.push(parseResult.data);
    } else {
      console.warn(`Line ${i} skipped: ${JSON.stringify(parseResult.error.format())}`);
    }
  }

  return gccs;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: npx tsx scripts/import-csv.ts <path-to-csv>");
    process.exit(0);
  }

  const csvPath = path.resolve(args[0]);
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const parsed = parseGccCsv(content);
  console.log(`Parsed and validated ${parsed.length} GCC records from CSV.`);
}
