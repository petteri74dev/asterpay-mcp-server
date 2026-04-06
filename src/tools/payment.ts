import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveData, mcpText } from "../api-client.js";
import { getConfig } from "../config.js";

function resolveSlug(explicit?: string): string {
  const config = getConfig();
  return explicit ?? config.MERCHANT_SLUG ?? "default";
}

export function registerPaymentTools(server: McpServer): void {
  server.tool(
    "get_x402_payment_details",
    "Get x402 payment details for an order: facilitator endpoint, USDC amount, network, and payment header. Your agent needs an x402 client (e.g. @x402/axios) to execute the actual payment.",
    {
      order_id: z.string().describe("Order ID to get payment details for"),
      merchantSlug: z
        .string()
        .optional()
        .describe("Merchant identifier. Omit to use default."),
    },
    async ({ order_id, merchantSlug }) => {
      const slug = resolveSlug(merchantSlug);

      const data = await resolveData(
        `/m/${slug}/orders/${order_id}/payment`,
        () => ({
          order_id,
          x402: {
            facilitator: "https://pay.asterpay.io",
            network: "Base",
            token: "USDC",
            amount: "35.00",
            receiver: "0x1234...abcd",
            payment_url: `https://pay.asterpay.io/x402/${order_id}`,
          },
          settlement: {
            currency: "EUR",
            method: "SEPA Instant",
            estimated_arrival: "< 10 seconds",
          },
          note: "Use an x402-compatible HTTP client to execute payment. Claude Desktop does not include an x402 client.",
        }),
      );
      return mcpText(data);
    },
  );
}
