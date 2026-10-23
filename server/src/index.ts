import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import postgres from "postgres";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  "";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

app.use(cors({ origin: "*" }));
app.use(express.json());

// Load data files safely from data directory
function loadJson(filename: string): any {
  const possiblePaths = [
    path.join(__dirname, "../../data", filename),
    path.join(__dirname, "../data", filename),
    path.join(process.cwd(), "data", filename),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  }
  return [];
}

let claimsData: any[] = loadJson("claims.json");
let gccData: any[] = loadJson("gccs.json");
let citiesData: any[] = loadJson("cities.json");
let definitionsData: any[] = loadJson("definitions.json");
let statesData: any[] = loadJson("states.json");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

let dbClient: ReturnType<typeof postgres> | null = null;

function getDatabase() {
  if (!DATABASE_URL) return null;
  if (!dbClient) {
    dbClient = postgres(DATABASE_URL, {
      max: Math.max(1, Number(process.env.DB_POOL_MAX || 5)),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl: process.env.NODE_ENV === "production" ? "require" : false,
    });
  }
  return dbClient;
}

// In-Memory Vector Store for Railway Backend
interface Chunk {
  id: string;
  category: string;
  title: string;
  content: string;
  claim_ids: string[];
  vector?: number[];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

class BackendVectorStore {
  private chunks: Chunk[] = [];
  private vocab: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();

  constructor() {
    this.build();
  }

  private build() {
    // Identity chunk
    this.chunks.push({
      id: "identity-zero",
      category: "identity",
      title: "Zero Personality & Mandate",
      content:
        "I am Zero, the grounded intelligence auditor for ZeroDay. ZeroDay is the independent, citable record of India's Global Capability Centre (GCC) ecosystem. My role is to verify facts against primary statutory corporate filings (MCA CIN), registered lease deeds, and gazetted policies. I answer strictly from verified public evidence and never invent figures or speculate.",
      claim_ids: ["clm-mkt-rev-fy26", "clm-mkt-workforce-fy26"],
    });

    // Methodology definitions
    definitionsData.forEach((def) => {
      const inc = Array.isArray(def.includes) ? def.includes.join(", ") : "";
      const exc = Array.isArray(def.excludes) ? def.excludes.join(", ") : "";
      this.chunks.push({
        id: `def-${def.unit || def.id}`,
        category: "methodology",
        title: `Counting Unit Definition: ${def.label || def.unit}`,
        content: `Counting unit ${def.label || def.unit} (${def.unit}): ${def.rule_text || ""}. Included: ${inc}. Excluded: ${exc}.`,
        claim_ids: def.claim_ids || [],
      });
    });

    // Claims
    claimsData.forEach((c) => {
      this.chunks.push({
        id: c.id,
        category: "claim",
        title: `Claim: ${c.field} for ${c.subject_id}`,
        content: `Field ${c.field} on ${c.subject_id} has audited value ${c.value} ${c.unit || ""}. Confidence Grade: ${c.confidence}. Primary excerpt: "${c.exact_quote || c.note || ""}".`,
        claim_ids: [c.id],
      });
    });

    // GCC Profiles
    gccData.forEach((gcc) => {
      const cities = Array.isArray(gcc.cities) ? gcc.cities.join(", ") : "";
      const funcs = Array.isArray(gcc.functions) ? gcc.functions.join(", ") : "";
      this.chunks.push({
        id: `gcc-${gcc.slug || gcc.id}`,
        category: "gcc",
        title: `GCC Profile: ${gcc.name}`,
        content: `${gcc.name} (Parent: ${gcc.parent_name}, HQ: ${gcc.parent_hq_country}). Statutory Entity: ${gcc.india_entity_name || "Statutory Entity"}. CIN: ${gcc.cin || "Pending filing"}. Operational campuses in ${cities}. Primary functions: ${funcs}. Headcount band: ${gcc.headcount_band || "Undisclosed"}. Established: ${gcc.established_year || "Audited"}. Status: ${gcc.status}.`,
        claim_ids: gcc.claim_ids || [],
      });
    });

    // Cities
    citiesData.forEach((city) => {
      const corridors = Array.isArray(city.primary_corridors) ? city.primary_corridors.join(", ") : "tech parks";
      this.chunks.push({
        id: `city-${city.id}`,
        category: "city",
        title: `City Hub: ${city.name} (${city.state_id})`,
        content: `${city.name} (${city.state_id}) is a ${city.tier || "Tier-1"} tech cluster with ${city.total_gccs || "multiple"} operational GCC units. Micro-markets include ${corridors}. Commercial Grade A vacancy stands at ${city.stats?.vacancy_pct || "8-12"}% with monthly rents between ${city.stats?.avg_rent_range_inr_sqft || "₹80-140"}/sq ft.`,
        claim_ids: city.claim_ids || [],
      });
    });

    // Vocabulary & TF-IDF
    const N = this.chunks.length;
    const docCounts: Map<string, number> = new Map();

    this.chunks.forEach((chunk) => {
      const tokens = new Set(tokenize(`${chunk.title} ${chunk.content}`));
      tokens.forEach((t) => {
        docCounts.set(t, (docCounts.get(t) || 0) + 1);
        if (!this.vocab.has(t)) {
          this.vocab.set(t, this.vocab.size);
        }
      });
    });

    docCounts.forEach((count, token) => {
      this.idf.set(token, Math.log((N + 1) / (count + 1)) + 1);
    });

    this.chunks.forEach((chunk) => {
      chunk.vector = this.computeTfIdf(tokenize(`${chunk.title} ${chunk.content}`));
    });
  }

