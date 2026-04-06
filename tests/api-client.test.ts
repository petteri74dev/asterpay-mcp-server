import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mcpText, mcpError } from "../src/api-client.js";
import { loadConfig, resetConfig } from "../src/config.js";

describe("mcpText", () => {
  it("wraps data as text content", () => {
    const result = mcpText({ foo: "bar" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.foo).toBe("bar");
  });

  it("pretty-prints JSON", () => {
    const result = mcpText({ a: 1 });
    expect(result.content[0].text).toContain("\n");
  });
});

describe("mcpError", () => {
  it("wraps message as error content", () => {
    const result = mcpError("something went wrong");
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toBe("something went wrong");
  });
});

describe("resolveData", () => {
  beforeEach(() => {
    resetConfig();
    delete process.env.ASTERPAY_API_KEY;
    delete process.env.MOCK;
    delete process.env.MODE;
  });

  afterEach(() => {
    resetConfig();
  });

  it("returns mock data when in mock mode", async () => {
    process.env.MOCK = "true";
    loadConfig();

    const { resolveData } = await import("../src/api-client.js");
    const mockFn = () => ({ mock: true });
    const result = await resolveData("/test", mockFn);
    expect(result).toEqual({ mock: true });
  });
});
