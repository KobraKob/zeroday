import fs from "fs";
import path from "path";

// Forbidden old teal and old dark slate/navy hex values (case-insensitive)
const FORBIDDEN_HEXES = [
  "#0F766E",
  "#14B8A6",
  "#0D9488",
  "#2DD4BF",
  "#042F2E",
  "#115E59",
  "#134E4A",
  "#0F172A",
  "#1E293B",
  "#334155",
  "#111827",
  "#0A0D17",
  "#0B0F19",
  "#1E2235",
  "#F8FAFC",
  "#475569",
  "#64748B",
  "#94A3B8",
];

// Forbidden legacy theme variables
const FORBIDDEN_VARS = [
  "--verdigris",
  "--color-verdigris",
  "--vermilion",
  "--color-vermilion",
];

// Forbidden legacy class patterns (regex)
const FORBIDDEN_CLASS_REGEXES = [
  /\bverdigris\b/i,
  /\bvermilion\b/i,
  /\bslate-(?:50|100|200|300|400|500|600|700|800|900|950)\b/,
  /\bteal-(?:50|100|200|300|400|500|600|700|800|900|950)\b/,
  /\bemerald-(?:50|100|200|300|400|500|600|700|800|900|950)\b/,
];

const SCAN_DIRS = ["app", "components", "lib", "scripts"];
const EXTENSIONS = [".ts", ".tsx", ".css"];

interface Violation {
  file: string;
  line: number;
  pattern: string;
  snippet: string;
}

function scanFile(filePath: string): Violation[] {
  // Skip this lint script itself
  if (filePath.endsWith("lint-theme.ts")) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  lines.forEach((lineText, idx) => {
    // Check forbidden hexes
    for (const hex of FORBIDDEN_HEXES) {
      if (lineText.toLowerCase().includes(hex.toLowerCase())) {
        violations.push({
          file: filePath,
          line: idx + 1,
          pattern: hex,
          snippet: lineText.trim(),
        });
      }
    }

    // Check forbidden vars
    for (const v of FORBIDDEN_VARS) {
      if (lineText.includes(v)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          pattern: v,
          snippet: lineText.trim(),
        });
      }
    }

    // Check forbidden class regexes
    for (const regex of FORBIDDEN_CLASS_REGEXES) {
      if (regex.test(lineText)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          pattern: regex.toString(),
          snippet: lineText.trim(),
        });
      }
    }
  });

  return violations;
}

function walkDir(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        results = results.concat(walkDir(fullPath));
      }
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export function runThemeLint(): boolean {
  console.log("🎨 Running Theme Token & Palette Lint Check (scripts/lint-theme.ts)...");

  let allViolations: Violation[] = [];

  for (const scanDir of SCAN_DIRS) {
    const dirPath = path.resolve(process.cwd(), scanDir);
    const files = walkDir(dirPath);
    for (const file of files) {
      const v = scanFile(file);
      if (v.length > 0) {
        allViolations = allViolations.concat(v);
      }
    }
  }

  if (allViolations.length > 0) {
    console.error(`\n❌ THEME LINT FAILED: Found ${allViolations.length} forbidden legacy theme values:`);
    allViolations.forEach((item) => {
      console.error(
        `  - ${path.relative(process.cwd(), item.file)}:${item.line} [${item.pattern}] => ${item.snippet}`
      );
    });
    console.error("\nPlease remove all old teal/navy hexes and legacy variables. Use only v2 tokens (#FFF6E5, #15183A, #2536E8, #FFC21A, #FF6B4A, #5FE0B0).\n");
    return false;
  }

  console.log("✅ All theme tokens valid! Zero legacy teal/navy hexes or deprecated variables found.\n");
  return true;
}

if (require.main === module) {
  const success = runThemeLint();
  if (!success) {
    process.exit(1);
  }
}
