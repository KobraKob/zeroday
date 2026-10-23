import fs from "node:fs";
import path from "node:path";

export interface AskVectorMatch {
  score: number;
  chunk: {
    id: string;
    category?: string;
    title: string;
    content: string;
    claim_ids?: string[];
  };
}

export interface AskKnowledgeInput {
  query: string;
  claims: any[];
  gccs: any[];
  cities: any[];
  states: any[];
  vectorMatches: AskVectorMatch[];
}

export interface AskKnowledgeDocument {
  id: string;
  kind: string;
  title: string;
  content: string;
  claim_ids: string[];
  sources?: Array<{ id: string; name: string; publisher?: string; url?: string }>;
  retrieval_score?: number;
}

export interface AskKnowledgeResult {
  intent: "site_help" | "startup_guidance" | "data_question" | "mixed";
  documents: AskKnowledgeDocument[];
  allowedClaimIds: string[];
  context: string;
}

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "can", "could", "does", "for", "from",
  "have", "into", "its", "many", "more", "much", "need", "not", "our", "please",
  "show", "some", "tell", "that", "the", "their", "them", "there", "these", "this",
  "those", "through", "what", "when", "where", "which", "who", "why", "with",
  "would", "your", "you", "gcc", "india", "indian", "centre", "center", "company",
  "companies", "private", "limited",
]);

const SITE_GUIDE: AskKnowledgeDocument = {
  id: "site-guide",
  kind: "site_manual",
  title: "ZeroDay site guide and personality",
  content: [
    "ZeroDay is an independent, evidence-led reference for India's Global Capability Centre (GCC) ecosystem. Tone: calm, precise, neutral, candid, useful. Answer first. Explain the evidence boundary. Avoid hype and sales language.",
    "Navigation: /registry finds GCC records and supports filtering by city, sector, parent headquarters, size, status, and CIN. /reconcile compares published counts and counting units. /compare supports city-to-city comparisons. /radar shows emerging signals; a signal is an indicator, not automatically proof of a completed event. /providers lists service providers and documented provider-to-GCC proof links. /changelog lists changes and events. /methodology explains definitions and evidence rules. /advisor contains GCC planning checklists. /ask answers questions about the site's records and methods.",
    "How to get started with ZeroDay: open /registry and search a company, parent, city, sector, or function; inspect individual records and linked claims. When comparing market estimates, open /reconcile and compare like-for-like units (parent companies, legal entities, or operating centre units). For city comparison, use /compare. For provider due diligence, inspect /providers and distinguish a marketed claim from a documented proof link. For emerging developments, use /radar and seek corroborating records. Use /methodology to understand definitions and confidence.",
    "Starting a GCC in India: the site's planning checklists cover Corporate Entity & Regulatory Setup, Real Estate & Campus Selection, Talent Acquisition & People Operations, and Provider Ecosystem & Vendor Selection. Offer the relevant checklist steps when retrieved. This is planning material, not legal, tax, immigration, or investment advice. Verify current requirements and timelines with the linked official authority or a qualified professional.",
    "Important current UI limitation: /submit currently prepares an attestation preview in the browser session only. It does not persist the submission to a server-side review queue and does not send email-domain verification. Never claim an attestation was durably submitted or verified.",
    "Evidence policy: never invent a count, date, company relationship, source, or verification status. Use claim IDs only when those IDs occur in retrieved approved-claim context. Provider-marketed claims are not independently verified merely because they appear in a directory entry. Treat seeded/demo items as examples, not verified live events. If a data question is unsupported, state what record is missing and point to the most relevant site section.",
  ].join("\n"),
  claim_ids: [],
};

let jsonCache: Record<string, any[]> = {};

function loadJson(filename: string): any[] {
  if (jsonCache[filename]) return jsonCache[filename];
  const candidates = [
    path.resolve(process.cwd(), "data", filename),
    path.resolve(__dirname, "../../data", filename),
    path.resolve(__dirname, "../../../data", filename),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const value = JSON.parse(fs.readFileSync(candidate, "utf8"));
        jsonCache[filename] = Array.isArray(value) ? value : [];
        return jsonCache[filename];
      }
    } catch {
      // Optional context must never prevent an otherwise valid query.
    }
  }
  jsonCache[filename] = [];
  return [];
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function queryTokens(query: string): string[] {
  return [...new Set(normalize(query).split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word)))];
}

