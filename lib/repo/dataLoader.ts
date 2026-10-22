import fs from "fs";
import path from "path";
import {
  Source,
  SourceSchema,
  Claim,
  ClaimSchema,
  Gcc,
  GccSchema,
  City,
  CitySchema,
  State,
  StateSchema,
  Provider,
  ProviderSchema,
  ProofLink,
  ProofLinkSchema,
  Signal,
  SignalSchema,
  CountDefinition,
  CountDefinitionSchema,
  PublishedCount,
  PublishedCountSchema,
  Checklist,
  ChecklistSchema,
} from "../schema";

const DATA_DIR = path.resolve(process.cwd(), "data");

function loadFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found at: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as T;
}

// In-memory singletons for performance
let cachedSources: Source[] | null = null;
let cachedClaims: Claim[] | null = null;
let cachedGccs: Gcc[] | null = null;
let cachedCities: City[] | null = null;
let cachedStates: State[] | null = null;
let cachedProviders: Provider[] | null = null;
let cachedProofLinks: ProofLink[] | null = null;
let cachedSignals: Signal[] | null = null;
let cachedDefinitions: CountDefinition[] | null = null;
let cachedPublishedCounts: PublishedCount[] | null = null;
let cachedChecklists: Checklist[] | null = null;

export function loadSources(): Source[] {
  if (!cachedSources) {
    const raw = loadFile<any[]>("sources.json");
    cachedSources = raw.map((item) => SourceSchema.parse(item));
  }
  return cachedSources;
}

export function loadClaims(): Claim[] {
  if (!cachedClaims) {
    const raw = loadFile<any[]>("claims.json");
    cachedClaims = raw.map((item) => ClaimSchema.parse(item));
  }
  return cachedClaims;
}

export function loadGccs(): Gcc[] {
  if (!cachedGccs) {
    const raw = loadFile<any[]>("gccs.json");
    cachedGccs = raw.map((item) => GccSchema.parse(item));
  }
  return cachedGccs;
}

export function loadCities(): City[] {
  if (!cachedCities) {
    const raw = loadFile<any[]>("cities.json");
    cachedCities = raw.map((item) => CitySchema.parse(item));
  }
  return cachedCities;
}

export function loadStates(): State[] {
  if (!cachedStates) {
    const raw = loadFile<any[]>("states.json");
    cachedStates = raw.map((item) => StateSchema.parse(item));
  }
  return cachedStates;
}

export function loadProviders(): Provider[] {
  if (!cachedProviders) {
    const raw = loadFile<any[]>("providers.json");
    cachedProviders = raw.map((item) => ProviderSchema.parse(item));
  }
  return cachedProviders;
}

export function loadProofLinks(): ProofLink[] {
  if (!cachedProofLinks) {
    const raw = loadFile<any[]>("proofLinks.json");
    cachedProofLinks = raw.map((item) => ProofLinkSchema.parse(item));
  }
  return cachedProofLinks;
}

export function loadSignals(): Signal[] {
  if (!cachedSignals) {
    const raw = loadFile<any[]>("signals.json");
    cachedSignals = raw.map((item) => SignalSchema.parse(item));
  }
  return cachedSignals;
}

export function loadDefinitions(): CountDefinition[] {
  if (!cachedDefinitions) {
    const raw = loadFile<any[]>("definitions.json");
    cachedDefinitions = raw.map((item) => CountDefinitionSchema.parse(item));
  }
  return cachedDefinitions;
}

export function loadPublishedCounts(): PublishedCount[] {
  if (!cachedPublishedCounts) {
    const raw = loadFile<any[]>("publishedCounts.json");
    cachedPublishedCounts = raw.map((item) => PublishedCountSchema.parse(item));
  }
  return cachedPublishedCounts;
}

export function loadChecklists(): Checklist[] {
  if (!cachedChecklists) {
    const raw = loadFile<any[]>("checklists.json");
    cachedChecklists = raw.map((item) => ChecklistSchema.parse(item));
  }
  return cachedChecklists;
}
