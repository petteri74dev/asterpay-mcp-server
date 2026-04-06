import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, resetConfig, getConfig } from "../src/config.js";

function setEnv(overrides: Record<string, string>) {
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
}

function clearEnv() {
  const keys = [
    "MODE",
    "ASTERPAY_API_KEY",
    "ASTERPAY_API_URL",
    "MERCHANT_SLUG",
    "SPENDING_LIMIT_DAILY_EUR",
    "SPENDING_LIMIT_WEEKLY_EUR",
    "DEBUG",
    "MOCK",
  ];
  for (const key of keys) {
    delete process.env[key];
  }
}

describe("config", () => {
  beforeEach(() => {
    resetConfig();
    clearEnv();
  });

  afterEach(() => {
    resetConfig();
    clearEnv();
  });

  it("loads valid seller config", () => {
    setEnv({
      ASTERPAY_API_KEY: "ap_test_123",
      MERCHANT_SLUG: "testshop",
    });
    const config = loadConfig();
    expect(config.MODE).toBe("seller");
    expect(config.ASTERPAY_API_KEY).toBe("ap_test_123");
    expect(config.MERCHANT_SLUG).toBe("testshop");
    expect(config.MOCK).toBe(false);
  });

  it("loads mock mode without API key", () => {
    setEnv({ MOCK: "true" });
    const config = loadConfig();
    expect(config.MOCK).toBe(true);
    expect(config.ASTERPAY_API_KEY).toBeUndefined();
  });

  it("loads buyer mode with spending limits", () => {
    setEnv({
      MODE: "buyer",
      ASTERPAY_API_KEY: "ap_buyer_123",
      SPENDING_LIMIT_DAILY_EUR: "50",
      SPENDING_LIMIT_WEEKLY_EUR: "200",
    });
    const config = loadConfig();
    expect(config.MODE).toBe("buyer");
    expect(config.SPENDING_LIMIT_DAILY_EUR).toBe(50);
    expect(config.SPENDING_LIMIT_WEEKLY_EUR).toBe(200);
  });

  it("allows buyer mode in mock without spending limits", () => {
    setEnv({ MODE: "buyer", MOCK: "true" });
    const config = loadConfig();
    expect(config.MODE).toBe("buyer");
    expect(config.MOCK).toBe(true);
  });

  it("defaults to seller mode", () => {
    setEnv({ MOCK: "true" });
    const config = loadConfig();
    expect(config.MODE).toBe("seller");
  });

  it("defaults API URL to api.asterpay.io", () => {
    setEnv({ MOCK: "true" });
    const config = loadConfig();
    expect(config.ASTERPAY_API_URL).toBe("https://api.asterpay.io");
  });

  it("caches config via singleton", () => {
    setEnv({ MOCK: "true" });
    const first = loadConfig();
    const second = loadConfig();
    expect(first).toBe(second);
  });

  it("getConfig throws before loadConfig", () => {
    expect(() => getConfig()).toThrow("Config not loaded");
  });

  it("getConfig works after loadConfig", () => {
    setEnv({ MOCK: "true" });
    loadConfig();
    expect(() => getConfig()).not.toThrow();
  });

  it("exits on missing API key in non-mock mode", () => {
    const mockExit = vi
      .spyOn(process, "exit")
      .mockImplementation(() => {
        throw new Error("process.exit called");
      });

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it("exits on buyer mode without spending limits in non-mock", () => {
    setEnv({ MODE: "buyer", ASTERPAY_API_KEY: "ap_test_123" });

    const mockExit = vi
      .spyOn(process, "exit")
      .mockImplementation(() => {
        throw new Error("process.exit called");
      });

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