function textScore(query: string, values: unknown[]): number {
  const q = normalize(query);
  const words = queryTokens(query);
  const searchable = normalize(values.map((value) => typeof value === "string" ? value : JSON.stringify(value ?? "")).join(" "));
  if (!searchable) return 0;
  const searchableWords = new Set(searchable.split(" "));
  let score = 0;
  words.forEach((word) => {
    if (searchableWords.has(word)) score += word.length > 5 ? 2 : 1;
  });
  if (q.length > 3 && searchable.includes(q)) score += 8;
  return score;
}

function compact(value: unknown, maxChars = 1900): string {
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? String(value));
  return text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
}

function isPublicClaim(claim: any): boolean {
  const status = String(claim?.status ?? "approved").toLowerCase();
  return status === "approved" || status === "verified";
}

function classifyIntent(query: string): AskKnowledgeResult["intent"] {
  const q = normalize(query);

  const asksHowToStart =
    /\b(get started in this|how do i get started|how to get started|start a gcc|starting a gcc|set up a gcc|setting up a gcc|gcc setup|gcc formation|incorporate a company|company formation|first steps to establish)\b/.test(q);
  if (asksHowToStart) return "mixed";

  const dataQuestion =
    /\b(how many|count|counts|counting|number of|units|unit|revenue|workforce|headcount|vacancy|rent|cin|incorporated|established|percentage|percent|market share|salary|pay premium|subsidy|subsidies|incentive|incentives|published estimate|growth rate|market size|how much)\b/.test(q);
  if (dataQuestion) return "data_question";

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/.test(q)) return "site_help";
  const directSiteHelp =
    /\b(what is zeroday|what does zeroday do|how do i use|how to use|how do i navigate|navigate this site|use this site|use this website|where can i find|where do i find|where is the|explain this site|explain this website|site features|website features|help me navigate|how does this site work|how does the website work)\b/.test(q) ||
    (/\b(zeroday|registry|reconcile|compare|providers|radar|changelog|advisor|methodology|registry|reconcile|compare|providers|radar|changelog|advisor|methodology)\b/.test(q) &&
     /\b(how|where|what|use|find|navigate|explain|help|start|begin)\b/.test(q));
  if (directSiteHelp) return "site_help";

  const startup =
    /\b(start|started|starting|setup|set up|establish|launch|incorporate|hire|location|campus|first steps|build)\b/.test(q) &&
    /\b(gcc|centre|center|india|company|business|this|it|one)\b/.test(q);
  if (startup) return "startup_guidance";

  return "data_question";
}

