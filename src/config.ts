import { z } from "zod";
import { log } from "./logger.js";

const ConfigSchema = z.object({
  MODE: z.enum(["seller", "buyer"]).default("seller"),
  ASTERPAY_API_KEY: z.string().min(1).optional(),
  ASTERPAY_API_URL: z.string().url().default("https://api.asterpay.io"),
  MERCHANT_SLUG: z.string().optional(),
  SPENDING_LIMIT_DAILY_EUR: z.coerce.number().nonnegative().optional(),
  SPENDING_LIMIT_WEEKLY_EUR: z.coerce.number().nonnegative().optional(),
  DEBUG: z.coerce.boolean().default(false),
  MOCK: z.coerce.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    log.error("Configuration error:");
    for (const issue of result.error.issues) {
      log.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    log.error("\nDocs: https://docs.asterpay.io/mcp/configuration");
    process.exit(1);
  }

  const config = result.data;

  if (!config.MOCK && !config.ASTERPAY_API_KEY) {
    log.error(
      "ASTERPAY_API_KEY is required (or use --mock for demo mode).\n" +
        "Get yours at https://dashboard.asterpay.io/api-keys",
    );
    process.exit(1);
  }

  if (
    config.MODE === "buyer" &&
    !config.MOCK &&
    config.SPENDING_LIMIT_DAILY_EUR === undefined &&
    config.SPENDING_LIMIT_WEEKLY_EUR === undefined
  ) {
    log.error(
      "Buyer mode requires at least one spending limit (daily or weekly).\n" +
        "Set SPENDING_LIMIT_DAILY_EUR and/or SPENDING_LIMIT_WEEKLY_EUR.",
    );
    process.exit(1);
  }

  cachedConfig = config;
  return config;
}

export function getConfig(): Config {
  if (!cachedConfig) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return cachedConfig;
}

/**
 * Reset config cache — only used in tests.
 */
export function resetConfig(): void {
  cachedConfig = null;
}
