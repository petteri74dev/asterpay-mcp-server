import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { getMockMerchant, getDefaultMockMerchant } from "../mock-data.js";

export function registerAgentsTxtResource(server: McpServer): void {
  server.resource(
    "agents-txt",
    "asterpay://agents-txt",
    {
      description:
        "Auto-generated agents.txt for this merchant, following the agents.txt discovery convention.",
      mimeType: "text/plain",
    },
    async () => {
      const config = getConfig();
      const slug = config.MERCHANT_SLUG ?? "default";
      const merchant = getMockMerchant(slug) ?? getDefaultMockMerchant();

      const agentsTxt = [
        `# agents.txt — ${merchant.name}`,
        `# https://agents-txt.org`,
        ``,
        `Provider: ${merchant.name}`,
        `Contact: ${merchant.businessInfo.contact.email}`,
        `MCP: npx @asterpay/mcp-server --mode seller`,
        `Protocol: x402`,
        `Settlement: EUR via SEPA Instant`,
        `Trust: Probe KYA score ${merchant.trustScore}/100`,
        `Attestations: ${merchant.attestations}`,
        `City: ${merchant.city}`,
        `Country: ${merchant.country}`,
      ].join("\n");

      return {
        contents: [
          {
            uri: "asterpay://agents-txt",
            mimeType: "text/plain",
            text: agentsTxt,
          },
        ],
      };
    },
  );
}