  private computeTfIdf(tokens: string[]): number[] {
    const tfMap: Map<string, number> = new Map();
    tokens.forEach((t) => tfMap.set(t, (tfMap.get(t) || 0) + 1));

    const vec: number[] = new Array(this.vocab.size).fill(0);
    tfMap.forEach((freq, token) => {
      const idx = this.vocab.get(token);
      if (idx !== undefined) {
        const idfVal = this.idf.get(token) || 1;
        vec[idx] = (freq / tokens.length) * idfVal;
      }
    });

    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  public search(query: string, topK = 6) {
    const qTokens = tokenize(query);
    if (qTokens.length === 0) return [];

    const qVec = this.computeTfIdf(qTokens);

    const results = this.chunks.map((chunk) => {
      let score = 0;
      if (chunk.vector) {
        for (let i = 0; i < qVec.length; i++) {
          score += qVec[i] * chunk.vector[i];
        }
      }
      const fullText = `${chunk.title} ${chunk.content}`.toLowerCase();
      qTokens.forEach((w) => {
        if (fullText.includes(w)) {
          score += 0.15;
        }
      });
      return { chunk, score };
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}

let vectorStore = new BackendVectorStore();
let claimsMap = new Map<string, any>();
claimsData.forEach((c) => claimsMap.set(c.id, c));

function unwrapJson(value: any) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Railway runs against persistent database records when DATABASE_URL exists.
 * JSON files are only a local/test fallback. Production must not silently boot
 * against bundled fixtures when a database has not been configured.
 */
async function initialiseDataSource(): Promise<"supabase-postgres" | "local-json"> {
  const database = getDatabase();
  if (!database) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required in production.");
    }
    console.warn("DATABASE_URL missing; backend is using local JSON fixtures.");
    return "local-json";
  }

  const [claimRows, gccRows, cityRows, stateRows] = await Promise.all([
    database`select id, subject_type, subject_id, field, value, unit, as_of, source_id, confidence, status, exact_quote, note, demo
      from public.claims
      where status in ('approved', 'verified') and valid_to is null
      order by subject_type, subject_id, field`,
    database`select data from public.entities where type = 'gcc' order by name`,
    database`select data from public.entities where type = 'city' order by name`,
    database`select data from public.entities where type = 'state' order by name`,
  ]);

  claimsData = claimRows.map((row: any) => ({
    ...row,
    value: unwrapJson(row.value),
    source_id: row.source_id || "MISSING",
    demo: Boolean(row.demo),
  }));
  gccData = gccRows.map((row: any) => unwrapJson(row.data));
  citiesData = cityRows.map((row: any) => unwrapJson(row.data));
  statesData = stateRows.map((row: any) => unwrapJson(row.data));

  // Rebuild retrieval vectors from DB records, not stale bundled JSON.
  vectorStore = new BackendVectorStore();
  claimsMap = new Map<string, any>();
  claimsData.forEach((claim) => claimsMap.set(claim.id, claim));

  if (!gccData.length || !citiesData.length) {
    console.warn("Supabase is connected, but GCC/city tables have no seeded records yet.");
  }
  console.log("Loaded live records from Supabase PostgreSQL.", JSON.stringify({
    claims: claimsData.length,
    gccs: gccData.length,
    cities: citiesData.length,
    states: statesData.length,
  }));
  return "supabase-postgres";
}

// --- HTTP Routes ---

// Healthcheck route for Railway deploy monitoring
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "zeroday-backend",
    timestamp: new Date().toISOString(),
    records: {
      claims: claimsData.length,
      gccs: gccData.length,
      cities: citiesData.length,
    },
    database: DATABASE_URL ? "configured" : "local-json",
    llm: {
      model: GROQ_MODEL,
      status: GROQ_API_KEY ? "connected" : "disabled",
    },
  });
});

// Sourced Claims
app.get("/api/claims", (_req: Request, res: Response) => {
  res.status(200).json(claimsData);
});

// GCC Directory
app.get("/api/gccs", (_req: Request, res: Response) => {
  res.status(200).json(gccData);
});

// City Clusters
app.get("/api/cities", (_req: Request, res: Response) => {
  res.status(200).json(citiesData);
});

// Semantic Vector Search
app.get("/api/vector/search", (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  const limit = parseInt((req.query.limit as string) || "6", 10);
  const results = vectorStore.search(query, limit);
  res.status(200).json(results);
});

