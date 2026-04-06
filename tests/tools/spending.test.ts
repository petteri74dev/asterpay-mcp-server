import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, resetConfig } from "../../src/config.js";
import {
  checkSpendingLimit,
  recordSpending,
  spentToday,
  spentThisWeek,
  resetSpending,
} from "../../src/tools/spending.js";

function setupMockConfig(overrides: Record<string, string> = {}) {
  resetConfig();
  for (const key of Object.keys(process.env)) {
    if (
      key.startsWith("SPENDING_LIMIT") ||
      key === "MODE" ||
      key === "MOCK" ||
      key === "ASTERPAY_API_KEY"
    ) {
      delete process.env[key];
    }
  }
  process.env.MOCK = "true";
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
  loadConfig();
}

describe("spending", () => {
  beforeEach(() => {
    resetSpending();
  });

  afterEach(() => {
    resetSpending();
    resetConfig();
  });

  it("starts with zero spending", () => {
    setupMockConfig();
    expect(spentToday()).toBe(0);
    expect(spentThisWeek()).toBe(0);
  });

  it("records spending", () => {
    setupMockConfig();
    recordSpending(25);
    expect(spentToday()).toBe(25);
    expect(spentThisWeek()).toBe(25);
  });

  it("accumulates multiple records", () => {
    setupMockConfig();
    recordSpending(10);
    recordSpending(15);
    recordSpending(5);
    expect(spentToday()).toBe(30);
  });

  it("allows purchase when under daily limit", () => {
    setupMockConfig({ SPENDING_LIMIT_DAILY_EUR: "100" });
    const result = checkSpendingLimit(50);
    expect(result).toBeNull();
  });

  it("blocks purchase exceeding daily limit", () => {
    setupMockConfig({ SPENDING_LIMIT_DAILY_EUR: "100" });
    recordSpending(80);
    const result = checkSpendingLimit(30);
    expect(result).not.toBeNull();
    expect(result!.isError).toBe(true);
    expect(result!.content[0].text).toContain("Daily spending limit");
  });

  it("allows purchase when no limits set", () => {
    setupMockConfig();
    recordSpending(10000);
    const result = checkSpendingLimit(5000);
    expect(result).toBeNull();
  });

  it("blocks purchase exceeding weekly limit", () => {
    setupMockConfig({ SPENDING_LIMIT_WEEKLY_EUR: "200" });
    recordSpending(150);
    const result = checkSpendingLimit(60);
    expect(result).not.toBeNull();
    expect(result!.isError).toBe(true);
    expect(result!.content[0].text).toContain("Weekly spending limit");
  });

  it("blocks at exact limit boundary", () => {
    setupMockConfig({ SPENDING_LIMIT_DAILY_EUR: "100" });
    recordSpending(100);
    const result = checkSpendingLimit(0.01);
    expect(result).not.toBeNull();
  });

  it("allows purchase exactly at limit", () => {
    setupMockConfig({ SPENDING_LIMIT_DAILY_EUR: "100" });
    const result = checkSpendingLimit(100);
    expect(result).toBeNull();
  });

  it("resets spending correctly", () => {
    setupMockConfig();
    recordSpending(50);
    resetSpending();
    expect(spentToday()).toBe(0);
  });
});
