import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getMockMerchants } from "../../src/mock-data.js";

describe("merchant discovery filtering", () => {
  const merchants = getMockMerchants();

  it("filters by category", () => {
    const results = merchants.filter(
      (m) => m.category.toLowerCase() === "florist",
    );
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("kukkakauppaliisa");
  });

  it("filters by city", () => {
    const results = merchants.filter(
      (m) => m.city.toLowerCase() === "berlin",
    );
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("berlinbrew");
  });

  it("filters by country", () => {
    const results = merchants.filter(
      (m) => m.country.toUpperCase() === "FI",
    );
    expect(results).toHaveLength(1);
  });

  it("filters by minimum trust score", () => {
    const results = merchants.filter((m) => m.trustScore >= 80);
    expect(results.length).toBeGreaterThanOrEqual(2);
    for (const m of results) {
      expect(m.trustScore).toBeGreaterThanOrEqual(80);
    }
  });

  it("returns empty array when no match", () => {
    const results = merchants.filter(
      (m) => m.category.toLowerCase() === "nonexistent",
    );
    expect(results).toHaveLength(0);
  });

  it("combined filters narrow results", () => {
    const results = merchants.filter(
      (m) =>
        m.country.toUpperCase() === "DE" && m.trustScore >= 90,
    );
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("berlinbrew");
  });
});
