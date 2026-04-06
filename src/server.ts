import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Config } from "./config.js";
import { log } from "./logger.js";

import { registerProductTools } from "./tools/products.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerDiscoveryTools } from "./tools/discovery.js";
import { registerSpendingTools } from "./tools/spending.js";
import { registerPaymentTools } from "./tools/payment.js";

import { registerMerchantInfoResource } from "./resources/merchant-info.js";
import { registerSettlementResource } from "./resources/settlement.js";
import { registerTrustResource } from "./resources/trust.js";
import { registerAgentsTxtResource } from "./resources/agents-txt.js";

const SELLER_TOOL_COUNT = 6;
const BUYER_EXTRA_TOOL_COUNT = 3;
const SHARED_TOOL_COUNT = 1;
const RESOURCE_COUNT = 4;

export function getToolCount(config: Config): number {
  if (config.MODE === "buyer") {
    return SELLER_TOOL_COUNT + BUYER_EXTRA_TOOL_COUNT + SHARED_TOOL_COUNT;
  }
  return SELLER_TOOL_COUNT + SHARED_TOOL_COUNT;
}

export function getResourceCount(_config: Config): number {
  return RESOURCE_COUNT;
}

export async function startServer(config: Config): Promise<void> {
  const serverName = config.MODE === "buyer"
    ? "asterpay-buyer"
    : config.MERCHANT_SLUG
      ? `asterpay-${config.MERCHANT_SLUG}`
      : "asterpay-seller";

  const server = new McpServer({
    name: serverName,
    version: "2.0.0",
  });

  registerProductTools(server);
  registerOrderTools(server);
  registerPaymentTools(server);

  if (config.MODE === "buyer") {
    registerDiscoveryTools(server);
    registerSpendingTools(server);
  }

  registerMerchantInfoResource(server);
  registerSettlementResource(server);
  registerTrustResource(server);
  registerAgentsTxtResource(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log.info(
    `Server started: ${serverName} (${config.MODE} mode, ${getToolCount(config)} tools, ${RESOURCE_COUNT} resources)`,
  );
}
