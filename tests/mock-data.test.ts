import { describe, it, expect } from "vitest";
import {
  getMockMerchants,
  getMockMerchant,
  getDefaultMockMerchant,
  getMockProducts,
  getMockProduct,
  getMockBusinessInfo,
} from "../src/mock-data.js";

describe("mock-data", () => {
  it("has 4 merchants", () => {
    expect(getMockMerchants()).toHaveLength(4);
  });

  it("merchants have different trust scores", () => {
    const scores = getMockMerchants().map((m) => m.trustScore);
    const unique = new Set(scores);
    expect(unique.size).toBe(4);
  });

  it("merchants are in different cities", () => {
    const cities = getMockMerchants().map((m) => m.city);
    const unique = new Set(cities);
    expect(unique.size).toBe(4);
  });

  it("merchants have different categories", () => {
    const cats = getMockMerchants().map((m) => m.category);
    const unique = new Set(cats);
    expect(unique.size).toBe(4);
  });

  it("getMockMerchant finds by slug", () => {
    const m = getMockMerchant("berlinbrew");
    expect(m).toBeDefined();
    expect(m!.name).toBe("Berlin Brew Co.");
  });

  it("getMockMerchant returns undefined for unknown slug", () => {
    expect(getMockMerchant("nonexistent")).toBeUndefined();
  });

  it("getDefaultMockMerchant returns first merchant", () => {
    const d = getDefaultMockMerchant();
    expect(d.slug).toBe("kukkakauppaliisa");
  });

  it("getMockProducts returns products for a slug", () => {
    const products = getMockProducts("berlinbrew");
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].id).toBe("prod_101");
  });

  it("getMockProduct finds specific product", () => {
    const p = getMockProduct("prod_001");
    expect(p).toBeDefined();
    expect(p!.name).toBe("Red Rose Bouquet");
  });

  it("getMockProduct returns undefined for unknown ID", () => {
    expect(getMockProduct("prod_999")).toBeUndefined();
  });

  it("getMockBusinessInfo returns business data", () => {
    const info = getMockBusinessInfo("kukkakauppaliisa");
    expect(info.business_name).toBe("Kukkakauppa Liisa");
    expect(info.contact.email).toBeDefined();
    expect(info.operating_hours.mon).toBeDefined();
  });

  it("all products have EUR currency", () => {
    for (const merchant of getMockMerchants()) {
      for (const product of merchant.products) {
        expect(product.currency).toBe("EUR");
      }
    }
  });

  it("all products have valid availability status", () => {
    const validStatuses = ["in_stock", "out_of_stock", "low_stock"];
    for (const merchant of getMockMerchants()) {
      for (const product of merchant.products) {
        expect(validStatuses).toContain(product.availability_status);
      }
    }
  });
});
