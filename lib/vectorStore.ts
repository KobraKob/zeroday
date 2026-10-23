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
import signalsData from "../data/signals.json";
import publishedCountsData from "../data/publishedCounts.json";
import checklistsData from "../data/checklists.json";
import sourcesData from "../data/sources.json";

export interface DocumentChunk {
  id: string;
  category: "identity" | "methodology" | "claim" | "gcc" | "city" | "policy" | "provider" | "signal" | "published_count" | "checklist" | "source";
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
      claim_ids: [],
    });

    this.chunks.push({
      id: "platform-purpose",
      category: "identity",
      title: "What ZeroDay Does",
      content:
        "ZeroDay provides an independent, citable record of India's Global Capability Centres. Every number is anchored to an immutable primary source with confidence grades (A to D) and an editorial neutrality firewall with zero commercial paid placement.",
      claim_ids: [],
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
        content: `${gcc.name} (Parent: ${gcc.parent_name || "not listed"}, HQ: ${gcc.parent_hq_country || "not listed"}). Statutory Entity: ${gcc.india_entity_name || "not listed"}. Corporate Identification Number (CIN): ${gcc.cin || "not listed"}. Listed campuses: ${citiesStr || "not listed"}. Listed functions: ${funcsStr || "not listed"}. Headcount band: ${gcc.headcount_band || "not listed"}. Established year: ${gcc.established_year ?? "not listed"}. Status: ${gcc.status || "not listed"}. Sector: ${gcc.sector || "not listed"}.`,
        claim_ids: Array.isArray(gcc.claim_ids) ? gcc.claim_ids : [],
      });
    });

    // 5. Tech Clusters & Real Estate
    (citiesData as any[]).forEach((city) => {
      const corridors = Array.isArray(city.primary_corridors) ? city.primary_corridors.join(", ") : "";
      const cityMetrics = [
        city.total_gccs != null ? `Listed GCC units: ${city.total_gccs}.` : "",
        city.stats?.vacancy_pct != null ? `Listed Grade A vacancy: ${city.stats.vacancy_pct}%.` : "",
        city.stats?.avg_rent_range_inr_sqft != null ? `Listed average rent range: ${city.stats.avg_rent_range_inr_sqft} per sq ft.` : "",
      ].filter(Boolean).join(" ");
      this.chunks.push({
        id: `city-${city.id}`,
        category: "city",
        title: `City Hub: ${city.name} (${city.state_id})`,
        content: `${city.name} (${city.state_id || "state not listed"}). Tier: ${city.tier || "not listed"}. Listed micro-markets: ${corridors || "not listed"}. ${cityMetrics}`,
        claim_ids: Array.isArray(city.claim_ids) ? city.claim_ids : [],
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
      const providerCities = Array.isArray(prov.cities) ? prov.cities.join(", ") : "";
      const marketedClaims = Array.isArray(prov.marketed_claims) ? prov.marketed_claims.join("; ") : "";
      this.chunks.push({
        id: `prov-${prov.slug || prov.id}`,
        category: "provider",
        title: `Listed Service Provider: ${prov.name}`,
        content: `Listed provider: ${prov.name}. Category: ${prov.category || "not listed"}. City footprint: ${providerCities || "not listed"}. Provider-supplied claims (not independently confirmed here): ${marketedClaims || "none listed"}.`,
        claim_ids: Array.isArray(prov.claim_ids) ? prov.claim_ids : [],
      });
    });

    (proofLinksData as any[]).forEach((pl) => {
      const evidenceSummary = Array.isArray(pl.evidence)
        ? pl.evidence.map((item: any) => `${item.kind || "evidence"} from source ${item.source_id || "not linked"}: ${item.excerpt_summary || "no excerpt summary"}`).join("; ")
        : "no evidence detail listed";
      this.chunks.push({
        id: `proof-${pl.id}`,
        category: "provider",
        title: `Proof Link: ${pl.service || "service not listed"} (${pl.year ?? "year not listed"})`,
        content: `Listed engagement record: service ${pl.service || "not listed"}; client record ID ${pl.gcc_id || "not listed"}; provider record ID ${pl.provider_id || "not listed"}; year ${pl.year ?? "not listed"}; status ${pl.status || "not listed"}. Evidence items: ${evidenceSummary}.`,
        claim_ids: Array.isArray(pl.claim_ids) ? pl.claim_ids : [],
      });
    });

    // 8. Radar signals
    (signalsData as any[]).forEach((signal) => {
      this.chunks.push({
        id: `signal-${signal.id}`,
        category: "signal",
        title: `Signal: ${signal.company_name || signal.title || "Company not listed"} — ${signal.type}`,
        content: `Signal company: ${signal.company_name || "not listed"}. Type: ${signal.type}. Date: ${signal.date}. City: ${signal.city || "not listed"}. Note: ${signal.note || signal.summary || "not listed"}. Source ID: ${signal.source_id || "not listed"}.`,
        claim_ids: Array.isArray(signal.claim_ids) ? signal.claim_ids : [],
      });
    });

    // 9. Published estimates used by Reconcile
    (publishedCountsData as any[]).forEach((record) => {
      this.chunks.push({
        id: `published-count-${record.id}`,
        category: "published_count",
        title: `Published GCC Count: ${record.publisher}`,
        content: `Publisher: ${record.publisher}. Published headline: ${record.headline_count}. Claimed unit: ${record.unit_claimed}. Unit type: ${record.unit_type || "unknown"}. As of: ${record.as_of}. Definition known: ${record.definition_known}. Note: ${record.note || ""}. Source ID: ${record.source_id || "not listed"}.`,
        claim_ids: [],
      });
    });

    // 10. Guided market-entry checklists
    (checklistsData as any[]).forEach((checklist) => {
      const items = Array.isArray(checklist.items)
        ? checklist.items.map((item: any) => `${item.title}: ${item.description}${item.official_url ? ` (official link: ${item.official_url})` : ""}`).join("; ")
        : "";
      this.chunks.push({
        id: `checklist-${checklist.id}`,
        category: "checklist",
        title: `Entry Checklist: ${checklist.title || checklist.stage}`,
        content: `Checklist stage: ${checklist.stage}. ${checklist.title}. ${checklist.description || ""}. Steps: ${items}.`,
        claim_ids: [],
      });
    });

    // 11. Source directory for provenance lookup
    (sourcesData as any[]).forEach((source) => {
      this.chunks.push({
        id: `source-${source.id}`,
        category: "source",
        title: `Source Record: ${source.name}`,
        content: `Source: ${source.name}. Publisher: ${source.publisher}. Type: ${source.type}. Published: ${source.published_at || "not listed"}. Retrieved: ${source.retrieved_at || "not listed"}. URL: ${source.url}. Source ID: ${source.id}.`,
        claim_ids: [],
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
