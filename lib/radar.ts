import { Signal, SignalType } from "./schema";

export const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  incorporation: 30,
  gst_registration: 20,
  leadership_hire: 15,
  hiring_burst: 15,
  state_mou: 20,
  lease_announced: 25,
  press_intent: 10,
  office_inauguration: 35,
};

export type SignalContribution = {
  signal: Signal;
  baseWeight: number;
  decayFactor: number;
  decayedWeight: number;
  ageDays: number;
};

export type CompanyRadarScore = {
  companyName: string;
  score: number;
  status: "Rumoured" | "Likely" | "Imminent" | "Arrived";
  hasInauguration: boolean;
  contributingSignals: SignalContribution[];
  latestSignalDate: string;
  targetCities: string[];
};

/**
 * Computes likelihood score (0 to 100) for a company from signals in the last 180 days.
 * Exponential decay formula: decay = 0.5 ^ (age_days / 60)
 */
export function computeCompanyRadar(
  companyName: string,
  signals: Signal[],
  nowDateStr: string = "2026-10-21T00:00:00Z"
): CompanyRadarScore {
  const now = new Date(nowDateStr).getTime();
  const HALF_LIFE_DAYS = 60;
  const MAX_WINDOW_DAYS = 180;

  let rawTotal = 0;
  let hasInauguration = false;
  const contributing: SignalContribution[] = [];
  const cities = new Set<string>();
  let latestDate = "";

  // Sort signals newest first
  const sortedSignals = [...signals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const signal of sortedSignals) {
    if (signal.city) {
      cities.add(signal.city);
    }
    if (!latestDate || signal.date > latestDate) {
      latestDate = signal.date;
    }

    const signalTime = new Date(signal.date).getTime();
    const diffMs = now - signalTime;
    const ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Only consider signals within the 180-day window
    if (ageDays <= MAX_WINDOW_DAYS) {
      const baseWeight = SIGNAL_WEIGHTS[signal.type] ?? 10;
      const decayFactor = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
      const decayedWeight = Number((baseWeight * decayFactor).toFixed(1));

      rawTotal += decayedWeight;

      if (signal.type === "office_inauguration") {
        hasInauguration = true;
      }

      contributing.push({
        signal,
        baseWeight,
        decayFactor: Number(decayFactor.toFixed(3)),
        decayedWeight,
        ageDays,
      });
    }
  }

  const cappedScore = Math.min(100, Math.round(rawTotal));

  let status: "Rumoured" | "Likely" | "Imminent" | "Arrived";
  if (hasInauguration || cappedScore >= 85) {
    status = "Arrived";
  } else if (cappedScore >= 60) {
    status = "Imminent";
  } else if (cappedScore >= 30) {
    status = "Likely";
  } else {
    status = "Rumoured";
  }

  return {
    companyName,
    score: cappedScore,
    status,
    hasInauguration,
    contributingSignals: contributing,
    latestSignalDate: latestDate,
    targetCities: Array.from(cities),
  };
}

/**
 * Groups all signals by company name and computes radar rankings
 */
export function computeAllRadarScores(
  signals: Signal[],
  nowDateStr?: string
): CompanyRadarScore[] {
  const signalsByCompany = new Map<string, Signal[]>();

  signals.forEach((s) => {
    const key = s.company_name.trim();
    if (!signalsByCompany.has(key)) {
      signalsByCompany.set(key, []);
    }
    signalsByCompany.get(key)!.push(s);
  });

  const results: CompanyRadarScore[] = [];
  signalsByCompany.forEach((comps, companyName) => {
    results.push(computeCompanyRadar(companyName, comps, nowDateStr));
  });

  // Sort descending by score, then newest signal
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.latestSignalDate.localeCompare(a.latestSignalDate);
  });
}
