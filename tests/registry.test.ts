import { describe, it, expect } from "vitest";
import sectorsData from "../data/sectors.json";
import gccsData from "../data/gccs.json";

const CIN_REGEX = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

describe("Registry Data & CIN Integrity", () => {
  it("validates 21-character MCA CIN format regex", () => {
    // Valid standard Private Limited CIN
    expect(CIN_REGEX.test("U72900KA2003PTC033028")).toBe(true);
    // Valid standard Public Limited CIN
    expect(CIN_REGEX.test("L31300KA1987PLC035230")).toBe(true);
    // Valid Foreign Subsidiary Limited CIN
    expect(CIN_REGEX.test("U72200KA2004FTC034233")).toBe(true);

    // Invalid length (20 chars)
    expect(CIN_REGEX.test("U72900KA2003PTC03302")).toBe(false);
    // Invalid prefix (not U or L)
    expect(CIN_REGEX.test("X72900KA2003PTC033028")).toBe(false);
    // Invalid characters in state code
    expect(CIN_REGEX.test("U72900992003PTC033028")).toBe(false);
    // Empty or null
    expect(CIN_REGEX.test("")).toBe(false);
  });

  it("verifies all 50 GCC records have valid formatted CIN strings", () => {
    expect(gccsData.length).toBe(50);
    for (const gcc of gccsData) {
      if (gcc.cin) {
        expect(CIN_REGEX.test(gcc.cin)).toBe(true);
      }
    }
  });

  it("collapses all 45 granular sectors cleanly into 8 top-level sectors", () => {
    const { topLevelSectors, mapping } = sectorsData;
    expect(topLevelSectors.length).toBe(8);

    const mappedTopLevels = new Set(Object.values(mapping));
    expect(mappedTopLevels.size).toBe(8);

    for (const gcc of gccsData) {
      const topLevel = (mapping as Record<string, string>)[gcc.sector];
      expect(topLevel).toBeDefined();
      expect(topLevelSectors.includes(topLevel)).toBe(true);
    }
  });

  it("computes exact GCC ecosystem metrics from raw records", () => {
    const totalCentres = gccsData.length;
    const uniqueCities = new Set(gccsData.flatMap((g) => g.cities));
    const verifiedCins = gccsData.filter((g) => g.cin_status === "verified");

    expect(totalCentres).toBe(50);
    expect(uniqueCities.size).toBe(9);
    expect(verifiedCins.length).toBe(32);

    const tracedPct = Math.round((verifiedCins.length / totalCentres) * 100);
    expect(tracedPct).toBe(64);
  });
});
