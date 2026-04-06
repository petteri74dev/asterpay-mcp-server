import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig, resetConfig } from "../../src/config.js";

import { registerProductTools } from "../../src/tools/products.js";
import { registerOrderTools } from "../../src/tools/orders.js";
import { registerPaymentTools } from "../../src/tools/payment.js";
import { registerDiscoveryTools } from "../../src/tools/discovery.js";
import { registerSpendingTools } from "../../src/tools/spending.js";
import { registerMerchantInfoResource } from "../../src/resources/merchant-info.js";
import { registerSettlementResource } from "../../src/resources/settlement.js";
import { registerTrustResource } from "../../src/resources/trust.js";
import { registerAgentsTxtResource } from "../../src/resources/agents-txt.js";
import { resetSpending } from "../../src/tools/spending.js";

describe("MCP server integration (mock mode)", () => {
  let server: McpServer;

  beforeAll(() => {
    resetConfig();
    process.env.MOCK = "true";
    process.env.MODE = "buyer";
    process.env.MERCHANT_SLUG = "kukkakauppaliisa";
    loadConfig();

    server = new McpServer({ name: "test-server", version: "0.1.0" });

    registerProductTools(server);
    registerOrderTools(server);
    registerPaymentTools(server);
    registerDiscoveryTools(server);
    registerSpendingTools(server);
    registerMerchantInfoResource(server);
    registerSettlementResource(server);
    registerTrustResource(server);
    registerAgentsTxtResource(server);
  });

  afterAll(() => {
    resetConfig();
    resetSpending();
    delete process.env.MOCK;
    delete process.env.MODE;
    delete process.env.MERCHANT_SLUG;
  });

  it("server is created successfully", () => {
    expect(server).toBeDefined();
  });

  it("config is loaded in mock buyer mode", () => {
    const config = loadConfig();
    expect(config.MOCK).toBe(true);
    expect(config.MODE).toBe("buyer");
  });
});
