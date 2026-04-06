import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveData, mcpText } from "../api-client.js";
import { getConfig } from "../config.js";
import { getMockProduct } from "../mock-data.js";
import { checkSpendingLimit, recordSpending } from "./spending.js";

function resolveSlug(explicit?: string): string {
  const config = getConfig();
  return explicit ?? config.MERCHANT_SLUG ?? "default";
}

export function registerOrderTools(server: McpServer): void {
  server.tool(
    "place_order",
    "Place an order with a merchant. Creates an intent, then submits the order. Returns x402 payment details that your agent's x402 client needs to execute. In mock mode, simulates a successful order.",
    {
      items: z
        .array(
          z.object({
            product_id: z.string().describe("Product ID, e.g. prod_001"),
            quantity: z.number().int().min(1).describe("Quantity to order"),
          }),
        )
        .describe("Items to order"),
      delivery_address: z
        .object({
          street: z.string(),
          city: z.string(),
          postal_code: z.string(),
          country: z.string().describe("ISO country code, e.g. FI"),
        })
        .optional()
        .describe("Delivery address (optional for digital goods)"),
      merchantSlug: z
        .string()
        .optional()
        .describe("Merchant identifier. Omit to use default."),
    },
    async ({ items, delivery_address, merchantSlug }) => {
      const slug = resolveSlug(merchantSlug);
      const config = getConfig();

      if (config.MOCK) {
        let total = 0;
        const resolvedItems = items.map((item) => {
          const product = getMockProduct(item.product_id, slug);
          const price = product?.price ?? 0;
          total += price * item.quantity;
          return {
            product_id: item.product_id,
            name: product?.name ?? "Unknown product",
            quantity: item.quantity,
            unit_price: price,
            subtotal: price * item.quantity,
          };
        });

        const limitCheck = checkSpendingLimit(total);
        if (limitCheck) return limitCheck;

        recordSpending(total);

        const orderId = `mock_ord_${randomUUID().slice(0, 8)}`;
        return mcpText({
          order_id: orderId,
          status: "confirmed",
          auto_accepted: total < 50,
          items: resolvedItems,
          total_amount: total,
          currency: "EUR",
          payment: {
            method: "x402",
            status: "simulated",
            facilitator: "pay.asterpay.io",
            network: "Base",
            usdc_amount: total.toFixed(2),
          },
          delivery_address: delivery_address ?? null,
          created_at: new Date().toISOString(),
          note: "Mock order — no real payment was processed.",
        });
      }

      const intentResult = (await resolveData(
        `/m/${slug}/orders/intent`,
        () => ({ intent_token: `mock_intent_${randomUUID().slice(0, 8)}` }),
        "POST",
        { merchant_id: `merch_${slug}`, items },
      )) as { intent_token?: string };

      if (!intentResult.intent_token) {
        return mcpText(intentResult);
      }

      const data = await resolveData(
        `/m/${slug}/orders`,
        () => ({}),
        "POST",
        {
          intent_token: intentResult.intent_token,
          items,
          payment_mode: "autonomous",
          delivery_address,
        },
      );
      return mcpText(data);
    },
  );

  server.tool(
    "get_order_status",
    "Check the status of an existing order. Returns status (pending, confirmed, rejected, expired), payment info, and items.",
    {
      order_id: z
        .string()
        .describe("Order ID returned from place_order"),
      merchantSlug: z
        .string()
        .optional()
        .describe("Merchant identifier. Omit to use default."),
    },
    async ({ order_id, merchantSlug }) => {
      const slug = resolveSlug(merchantSlug);

      const data = await resolveData(
        `/m/${slug}/orders/${order_id}`,
        () => ({
          order_id,
          status: "confirmed",
          payment_status: "completed",
          items: [
            {
              product_id: "prod_001",
              name: "Red Rose Bouquet",
              quantity: 1,
              unit_price: 35.0,
            },
          ],
          total_amount: 35.0,
          currency: "EUR",
          created_at: new Date().toISOString(),
        }),
      );
      return mcpText(data);
    },
  );
}
