import fs from "fs";
import path from "path";
import {
  SourceSchema,
  ClaimSchema,
  GccSchema,
  CitySchema,
  StateSchema,
  ProviderSchema,
  ProofLinkSchema,
  SignalSchema,
  CountDefinitionSchema,
  PublishedCountSchema,
  ChecklistSchema,
} from "../lib/schema";

const DATA_DIR = path.resolve(__dirname, "../data");

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function runValidation() {
  console.log("🔍 Validating ZeroDay data integrity...");
  let errors: string[] = [];

  // 1. Sources
  const rawSources = readJsonFile<any[]>("sources.json");
  const sourcesMap = new Map<string, any>();
  rawSources.forEach((s, idx) => {
    const res = SourceSchema.safeParse(s);
    if (!res.success) {
      errors.push(`sources.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      if (sourcesMap.has(s.id)) {
        errors.push(`sources.json duplicate ID: ${s.id}`);
      }
      sourcesMap.set(s.id, s);
      if (!s.url || !s.url.startsWith("http")) {
        errors.push(`sources.json [${s.id}] lacks a valid URL`);
      }
    }
  });

  // 2. Definitions
  const rawDefinitions = readJsonFile<any[]>("definitions.json");
  const definitionsMap = new Map<string, any>();
  rawDefinitions.forEach((d, idx) => {
    const res = CountDefinitionSchema.safeParse(d);
    if (!res.success) {
      errors.push(`definitions.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      definitionsMap.set(d.id, d);
    }
  });

  // 3. Published Counts
  const rawPublishedCounts = readJsonFile<any[]>("publishedCounts.json");
  rawPublishedCounts.forEach((p, idx) => {
    const res = PublishedCountSchema.safeParse(p);
    if (!res.success) {
      errors.push(`publishedCounts.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      if (!sourcesMap.has(p.source_id)) {
        errors.push(`publishedCounts.json [${p.id}] references unknown source_id: ${p.source_id}`);
      }
    }
  });

  // 4. Claims
  const rawClaims = readJsonFile<any[]>("claims.json");
  const claimsMap = new Map<string, any>();
  rawClaims.forEach((c, idx) => {
    const res = ClaimSchema.safeParse(c);
    if (!res.success) {
      errors.push(`claims.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      if (claimsMap.has(c.id)) {
        errors.push(`claims.json duplicate ID: ${c.id}`);
      }
      claimsMap.set(c.id, c);

      if (!c.source_id) {
        errors.push(`claims.json [${c.id}] lacks a source_id`);
      } else if (!sourcesMap.has(c.source_id)) {
        errors.push(`claims.json [${c.id}] references missing source_id: ${c.source_id}`);
      }
    }
  });

  // 5. Cities
  const rawCities = readJsonFile<any[]>("cities.json");
  const citiesMap = new Map<string, any>();
  rawCities.forEach((city, idx) => {
    const res = CitySchema.safeParse(city);
    if (!res.success) {
      errors.push(`cities.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      citiesMap.set(city.id, city);
      city.claim_ids.forEach((claimId: string) => {
        if (!claimsMap.has(claimId)) {
          errors.push(`cities.json [${city.id}] references missing claim_id: ${claimId}`);
        }
      });
    }
  });

  // 6. States & Policies
  const rawStates = readJsonFile<any[]>("states.json");
  const statesMap = new Map<string, any>();
  rawStates.forEach((state, idx) => {
    const res = StateSchema.safeParse(state);
    if (!res.success) {
      errors.push(`states.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      statesMap.set(state.id, state);
      if (!sourcesMap.has(state.policy.source_id)) {
        errors.push(`states.json [${state.id}] policy references missing source_id: ${state.policy.source_id}`);
      }
      state.policy.incentives.forEach((inc: any, iIdx: number) => {
        if (!sourcesMap.has(inc.source_id)) {
          errors.push(`states.json [${state.id}] incentive [${iIdx}] references missing source_id: ${inc.source_id}`);
        }
      });
    }
  });

  // Check city state_ids
  rawCities.forEach((city) => {
    if (!statesMap.has(city.state_id)) {
      errors.push(`cities.json [${city.id}] references missing state_id: ${city.state_id}`);
    }
  });

  // 7. GCCs
  const rawGccs = readJsonFile<any[]>("gccs.json");
  const gccsMap = new Map<string, any>();
  rawGccs.forEach((gcc, idx) => {
    const res = GccSchema.safeParse(gcc);
    if (!res.success) {
      errors.push(`gccs.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      if (gccsMap.has(gcc.id)) {
        errors.push(`gccs.json duplicate ID: ${gcc.id}`);
      }
      gccsMap.set(gcc.id, gcc);

      gcc.claim_ids.forEach((cId: string) => {
        if (!claimsMap.has(cId)) {
          errors.push(`gccs.json [${gcc.id}] references missing claim_id: ${cId}`);
        }
      });
    }
  });

  // 8. Providers
  const rawProviders = readJsonFile<any[]>("providers.json");
  const providersMap = new Map<string, any>();
  rawProviders.forEach((prov, idx) => {
    const res = ProviderSchema.safeParse(prov);
    if (!res.success) {
      errors.push(`providers.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      providersMap.set(prov.id, prov);
    }
  });

  // 9. Proof Links
  const rawProofLinks = readJsonFile<any[]>("proofLinks.json");
  rawProofLinks.forEach((pl, idx) => {
    const res = ProofLinkSchema.safeParse(pl);
    if (!res.success) {
      errors.push(`proofLinks.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      if (!providersMap.has(pl.provider_id)) {
        errors.push(`proofLinks.json [${pl.id}] references missing provider_id: ${pl.provider_id}`);
      }
      if (!gccsMap.has(pl.gcc_id)) {
        errors.push(`proofLinks.json [${pl.id}] references missing gcc_id: ${pl.gcc_id}`);
      }
      if (!pl.evidence || pl.evidence.length === 0) {
        errors.push(`proofLinks.json [${pl.id}] has no evidence items`);
      } else {
        pl.evidence.forEach((ev: any, evIdx: number) => {
          if (!sourcesMap.has(ev.source_id)) {
            errors.push(`proofLinks.json [${pl.id}] evidence [${evIdx}] references missing source_id: ${ev.source_id}`);
          }
        });
      }
    }
  });

  // 10. Signals
  const rawSignals = readJsonFile<any[]>("signals.json");
  rawSignals.forEach((sig, idx) => {
    const res = SignalSchema.safeParse(sig);
    if (!res.success) {
      errors.push(`signals.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    } else {
      if (!sourcesMap.has(sig.source_id)) {
        errors.push(`signals.json [${sig.id}] references missing source_id: ${sig.source_id}`);
      }
    }
  });

  // 11. Checklists
  const rawChecklists = readJsonFile<any[]>("checklists.json");
  rawChecklists.forEach((chk, idx) => {
    const res = ChecklistSchema.safeParse(chk);
    if (!res.success) {
      errors.push(`checklists.json [${idx}] invalid: ${JSON.stringify(res.error.format())}`);
    }
  });

  if (errors.length > 0) {
    console.error(`❌ Validation failed with ${errors.length} errors:`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log("✅ All data validated successfully!");
  console.log(`   - Sources: ${sourcesMap.size}`);
  console.log(`   - GCCs: ${gccsMap.size}`);
  console.log(`   - Claims: ${claimsMap.size}`);
  console.log(`   - Cities: ${citiesMap.size}`);
  console.log(`   - States: ${statesMap.size}`);
  console.log(`   - Providers: ${providersMap.size}`);
  console.log(`   - Proof Links: ${rawProofLinks.length}`);
  console.log(`   - Signals: ${rawSignals.length}`);
}

runValidation();
