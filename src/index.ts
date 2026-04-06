#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { startServer } from "./server.js";
import { log } from "./logger.js";

const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.error(`
@asterpay/mcp-server — EUR settlement MCP server for AI agent commerce

USAGE:
  asterpay-mcp [flags]

FLAGS:
  --mode seller|buyer   Server mode (default: seller)
  --mock                Use built-in demo data (no API key needed)
  --smoke-test          Run diagnostic check and exit
  --help                Show this help

ENVIRONMENT:
  ASTERPAY_API_KEY              API key (required unless --mock)
  MERCHANT_SLUG                 Merchant identifier (seller mode)
  SPENDING_LIMIT_DAILY_EUR      Daily spending cap in EUR (buyer mode)
  SPENDING_LIMIT_WEEKLY_EUR     Weekly spending cap in EUR (buyer mode)
  DEBUG                         Enable verbose logging (stderr)

DOCS: https://docs.asterpay.io/mcp
`);
  process.exit(0);
}

if (args.includes("--mock")) process.env.MOCK = "true";

const modeIdx = args.indexOf("--mode");
if (modeIdx !== -1 && args[modeIdx + 1]) {
  process.env.MODE = args[modeIdx + 1];
}

const config = loadConfig();

if (args.includes("--smoke-test")) {
  log.info("[smoke-test] Configuration: OK");
  log.info(`[smoke-test] Mode: ${config.MODE}`);
  log.info(`[smoke-test] Mock: ${config.MOCK}`);
  log.info(`[smoke-test] API: ${config.MOCK ? "mock" : config.ASTERPAY_API_URL}`);

  const { getToolCount, getResourceCount } = await import("./server.js");
  log.info(`[smoke-test] Tools: ${getToolCount(config)} registered`);
  log.info(`[smoke-test] Resources: ${getResourceCount(config)} loaded`);
  log.info("[smoke-test] All checks passed");
  process.exit(0);
}

if (config.MOCK) {
  log.mock(
    "Running in MOCK mode. No real payments or API calls will be made.",
  );
}

startServer(config);
