import { describe, it, expect } from "vitest";
import { computeCompanyRadar, computeAllRadarScores } from "../lib/radar";
import { Signal } from "../lib/schema";

describe("Radar Decay Scoring Logic", () => {
  const fixedNow = "2026-10-21T00:00:00Z";

  it("calculates likelihood score with exponential decay", () => {
    // 60 days before Oct 21, 2026 is approx Aug 22, 2026
    const signals: Signal[] = [
      {
        id: "s1",
        company_name: "TestCo",
        type: "incorporation", // weight 30
        date: "2026-10-21", // 0 days old -> factor 1.0 -> 30
        source_id: "src-1",
        note: "Fresh incorporation",
      },
      {
        id: "s2",
        company_name: "TestCo",
        type: "lease_announced", // weight 25
        date: "2026-08-22", // 60 days old -> factor 0.5 -> 12.5
        source_id: "src-1",
        note: "Lease signed 60 days ago",
      },
    ];

    const radar = computeCompanyRadar("TestCo", signals, fixedNow);
    // 30 + 12.5 = 42.5 -> rounds to 43
    expect(radar.score).toBe(43);
    expect(radar.status).toBe("Likely"); // 30 - 60 is Likely
    expect(radar.contributingSignals.length).toBe(2);
  });

  it("marks status as 'Arrived' when office_inauguration signal is present", () => {
    const signals: Signal[] = [
      {
        id: "s-inaug",
        company_name: "ArrivalCo",
        type: "office_inauguration",
        date: "2026-10-10",
        source_id: "src-1",
        note: "Ribbon cutting event",
      },
    ];

    const radar = computeCompanyRadar("ArrivalCo", signals, fixedNow);
    expect(radar.status).toBe("Arrived");
    expect(radar.hasInauguration).toBe(true);
  });

  it("ignores signals older than 180 days in radar score", () => {
    const signals: Signal[] = [
      {
        id: "s-old",
        company_name: "OldCo",
        type: "incorporation",
        date: "2025-01-01", // ~660 days old (>180)
        source_id: "src-1",
        note: "Very old signal",
      },
    ];

    const radar = computeCompanyRadar("OldCo", signals, fixedNow);
    expect(radar.score).toBe(0);
    expect(radar.status).toBe("Rumoured");
    expect(radar.contributingSignals.length).toBe(0);
  });
});
