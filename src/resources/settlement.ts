import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSettlementResource(server: McpServer): void {
  server.resource(
    "settlement",
    "asterpay://settlement",
    {
      description:
        "Settlement information: supported currencies, payment methods, facilitator details.",
      mimeType: "application/json",
    },
    async () => {
      return {
        contents: [
          {
            uri: "asterpay://settlement",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                version: "1",
                lastUpdated: new Date().toISOString(),
                data: {
                  currency: "EUR",
                  settlement_method: "SEPA Instant",
                  facilitator: "AsterPay (AELIRA LTD)",
                  facilitator_url: "https://pay.asterpay.io",
                  network: "Base (Ethereum L2)",
                  token: "USDC",
                  protocol: "x402",
                  flow: "Agent pays USDC via x402 → AsterPay converts → Merchant receives EUR via SEPA Instant",
                  estimated_settlement: "< 10 seconds",
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
