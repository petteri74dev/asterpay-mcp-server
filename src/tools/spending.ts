import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpText, mcpError, type McpToolResponse } from "../api-client.js";
import { getConfig } from "../config.js";

interface SpendingRecord {
  amount: number;
  timestamp: number;
}

const spendingLog: SpendingRecord[] = [];

let softLimitDaily: number | undefined;
let softLimitWeekly: number | undefined;

function now(): number {
  return Date.now();
}

function spentInWindow(windowMs: number): number {
  const cutoff = now() - windowMs;
  return spendingLog
    .filter((r) => r.timestamp >= cutoff)
    .reduce((sum, r) => sum + r.amount, 0);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export function spentToday(): number {
  return spentInWindow(DAY_MS);
}

export function spentThisWeek(): number {
  return spentInWindow(WEEK_MS);
}

export function recordSpending(amount: number): void {
  spendingLog.push({ amount, timestamp: now() });
}

export function resetSpending(): void {
  spendingLog.length = 0;
  softLimitDaily = undefined;
  softLimitWeekly = undefined;
}

/**
 * Check if a purchase would exceed spending limits.
 * Returns an McpToolResponse with an error if limit exceeded, or null if OK.
 */
export function checkSpendingLimit(
  amount: number,
): McpToolResponse | null {
  const config = getConfig();

  const dailyHardCap = config.SPENDING_LIMIT_DAILY_EUR;
  const weeklyHardCap = config.SPENDING_LIMIT_WEEKLY_EUR;

  const dailyCap = softLimitDaily ?? dailyHardCap;
  const weeklyCap = softLimitWeekly ?? weeklyHardCap;

  if (dailyCap !== undefined) {
    const projected = spentToday() + amount;
    if (projected > dailyCap) {
      return mcpError(
        `Daily spending limit exceeded. Spent today: €${spentToday().toFixed(2)}, ` +
          `this purchase: €${amount.toFixed(2)}, limit: €${dailyCap.toFixed(2)}. ` +
          `Try again tomorrow or reduce the order.`,
      );
    }
  }

  if (weeklyCap !== undefined) {
    const projected = spentThisWeek() + amount;
    if (projected > weeklyCap) {
      return mcpError(
        `Weekly spending limit exceeded. Spent this week: €${spentThisWeek().toFixed(2)}, ` +
          `this purchase: €${amount.toFixed(2)}, limit: €${weeklyCap.toFixed(2)}.`,
      );
    }
  }

  return null;
}

export function registerSpendingTools(server: McpServer): void {
  server.tool(
    "set_spending_limit",
    "Set soft spending limits within your environment's hard caps. Limits reset when the server restarts. This is a best-effort control, not a security boundary.",
    {
      daily_eur: z
        .number()
        .nonnegative()
        .optional()
        .describe("Daily spending limit in EUR"),
      weekly_eur: z
        .number()
        .nonnegative()
        .optional()
        .describe("Weekly spending limit in EUR"),
    },
    async ({ daily_eur, weekly_eur }) => {
      const config = getConfig();

      if (daily_eur !== undefined) {
        if (
          config.SPENDING_LIMIT_DAILY_EUR !== undefined &&
          daily_eur > config.SPENDING_LIMIT_DAILY_EUR
        ) {
          return mcpError(
            `Cannot set daily limit above environment hard cap of €${config.SPENDING_LIMIT_DAILY_EUR.toFixed(2)}.`,
          );
        }
        softLimitDaily = daily_eur;
      }

      if (weekly_eur !== undefined) {
        if (
          config.SPENDING_LIMIT_WEEKLY_EUR !== undefined &&
          weekly_eur > config.SPENDING_LIMIT_WEEKLY_EUR
        ) {
          return mcpError(
            `Cannot set weekly limit above environment hard cap of €${config.SPENDING_LIMIT_WEEKLY_EUR.toFixed(2)}.`,
          );
        }
        softLimitWeekly = weekly_eur;
      }

      return mcpText({
        daily_limit_eur: softLimitDaily ?? config.SPENDING_LIMIT_DAILY_EUR ?? "unlimited",
        weekly_limit_eur: softLimitWeekly ?? config.SPENDING_LIMIT_WEEKLY_EUR ?? "unlimited",
        note: "Limits reset on server restart. These are best-effort, not a security boundary.",
      });
    },
  );

  server.tool(
    "get_spending_summary",
    "Get current spending summary: amount spent today and this week, remaining budget, and configured limits.",
    {},
    async () => {
      const config = getConfig();

      const dailyCap =
        softLimitDaily ?? config.SPENDING_LIMIT_DAILY_EUR;
      const weeklyCap =
        softLimitWeekly ?? config.SPENDING_LIMIT_WEEKLY_EUR;

      const todaySpent = spentToday();
      const weekSpent = spentThisWeek();

      return mcpText({
        today: {
          spent_eur: Number(todaySpent.toFixed(2)),
          limit_eur: dailyCap ?? "unlimited",
          remaining_eur:
            dailyCap !== undefined
              ? Number(Math.max(0, dailyCap - todaySpent).toFixed(2))
              : "unlimited",
        },
        this_week: {
          spent_eur: Number(weekSpent.toFixed(2)),
          limit_eur: weeklyCap ?? "unlimited",
          remaining_eur:
            weeklyCap !== undefined
              ? Number(Math.max(0, weeklyCap - weekSpent).toFixed(2))
              : "unlimited",
        },
        note: "Spending tracked in-memory. Resets on server restart.",
      });
    },
  );
}