export function buildAskKnowledge(input: AskKnowledgeInput): AskKnowledgeResult {
  const query = input.query.trim();
  const q = normalize(query);
  const intent = classifyIntent(query);
  const claims = input.claims.filter(isPublicClaim);
  const claimMap = new Map<string, any>(claims.map((claim) => [String(claim.id), claim]));
  const sourceRows = loadJson("sources.json");
  const sourceMap = new Map<string, any>(sourceRows.map((source) => [String(source.id), source]));
  const providers = loadJson("providers.json");
  const proofLinks = loadJson("proofLinks.json");
  const checklists = loadJson("checklists.json");
  const publishedCounts = loadJson("publishedCounts.json");
  const definitions = loadJson("definitions.json");
  const rawCities = loadJson("cities.json");
  const signals = loadJson("signals.json");

  const documents: AskKnowledgeDocument[] = [];
  const docIds = new Set<string>();
  let charBudget = 19000;

  const sourceFor = (sourceId: unknown) => {
    if (!sourceId) return undefined;
    const source = sourceMap.get(String(sourceId));
    if (!source) return undefined;
    return { id: source.id, name: source.name, publisher: source.publisher, url: source.url };
  };

  const addDocument = (doc: AskKnowledgeDocument, priority = false) => {
    if (!doc.id || docIds.has(doc.id) || documents.length >= 18) return;
    const claimIds = [...new Set((doc.claim_ids || []).map(String).filter((id) => claimMap.has(id)))];
    const normalizedDoc: AskKnowledgeDocument = {
      ...doc,
      content: compact(doc.content, priority ? 2800 : 1600),
      claim_ids: claimIds,
      sources: (doc.sources || []).filter((source) => Boolean(source?.url || source?.name)).slice(0, 5),
    };
    const estimatedSize = normalizedDoc.content.length + normalizedDoc.title.length + 180;
    if (!priority && estimatedSize > charBudget) return;
    docIds.add(doc.id);
    documents.push(normalizedDoc);
    charBudget -= estimatedSize;
  };

  // Product documentation is always available, even when claim retrieval returns no useful match.
  addDocument(SITE_GUIDE, true);

  const claimContent = (claim: any): AskKnowledgeDocument => ({
    id: "approved-claim-" + claim.id,
    kind: "approved_claim",
    title: claim.field + " — " + claim.subject_type + ":" + claim.subject_id,
    content: [
      "Subject: " + claim.subject_type + ":" + claim.subject_id,
      "Field: " + claim.field,
      "Value: " + JSON.stringify(claim.value) + (claim.unit ? " " + claim.unit : ""),
      "As of: " + (claim.as_of || "not recorded"),
      "Confidence grade: " + (claim.confidence || "not recorded"),
      "Status: " + (claim.status || "approved"),
      claim.note ? "Note: " + claim.note : "",
      claim.exact_quote ? "Source excerpt: " + claim.exact_quote : "",
    ].filter(Boolean).join("\n"),
    claim_ids: [String(claim.id)],
    sources: [sourceFor(claim.source_id)].filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
  });

  // Use the vector index, but rebuild claim content from approved claim records.
  for (const match of [...input.vectorMatches].sort((a, b) => b.score - a.score)) {
    const chunk = match.chunk;
    if (!chunk?.id || !chunk.title || !Number.isFinite(match.score)) continue;
    const category = String(chunk.category || "record");
    if (category === "claim") {
      const claim = claimMap.get(String(chunk.id));
      if (!claim) continue;
      const doc = claimContent(claim);
      doc.retrieval_score = Number(match.score.toFixed(4));
      addDocument(doc);
      continue;
    }
    const filteredClaimIds = (chunk.claim_ids || []).map(String).filter((id) => claimMap.has(id));
    if (match.score < 0.17 && textScore(query, [chunk.title, chunk.content]) < 2) continue;
    const linkedSources = filteredClaimIds
      .map((id) => sourceFor(claimMap.get(id)?.source_id))
      .filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>;
    addDocument({
      id: "retrieved-" + chunk.id,
      kind: category,
      title: chunk.title,
      content: chunk.content,
      claim_ids: filteredClaimIds,
      sources: linkedSources,
      retrieval_score: Number(match.score.toFixed(4)),
    });
  }

  const namedScore = (record: any, fields: string[]) => textScore(query, fields.map((field) => record?.[field]));
  const namedGccs = input.gccs
    .map((gcc) => ({ gcc, score: namedScore(gcc, ["name", "parent_name", "slug", "india_entity_name", "cin"]) }))
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  for (const item of namedGccs) {
    const gcc = item.gcc;
    const claimIds = (gcc.claim_ids || []).map(String).filter((id: string) => claimMap.has(id));
    const relatedClaims = claimIds.map((id: string) => claimMap.get(id)).filter(Boolean);
    addDocument({
      id: "gcc-profile-" + (gcc.id || gcc.slug || gcc.name),
      kind: "gcc_profile",
      title: "GCC profile: " + gcc.name,
      content: [
        "Name: " + gcc.name,
        "Parent company: " + (gcc.parent_name || "not recorded"),
        "Parent headquarters: " + (gcc.parent_hq_country || "not recorded"),
        "India legal entity: " + (gcc.india_entity_name || "not recorded"),
        "CIN: " + (gcc.cin || "not recorded") + " (" + (gcc.cin_status || "status not recorded") + ")",
        "Cities: " + ((gcc.cities || []).join(", ") || "not recorded"),
        "Sector: " + (gcc.sector || "not recorded"),
        "Functions: " + ((gcc.functions || []).join(", ") || "not recorded"),
        "Headcount band: " + (gcc.headcount_band || "not recorded"),
        "Established year: " + (gcc.established_year ?? "not recorded"),
        "Operating status: " + (gcc.status || "not recorded"),
        "Approved claim details: " + (relatedClaims.map((claim: any) => claim.field + "=" + JSON.stringify(claim.value) + " (" + claim.id + ")").join("; ") || "No linked approved claims in this context."),
      ].join("\n"),
      claim_ids: claimIds,
      sources: relatedClaims.map((claim: any) => sourceFor(claim.source_id)).filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
    });
  }

  const matchedCity = rawCities.find((city) => normalize(city.name).length > 2 && q.includes(normalize(city.name)));
  if (matchedCity) {
    const cityName = String(matchedCity.name);
    const cityClaimIds = (matchedCity.claim_ids || []).map(String).filter((id: string) => claimMap.has(id));
    addDocument({
      id: "city-profile-" + (matchedCity.id || cityName),
      kind: "city_profile",
      title: "City record: " + cityName,
      content: compact({
        name: cityName,
        state_id: matchedCity.state_id,
        tier: matchedCity.tier,
        total_gccs: matchedCity.total_gccs,
        primary_corridors: matchedCity.primary_corridors,
        stats: matchedCity.stats,
      }, 2300),
      claim_ids: cityClaimIds,
      sources: cityClaimIds.map((id: string) => sourceFor(claimMap.get(id)?.source_id)).filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
    }, true);

    if (/\b(which|list|show|who|centres|centers|companies|gccs)\b/.test(q)) {
      const cityGccs = input.gccs.filter((gcc) => (gcc.cities || []).some((city: string) => normalize(city) === normalize(cityName))).slice(0, 12);
      if (cityGccs.length) {
        addDocument({
          id: "gcc-city-list-" + normalize(cityName).replace(/\s+/g, "-"),
          kind: "gcc_directory_results",
          title: "GCCs listed in " + cityName,
          content: cityGccs.map((gcc) => [
            gcc.name + " | parent: " + (gcc.parent_name || "not recorded"),
            "sector: " + (gcc.sector || "not recorded"),
            "functions: " + ((gcc.functions || []).join(", ")),
            "status: " + (gcc.status || "not recorded"),
            "CIN: " + (gcc.cin || "not recorded"),
            "claim IDs: " + ((gcc.claim_ids || []).map(String).filter((id: string) => claimMap.has(id)).join(", ") || "none linked"),
          ].join("\n")).join("\n\n"),
          claim_ids: cityGccs.flatMap((gcc) => (gcc.claim_ids || []).map(String)).filter((id: string) => claimMap.has(id)),
        }, true);
      }
    }
  }

  const matchedStates = input.states
    .map((state) => ({ state, score: namedScore(state, ["name", "id"]) }))
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const policyIntent = /\b(policy|policies|incentive|incentives|subsidy|subsidies|stamp duty|rebate|tax benefit)\b/.test(q);
  const statesToInclude = matchedStates.map((item) => item.state);
  if (policyIntent && statesToInclude.length === 0) statesToInclude.push(...input.states.slice(0, 5));
  for (const state of statesToInclude) {
    const claimIds = [...(state.claim_ids || []), ...(state.policy?.claim_ids || [])].map(String).filter((id: string) => claimMap.has(id));
    addDocument({
      id: "state-policy-" + (state.id || state.name),
      kind: "state_policy",
      title: String(state.name) + " policy and incentives",
      content: compact({ state: state.name, policy: state.policy }, 2000),
      claim_ids: claimIds,
      sources: [sourceFor(state.policy?.source_id)].filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
    });
  }

  const providerIntent = /\b(provider|providers|advisor|adviser|vendor|supplier|law firm|legal|real estate|property|recruit|recruitment|audit|tax|payroll|eor|ansr|jll|cbre|zinnov|deloitte|pwc|ey)\b/.test(q);
  const providerMatched = providers
    .map((provider) => ({ provider, score: textScore(query, [provider.name, provider.category, provider.slug, provider.cities, provider.marketed_claims]) }))
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score);
  if (providerIntent) {
    const selectedProviders = (providerMatched.length ? providerMatched : providers.map((provider) => ({ provider, score: 0 }))).slice(0, 7);
    for (const item of selectedProviders) {
      const provider = item.provider;
      addDocument({
        id: "provider-" + (provider.id || provider.slug || provider.name),
        kind: "provider_directory",
        title: "Provider directory entry: " + provider.name,
        content: [
          "Name: " + provider.name,
          "Category: " + provider.category,
          "Listed cities: " + ((provider.cities || []).join(", ")),
          "Provider-listed service claims (not independently verified by this field): " + ((provider.marketed_claims || []).join(" | ")),
          "Linked claim IDs: " + ((provider.claim_ids || []).map(String).filter((id: string) => claimMap.has(id)).join(", ") || "none"),
        ].join("\n"),
        claim_ids: (provider.claim_ids || []).map(String).filter((id: string) => claimMap.has(id)),
      });
    }

    const selectedProviderIds = new Set(selectedProviders.map((item) => String(item.provider.id)));
    const directProofLinks = proofLinks.filter((link) => selectedProviderIds.has(String(link.provider_id))).slice(0, 8);
    for (const link of directProofLinks) {
      const provider = providers.find((item) => String(item.id) === String(link.provider_id));
      const gcc = input.gccs.find((item) => String(item.id) === String(link.gcc_id));
      const evidenceText = (link.evidence || []).map((evidence: any) => {
        const source = sourceFor(evidence.source_id);
        return String(evidence.kind || "evidence") + ": " + String(evidence.excerpt_summary || "No summary") +
          (source ? " — " + source.name + (source.url ? " (" + source.url + ")" : "") : "");
      }).join("\n");
      addDocument({
        id: "proof-link-" + link.id,
        kind: "provider_proof_link",
        title: "Provider engagement record: " + (provider?.name || link.provider_id) + " / " + (gcc?.name || link.gcc_id),
        content: "Client: " + (gcc?.name || link.gcc_id) + "\nProvider: " + (provider?.name || link.provider_id) +
          "\nService: " + link.service + "\nYear: " + (link.year || "not recorded") +
          "\nProof-link status: " + link.status + "\nEvidence listed on the record:\n" + (evidenceText || "No evidence summary available."),
        claim_ids: [],
        sources: (link.evidence || []).map((evidence: any) => sourceFor(evidence.source_id)).filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
      });
    }
  }

  const countIntent = /\b(count|counts|counting|units|unit|number of|how many|reconcile|discrepanc|different estimates|published estimate|market size)\b/.test(q);
  if (countIntent) {
    for (const definition of definitions.slice(0, 10)) {
      const score = textScore(query, [definition.label, definition.unit, definition.rule_text, definition.includes, definition.excludes]);
      if (score >= 1 || /\b(count|counts|counting|units|unit|reconcile|discrepanc)\b/.test(q)) {
        addDocument({
          id: "count-definition-" + (definition.id || definition.unit),
          kind: "counting_methodology",
          title: "Counting methodology: " + (definition.label || definition.unit),
          content: compact(definition, 1500),
          claim_ids: (definition.claim_ids || []).map(String).filter((id: string) => claimMap.has(id)),
          sources: [sourceFor(definition.source_id)].filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
        });
      }
    }
    const matchedCounts = publishedCounts
      .map((count) => ({ count, score: textScore(query, [count.publisher, count.headline_count, count.unit_claimed, count.unit_type, count.note, count.as_of]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, queryTokens(query).length > 2 ? 6 : 4);
    for (const item of matchedCounts) {
      const count = item.count;
      addDocument({
        id: "published-count-" + count.id,
        kind: "published_count",
        title: "Published count: " + count.publisher,
        content: [
          "Publisher: " + count.publisher,
          "Published headline: " + count.headline_count,
          "Numeric count: " + (count.count_value ?? "not normalised"),
          "Claimed counting unit: " + count.unit_claimed + " (" + (count.unit_type || "unknown") + ")",
          "As of: " + (count.as_of || "not recorded"),
          "Definition known: " + (count.definition_known ? "yes" : "no"),
          "Dataset note: " + (count.note || "none"),
        ].join("\n"),
        claim_ids: [],
        sources: [sourceFor(count.source_id)].filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
      });
    }
  }

  const startupIntent = /\b(start|started|starting|setup|set up|establish|launch|incorporat|first steps|hire|hiring|campus selection|vendor selection)\b/.test(q);
  const siteHelpIntent = intent === "site_help" || intent === "mixed";
  if (startupIntent || siteHelpIntent) {
    const entityIntent = /\b(entity|incorporat|company formation|legal|statutory|regulatory|mca|rbi|pan|tan)\b/.test(q);
    const locationIntent = /\b(real estate|location|campus|office|lease|property|workspace)\b/.test(q);
    const talentIntent = /\b(talent|hire|hiring|workforce|staff|recruit)\b/.test(q);
    const vendorIntent = /\b(provider|providers|vendor|vendors|supplier|payroll|eor|audit|tax counsel)\b/.test(q);
    let selectedChecklists = checklists;
    if (entityIntent) selectedChecklists = checklists.filter((item) => item.stage === "entity_formation");
    else if (locationIntent) selectedChecklists = checklists.filter((item) => item.stage === "real_estate");
    else if (talentIntent) selectedChecklists = checklists.filter((item) => item.stage === "talent_hiring");
    else if (vendorIntent) selectedChecklists = checklists.filter((item) => item.stage === "vendor_selection");
    else if (!startupIntent) selectedChecklists = [];
    for (const checklist of selectedChecklists.slice(0, 4)) {
      const items = (checklist.items || []).map((item: any) => ({
        step: item.step,
        title: item.title,
        description: item.description,
        timeline: item.timeline || undefined,
        mandatory: item.mandatory,
        official_url: item.official_url || undefined,
      }));
      addDocument({
        id: "gcc-checklist-" + checklist.id,
        kind: "site_checklist",
        title: checklist.title,
        content: String(checklist.description || "") + "\n" + JSON.stringify(items),
        claim_ids: [],
        sources: items.filter((item: any) => item.official_url).map((item: any) => ({
          id: "official-" + normalize(item.official_url).replace(/\s+/g, "-"),
          name: item.step,
          url: item.official_url,
        })),
      }, true);
    }
  }

  const signalIntent = /\b(radar|signal|signals|hiring burst|expansion|expanding|lease announced|inaugurat|latest activity)\b/.test(q);
  if (signalIntent) {
    const selectedSignals = signals
      .map((signal) => ({ signal, score: textScore(query, [signal.company_name, signal.type, signal.city, signal.note, signal.date]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    for (const item of selectedSignals) {
      const signal = item.signal;
      addDocument({
        id: "signal-" + signal.id,
        kind: "signal_record",
        title: String(signal.type) + ": " + String(signal.company_name),
        content: String(signal.company_name) + " | type: " + String(signal.type) + " | date: " + String(signal.date) +
          " | city: " + String(signal.city || "not recorded") + " | demo: " + (signal.demo ? "sample/demo record" : "not marked demo") +
          " | note: " + String(signal.note || ""),
        claim_ids: (signal.claim_ids || []).map(String).filter((id: string) => claimMap.has(id)),
        sources: [sourceFor(signal.source_id)].filter(Boolean) as NonNullable<AskKnowledgeDocument["sources"]>,
      });
    }
  }

  const allowedClaimIds = [...new Set(documents.flatMap((doc) => doc.claim_ids))];
  const serializedDocuments = documents.map((doc) => ({
    id: doc.id,
    kind: doc.kind,
    title: doc.title,
    content: doc.content,
    claim_ids: doc.claim_ids,
    sources: doc.sources,
    retrieval_score: doc.retrieval_score,
  }));
  let serialized = JSON.stringify(serializedDocuments);
  while (serialized.length > 23000 && serializedDocuments.length > 1) {
    serializedDocuments.pop();
    serialized = JSON.stringify(serializedDocuments);
  }
  const finalAllowedClaimIds = [...new Set(
    serializedDocuments.flatMap((doc) => Array.isArray(doc.claim_ids) ? doc.claim_ids : [])
  )];
  return {
    intent,
    documents: documents.filter((doc) => serializedDocuments.some((serializedDoc) => serializedDoc.id === doc.id)),
    allowedClaimIds: finalAllowedClaimIds,
    context: serialized,
  };
}
