import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveData, mcpText, mcpError } from "../api-client.js";
import { getConfig } from "../config.js";
import {
  getMockProducts,
  getMockProduct,
  getMockBusinessInfo,
} from "../mock-data.js";

function resolveSlug(explicit?: string): string {
  const config = getConfig();
  return explicit ?? config.MERCHANT_SLUG ?? "default";
}

export function registerProductTools(server: McpServer): void {
  server.tool(
    "list_products",
    "List all products available from the merchant. Returns names, prices in EUR, descriptions, availability, and variants.",
    {
      merchantSlug: z
        .string()
        .optional()
        .describe(
          "Merchant identifier. Omit to use the default from your API key.",
        ),
    },
    async ({ merchantSlug }) => {
      const slug = resolveSlug(merchantSlug);
      const data = await resolveData(
        `/m/${slug}/products`,
        () => ({ data: getMockProducts(slug) }),
      );
      return mcpText(data);
    },
  );

  server.tool(
    "get_product",
    "Get detailed information about a specific product by its ID. Use list_products first to find available product IDs.",
    {
      product_id: z.string().describe("Product ID, e.g. prod_001"),
      merchantSlug: z
        .string()
        .optional()
        .describe("Merchant identifier. Omit to use default."),
    },
    async ({ product_id, merchantSlug }) => {
      const slug = resolveSlug(merchantSlug);
      const data = await resolveData(
        `/m/${slug}/products/${product_id}`,
        () => {
          const product = getMockProduct(product_id, slug);
          if (!product) return { error: "Product not found" };
          return { data: product };
        },
      );
      return mcpText(data);
    },
  );

  server.tool(
    "check_availability",
    "Check if a specific product is currently in stock. Returns availability status, stock quantity, and current price.",
    {
      product_id: z.string().describe("Product ID to check"),
      merchantSlug: z
        .string()
        .optional()
        .describe("Merchant identifier. Omit to use default."),
    },
    async ({ product_id, merchantSlug }) => {
      const slug = resolveSlug(merchantSlug);
      const data = await resolveData(
        `/m/${slug}/products/${product_id}`,
        () => {
          const product = getMockProduct(product_id, slug);
          if (!product) return { error: "Product not found" };
          return {
            product_id,
            name: product.name,
            available: product.availability_status === "in_stock",
            availability_status: product.availability_status,
            stock_quantity: product.stock_quantity,
            price: product.price,
            currency: product.currency,
          };
        },
      );
      return mcpText(data);
    },
  );

  server.tool(
    "get_business_info",
    "Get business information for the merchant: operating hours, contact details, delivery zones and fees, return policy, and accepted payment methods.",
    {
      merchantSlug: z
        .string()
        .optional()
        .describe("Merchant identifier. Omit to use default."),
    },
    async ({ merchantSlug }) => {
      const slug = resolveSlug(merchantSlug);
      const data = await resolveData(
        `/m/${slug}/business-info`,
        () => ({ data: getMockBusinessInfo(slug) }),
      );
      return mcpText(data);
    },
  );
}