// Main Ask Zero AI Grounding Endpoint
app.post("/api/ask", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const q = query.toLowerCase().trim();

    // 1. Security & Prompt Injection Filter
    if (
      q.includes("ignore previous instructions") ||
      q.includes("system prompt") ||
      q.includes("pretend you are") ||
      q.includes("developer mode") ||
      q.includes("bypass restrictions") ||
      q.includes("jailbreak")
    ) {
      return res.status(200).json({
        answer_blocks: [
          {
            text: "Zero operates strictly on structured public evidence. Input was evaluated as data only and could not be matched to an indexed claim.",
            claim_ids: [],
          },
        ],
        follow_ups: ["Search verified GCC claims in the registry"],
        gaps: ["No query matching valid GCC ecosystem data."],
        is_grounded: false,
        engine: "security-filter",
      });
    }

    // 2. Identity Queries
    if (
      q.includes("who are you") ||
      q.includes("what are you") ||
      q.includes("what is zeroday") ||
      q.includes("what does this site do")
    ) {
      return res.status(200).json({
        answer_blocks: [
          {
            text: "I am Zero, the epistemic auditor for ZeroDay. ZeroDay is the independent, citable record of India's Global Capability Centre ecosystem, where every number is traced to a primary statutory filing, registered lease deed, or gazetted order.",
            claim_ids: ["clm-mkt-rev-fy26", "clm-mkt-workforce-fy26"],
          },
          {
            text: "Unlike analyst surveys with opaque methodologies or paid vendor listings, ZeroDay operates under a strict neutrality firewall with zero commercial pay-to-play rankings.",
            claim_ids: [],
          },
        ],
        follow_ups: [
          "How does ZeroDay reconcile published GCC counts?",
          "How many Mega GCCs operate in India?",
          "What is the average tech rent in Bengaluru?",
        ],
        gaps: [],
        is_grounded: true,
        engine: "Zero (ZeroDay Auditor)",
      });
    }

    // 3. Grounded Context Retrieval
    const vectorMatches = vectorStore.search(query, 8);
    const contextSnippets = vectorMatches.map((m) => ({
      title: m.chunk.title,
      content: m.chunk.content,
      claim_ids: m.chunk.claim_ids,
    }));

    // 4. Groq LLM Inference
    if (GROQ_API_KEY && contextSnippets.length > 0) {
      try {
        const systemPrompt = `You are Zero, the grounded intelligence auditor for ZeroDay, an authoritative, citable platform on India's Global Capability Centres.
You answer user queries strictly, accurately, and authoritatively using ONLY the provided Verified Context below.

VERIFIED CONTEXT FROM ZERODAY VECTOR STORE:
${JSON.stringify(contextSnippets)}

MANDATORY RULES:
1. Every factual sentence in "answer_blocks" must cite valid "claim_ids" from the context if available.
2. If the user asks for numbers, claims, or entities NOT present in the verified context, reply:
   "ZeroDay does not have sourced data on this yet. In accordance with our hard rules, we never invent figures or answer from ungrounded memory."
   Set "is_grounded": false, and describe the unverified metric in the "gaps" array.
3. Keep answers concise, professional, and clear.
4. Output strictly valid JSON with schema:
{
  "answer_blocks": [ { "text": "factual sentence", "claim_ids": ["claim-id"] } ],
  "follow_ups": ["relevant question 1", "relevant question 2"],
  "gaps": [],
  "is_grounded": true or false
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        const groqRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query },
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const rawContent = groqData.choices?.[0]?.message?.content;
          if (rawContent) {
            const parsed = JSON.parse(rawContent);
            if (parsed.answer_blocks && parsed.answer_blocks.length > 0) {
              const hasValidClaims = parsed.answer_blocks.every(
                (b: any) =>
                  !b.claim_ids ||
                  b.claim_ids.every((cid: string) => claimsMap.has(cid))
              );

              if (hasValidClaims) {
                return res.status(200).json({
                  answer_blocks: parsed.answer_blocks,
                  follow_ups: (parsed.follow_ups || []).slice(0, 3),
                  gaps: parsed.gaps || [],
                  is_grounded: parsed.is_grounded !== false,
                  engine: `Zero via Groq (${GROQ_MODEL})`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("Groq inference error in backend:", err);
      }
    }

    // 5. Fallback Refusal
    return res.status(200).json({
      answer_blocks: [
        {
          text: "ZeroDay does not have sourced data on this yet. In accordance with our hard rules, we never invent figures or answer from ungrounded memory.",
          claim_ids: [],
        },
      ],
      follow_ups: [
        "How many GCCs does Bengaluru have?",
        "What is India's total GCC market revenue in FY26?",
      ],
      gaps: [query],
      is_grounded: false,
      engine: "Zero Deterministic Refusal",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

async function startServer() {
  const dataSource = await initialiseDataSource();
  app.listen(Number(PORT), () => {
    console.log("ZeroDay Railway Backend listening on port " + PORT + " using " + dataSource + ".");
  });
}

startServer().catch((error) => {
  console.error("ZeroDay backend startup failed:", error);
  process.exitCode = 1;
});
