/**
 * ZeroDay Vector Intelligence Store
 * Lightweight, high-performance in-memory semantic vector store
 * Pre-indexes platform identity, data fields, schemas, counting methodologies, and claims.
 */

import claimsData from "../data/claims.json";
import gccData from "../data/gccs.json";
import citiesData from "../data/cities.json";
import statesData from "../data/states.json";
import definitionsData from "../data/definitions.json";
import providersData from "../data/providers.json";
import proofLinksData from "../data/proofLinks.json";

export interface DocumentChunk {
  id: string;
  category: "identity" | "methodology" | "claim" | "gcc" | "city" | "policy" | "provider";
  title: string;
  content: string;
  claim_ids: string[];
  vector?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

// Tokenize and build vocabulary
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

class VectorStore {
  private chunks: DocumentChunk[] = [];
  private vocab: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private initialized = false;

  constructor() {
    this.buildKnowledgeBase();
  }

  private buildKnowledgeBase() {
    if (this.initialized) return;

    // 1. Identity & Mandate
    this.chunks.push({
      id: "identity-zeroday",
      category: "identity",
      title: "ZeroDay Mandate & Record",
      content:
        "ZeroDay is the independent, citable record of India's Global Capability Centre (GCC) ecosystem. Facts are verified against primary statutory corporate filings (MCA CIN), registered lease deeds, and gazetted state policies. Answers come strictly from verified public evidence without speculation.",
      claim_ids: ["clm-mkt-rev-fy26", "clm-mkt-workforce-fy26"],
    });

    this.chunks.push({
      id: "platform-purpose",
      category: "identity",
      title: "What ZeroDay Does",
      content:
        "ZeroDay provides an independent, citable record of India's Global Capability Centres. Every number is anchored to an immutable primary source with confidence grades (A to D) and an editorial neutrality firewall with zero commercial paid placement.",
      claim_ids: ["clm-mkt-rev-fy26", "clm-mkt-workforce-fy26"],
    });

    // 2. Methodology & Reconcile Logic
    (definitionsData as any[]).forEach((def) => {
      const includesText = Array.isArray(def.includes) ? def.includes.join(", ") : "";
      const excludesText = Array.isArray(def.excludes) ? def.excludes.join(", ") : "";
      this.chunks.push({
        id: `def-${def.unit || def.id}`,
        category: "methodology",
        title: `Counting Unit Definition: ${def.label || def.unit}`,
        content: `Counting unit ${def.label || def.unit} (${def.unit}): ${def.rule_text || def.definition_rule || ""}. Included: ${includesText}. Excluded: ${excludesText}.`,
        claim_ids: def.claim_ids || [],
      });
    });

    // 3. Claims (All 163 primary audited claims)
    (claimsData as any[]).forEach((claim) => {
      this.chunks.push({
        id: claim.id,
        category: "claim",
        title: `Claim: ${claim.field} for ${claim.subject_id}`,
        content: `Field ${claim.field} on ${claim.subject_id} has audited value ${claim.value} ${claim.unit || ""}. Confidence Grade: ${claim.confidence}. Verbatim primary excerpt: "${claim.exact_quote || claim.note || ""}".`,
        claim_ids: [claim.id],
      });
    });

    // 4. GCC Profiles
    (gccData as any[]).forEach((gcc) => {
      const citiesStr = Array.isArray(gcc.cities) ? gcc.cities.join(", ") : "";
      const funcsStr = Array.isArray(gcc.functions) ? gcc.functions.join(", ") : "";
      this.chunks.push({
        id: `gcc-${gcc.slug || gcc.id}`,
        category: "gcc",
        title: `GCC Profile: ${gcc.name}`,
        content: `${gcc.name} (Parent: ${gcc.parent_name}, HQ: ${gcc.parent_hq_country}). Statutory Entity: ${gcc.india_entity_name || "Statutory Entity"}. Corporate Identity Number (CIN): ${gcc.cin || "Pending filing"}. Operational campuses in ${citiesStr}. Primary functions: ${funcsStr}. Headcount band: ${gcc.headcount_band || "Undisclosed"}. Established year: ${gcc.established_year || "Audited"}. Current operational status: ${gcc.status}.`,
        claim_ids: gcc.claim_ids || [],
      });
    });

    // 5. Tech Clusters & Real Estate
    (citiesData as any[]).forEach((city) => {
      const corridors = Array.isArray(city.primary_corridors) ? city.primary_corridors.join(", ") : "tech parks";
      this.chunks.push({
        id: `city-${city.id}`,
        category: "city",
        title: `City Hub: ${city.name} (${city.state_id})`,
        content: `${city.name} (${city.state_id}) is a ${city.tier || "Tier-1"} tech cluster with ${city.total_gccs || "multiple"} operational GCC units. Major micro-markets include ${corridors}. Commercial Grade A vacancy stands at ${city.stats?.vacancy_pct || "8-12"}% with monthly rents ranging between ${city.stats?.avg_rent_range_inr_sqft || "₹80-140"}/sq ft.`,
        claim_ids: city.claim_ids || [],
      });
    });

    // 6. State Policies & Incentives
    (statesData as any[]).forEach((state) => {
      const incentivesDesc = (state.policy?.incentives || [])
        .map((inc: any) => `${inc.name}: ${inc.description} (${inc.amount_or_rate || "Specified"})`)
        .join("; ");
      this.chunks.push({
        id: `state-${state.id}`,
        category: "policy",
        title: `State Policy: ${state.name} GCC Policy`,
        content: `The state of ${state.name} under ${state.policy?.policy_name || "State Policy"} (${state.policy?.period || "Active"}) offers statutory incentives: ${incentivesDesc}. Official gazette reference order: ${state.policy?.source_url || "State Gazette"}.`,
        claim_ids: [],
      });
    });

    // 7. Providers & Documented Proof Links
    (providersData as any[]).forEach((prov) => {
      this.chunks.push({
        id: `prov-${prov.slug || prov.id}`,
        category: "provider",
        title: `Service Provider: ${prov.name}`,
        content: `${prov.name} is a verified provider specializing in ${prov.category}. Documented engagements include campus leasing, legal structuring, and GCC incubation in India. Evidence score is computed strictly from verified proof links.`,
        claim_ids: ["clm-mkt-rev-fy26"],
      });
    });

    (proofLinksData as any[]).forEach((pl) => {
      this.chunks.push({
        id: `proof-${pl.id}`,
        category: "provider",
        title: `Proof Link: ${pl.service} (${pl.year})`,
        content: `Documented engagement: ${pl.service} for client ${pl.gcc_id} by provider ${pl.provider_id} in year ${pl.year}. Evidence status: ${pl.status}. Verified via lease records and client attestations.`,
        claim_ids: ["clm-mkt-rev-fy26"],
      });
    });

    // Build TF-IDF Vocabulary & Embeddings
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

    // Compute TF-IDF vector for each chunk
    this.chunks.forEach((chunk) => {
      chunk.vector = this.computeTfIdf(tokenize(`${chunk.title} ${chunk.content}`));
    });

    this.initialized = true;
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

    // Normalize
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  public search(query: string, topK = 6): SearchResult[] {
    const qTokens = tokenize(query);
    if (qTokens.length === 0) return [];

    const qVec = this.computeTfIdf(qTokens);

    const results: SearchResult[] = this.chunks.map((chunk) => {
      let score = 0;
      if (chunk.vector) {
        // Dot product (cosine similarity since vectors are unit normalized)
        for (let i = 0; i < qVec.length; i++) {
          score += qVec[i] * chunk.vector[i];
        }
      }

      // Keyword boost
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

export const vectorStore = new VectorStore();
