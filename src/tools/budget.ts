/**
 * /budget — prepaid spending money for AI agents.
 *
 * Talks to the x402 API (x402.asterpay.io) directly. Requires NO API key —
 * budgets are funded by a one-time human USDC transfer and authorized by the
 * resulting bud_ token, so these tools work even when the server runs without
 * ASTERPAY_API_KEY.
 *
 * Token resolution order:
 *   1. ASTERPAY_BUDGET_TOKEN env var
 *   2. ~/.asterpay/budget-token (persisted by set_budget, chmod 600)
 *   3. token set via set_budget in this session
 */

import { z } from "zod";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpText, mcpError } from "../api-client.js";
import { log } from "../logger.js";

const X402_API_URL =
  process.env.X402_API_URL || "https://x402.asterpay.io";

function tokenDir(): string {
  return process.env.ASTERPAY_HOME || join(homedir(), ".asterpay");
}

function tokenFile(): string {
  return join(tokenDir(), "budget-token");
}

let sessionToken: string | null = null;

export function getActiveBudgetToken(): string | null {
  if (process.env.ASTERPAY_BUDGET_TOKEN?.startsWith("bud_")) {
    return process.env.ASTERPAY_BUDGET_TOKEN;
  }
  if (sessionToken) return sessionToken;
  try {
    const stored = readFileSync(tokenFile(), "utf8").trim();
    if (stored.startsWith("bud_")) return stored;
  } catch {
    // no stored token — fine
  }
  return null;
}

function persistToken(token: string): void {
  sessionToken = token;
  try {
    mkdirSync(tokenDir(), { recursive: true });
    writeFileSync(tokenFile(), token + "\n", { mode: 0o600 });
  } catch (e) {
    log.error(`Could not persist budget token: ${e instanceof Error ? e.message : e}`);
  }
}

/** Test helper. */
export function __resetBudgetSession(): void {
  sessionToken = null;
}

async function budgetApi(
  method: "GET" | "POST",
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["X-Budget-Token"] = opts.token;
  const res = await fetch(`${X402_API_URL}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

export function registerBudgetTools(server: McpServer): void {
  server.tool(
    "set_budget",
    "Activate a prepaid budget (AsterPay /budget) so the agent can spend on paid x402 APIs with a hard cap. " +
      "Three modes: (1) pass an existing budget token (bud_...) to activate it; " +
      "(2) pass amount_usd + tx_hash + wallet after your HUMAN sent the USDC, to create a new budget; " +
      "(3) pass nothing to get funding instructions. " +
      "An agent cannot grant itself money — a human must make the one-time USDC transfer (1-500 USDC on Base). " +
      "Credited 1:1, no platform fee. Funding wallet is sanctions-screened (Chainalysis). No API key needed.",
    {
      token: z.string().optional().describe("Existing budget token (bud_...)"),
      amount_usd: z.number().optional().describe("USDC amount the human sent (1-500)"),
      tx_hash: z.string().optional().describe("Transaction hash of the USDC transfer (0x...)"),
      wallet: z.string().optional().describe("Wallet the payment was sent from (0x...)"),
    },
    async ({ token, amount_usd, tx_hash, wallet }) => {
      // Mode 1: activate an existing token
      if (token) {
        if (!token.startsWith("bud_")) {
          return mcpError("Budget tokens start with bud_ — this does not look like one.");
        }
        const status = await budgetApi("GET", "/v1/budget/status", { token });
        if (status.status !== 200) {
          return mcpError(`Token rejected (${status.status}): ${JSON.stringify(status.data)}`);
        }
        persistToken(token);
        return mcpText({
          activated: true,
          persisted_to: tokenFile(),
          status: status.data,
          note: "All future sessions on this machine reuse this budget automatically.",
        });
      }

      // Mode 2: create a new budget from a confirmed human payment
      if (amount_usd && tx_hash && wallet) {
        const result = await budgetApi("POST", "/v1/budget/create", {
          body: { amountUsd: amount_usd, txHash: tx_hash, wallet },
        });
        if (result.status !== 200) {
          return mcpError(`Budget creation failed (${result.status}): ${JSON.stringify(result.data)}`);
        }
        const data = result.data as { budget?: { token?: string; balanceUsd?: number; expiresAt?: string } };
        if (data?.budget?.token) persistToken(data.budget.token);
        return mcpText({
          created: true,
          balance_usd: data?.budget?.balanceUsd,
          expires_at: data?.budget?.expiresAt,
          token: data?.budget?.token,
          persisted_to: tokenFile(),
          note: "SAVE the token somewhere safe too (e.g. ASTERPAY_BUDGET_TOKEN env var). The agent now spends from this balance on every paid call.",
        });
      }

      // Mode 3: funding instructions (human-in-the-loop by design)
      const info = await budgetApi("GET", "/v1/budget/info");
      const d = info.data as { payTo?: string; network?: string } | null;
      return mcpText({
        action_needed: "A HUMAN must fund the budget — agents cannot grant themselves money.",
        step1: `Send 1-500 USDC to ${d?.payTo ?? "(see /v1/budget/info)"} on ${d?.network ?? "Base"}`,
        step2: "Call set_budget again with { amount_usd, tx_hash, wallet }",
        step3: "Done — the agent spends from the prepaid balance, capped at exactly the deposit",
        details: "Credit 1:1, no platform fee. Wallet sanctions-screened. Expires in 90 days.",
        docs: "https://asterpay.io/budget",
      });
    },
  );

  server.tool(
    "get_budget_status",
    "Check the prepaid /budget balance: remaining USD, total spent, recent calls with per-call prices. " +
      "Use BEFORE expensive calls to spend gracefully. FREE, no API key needed.",
    {
      token: z.string().optional().describe("Budget token to check (defaults to the active one)"),
    },
    async ({ token }) => {
      const useToken = token || getActiveBudgetToken();
      if (!useToken) {
        return mcpError(
          "No budget active. Run set_budget for funding instructions, or pass a token (bud_...).",
        );
      }
      const result = await budgetApi("GET", "/v1/budget/status", { token: useToken });
      if (result.status !== 200) {
        return mcpError(`Budget lookup failed (${result.status}): ${JSON.stringify(result.data)}`);
      }
      return mcpText(result.data);
    },
  );

  server.prompt(
    "budget",
    "Set up or check this agent's prepaid spending budget (AsterPay /budget)",
    { amount: z.string().optional().describe("USDC amount to fund, e.g. '10'") },
    ({ amount }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              amount
                ? `I want to give you a prepaid spending budget of ${amount} USDC via AsterPay /budget.`
                : "I want to manage your prepaid spending budget via AsterPay /budget.",
              "",
              "Do this:",
              "1. Call get_budget_status. If a budget is active, report balance, spent and recent calls, then stop.",
              "2. If none is active, call set_budget with no arguments and show me the funding instructions (address + network). I will make the transfer myself — never attempt to move funds on my behalf.",
              "3. After I give you the tx hash and wallet, call set_budget with { amount_usd, tx_hash, wallet } and report the new balance.",
              "4. From then on, check get_budget_status before expensive calls and stop gracefully when the balance is low.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
