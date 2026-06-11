import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerBudgetTools,
  getActiveBudgetToken,
  __resetBudgetSession,
} from "../../src/tools/budget.js";

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
}>;

/** Capture registered tool handlers without a real MCP transport. */
function captureTools() {
  const tools = new Map<string, ToolHandler>();
  const prompts = new Map<string, unknown>();
  const fakeServer = {
    tool: (name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
      tools.set(name, handler);
    },
    prompt: (name: string, _desc: string, _schema: unknown, cb: unknown) => {
      prompts.set(name, cb);
    },
  } as unknown as McpServer;
  registerBudgetTools(fakeServer);
  return { tools, prompts };
}

let tmpHome: string;
const fetchMock = vi.fn();

beforeEach(() => {
  tmpHome = mkdtempSync(join(tmpdir(), "asterpay-budget-"));
  process.env.ASTERPAY_HOME = tmpHome;
  delete process.env.ASTERPAY_BUDGET_TOKEN;
  __resetBudgetSession();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ASTERPAY_HOME;
  delete process.env.ASTERPAY_BUDGET_TOKEN;
  rmSync(tmpHome, { recursive: true, force: true });
});

const jsonResponse = (status: number, data: unknown) =>
  ({ status, json: async () => data }) as Response;

describe("budget tools registration", () => {
  it("registers set_budget, get_budget_status and the budget prompt", () => {
    const { tools, prompts } = captureTools();
    expect(tools.has("set_budget")).toBe(true);
    expect(tools.has("get_budget_status")).toBe(true);
    expect(prompts.has("budget")).toBe(true);
  });
});

describe("set_budget", () => {
  it("returns funding instructions when called with no arguments", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { payTo: "0xPAY", network: "base" }),
    );
    const { tools } = captureTools();
    const res = await tools.get("set_budget")!({});
    expect(res.isError).toBeUndefined();
    const text = res.content[0].text;
    expect(text).toContain("HUMAN");
    expect(text).toContain("0xPAY");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://x402.asterpay.io/v1/budget/info",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("rejects a token that does not look like a budget token", async () => {
    const { tools } = captureTools();
    const res = await tools.get("set_budget")!({ token: "sess_wrong" });
    expect(res.isError).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("activates and persists a valid existing token", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { budget: { balanceUsd: 9.5 } }),
    );
    const { tools } = captureTools();
    const res = await tools.get("set_budget")!({ token: "bud_abc123" });
    expect(res.isError).toBeUndefined();
    expect(getActiveBudgetToken()).toBe("bud_abc123");
    // persisted to disk under ASTERPAY_HOME
    expect(readFileSync(join(tmpHome, "budget-token"), "utf8").trim()).toBe("bud_abc123");
    // status call carried the token header
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["X-Budget-Token"]).toBe("bud_abc123");
  });

  it("does not persist a token the API rejects", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: "Budget not found" }));
    const { tools } = captureTools();
    const res = await tools.get("set_budget")!({ token: "bud_bogus" });
    expect(res.isError).toBe(true);
    expect(getActiveBudgetToken()).toBeNull();
  });

  it("creates a budget from a confirmed human payment and persists the token", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { budget: { token: "bud_new", balanceUsd: 10, expiresAt: "2026-09-09" } }),
    );
    const { tools } = captureTools();
    const res = await tools.get("set_budget")!({
      amount_usd: 10,
      tx_hash: "0x" + "ab".repeat(32),
      wallet: "0x" + "cd".repeat(20),
    });
    expect(res.isError).toBeUndefined();
    expect(res.content[0].text).toContain("bud_new");
    expect(getActiveBudgetToken()).toBe("bud_new");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://x402.asterpay.io/v1/budget/create");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.amountUsd).toBe(10);
  });

  it("surfaces creation failures (e.g. replayed tx)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { error: "already used" }));
    const { tools } = captureTools();
    const res = await tools.get("set_budget")!({
      amount_usd: 10,
      tx_hash: "0x" + "ab".repeat(32),
      wallet: "0x" + "cd".repeat(20),
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("409");
  });
});

describe("get_budget_status", () => {
  it("errors helpfully when no budget is active", async () => {
    const { tools } = captureTools();
    const res = await tools.get("get_budget_status")!({});
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("set_budget");
  });

  it("uses the env var token when present", async () => {
    process.env.ASTERPAY_BUDGET_TOKEN = "bud_env";
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { budget: { balanceUsd: 5 } }));
    const { tools } = captureTools();
    const res = await tools.get("get_budget_status")!({});
    expect(res.isError).toBeUndefined();
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["X-Budget-Token"]).toBe("bud_env");
  });

  it("falls back to the persisted token file", async () => {
    mkdirSync(tmpHome, { recursive: true });
    writeFileSync(join(tmpHome, "budget-token"), "bud_disk\n");
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { budget: { balanceUsd: 2 } }));
    const { tools } = captureTools();
    const res = await tools.get("get_budget_status")!({});
    expect(res.isError).toBeUndefined();
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["X-Budget-Token"]).toBe("bud_disk");
  });

  it("explicit token argument wins over everything", async () => {
    process.env.ASTERPAY_BUDGET_TOKEN = "bud_env";
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));
    const { tools } = captureTools();
    await tools.get("get_budget_status")!({ token: "bud_explicit" });
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["X-Budget-Token"]).toBe("bud_explicit");
  });
});
