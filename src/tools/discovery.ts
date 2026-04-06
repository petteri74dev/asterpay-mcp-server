import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveData, mcpText } from "../api-client.js";
import { getMockMerchants } from "../mock-data.js";

export function registerDiscoveryTools(server: McpServer): void {
  server.tool(
    "discover_merchants",
    "Search for merchants accepting x402 payments via AsterPay. Filter by category, city, country, or minimum trust score. Returns merchant name, slug, category, location, trust score, and product count.",
    {
      category: z
        .string()
        .optional()
        .describe("Filter by category, e.g. florist, coffee, bakery, electronics"),
      city: z.string().optional().describe("Filter by city, e.g. Berlin, Paris"),
      country: z
        .string()
        .optional()
        .describe("ISO country code, e.g. FI, DE, FR, NL"),
      min_trust: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Minimum Probe trust score (0-100)"),
    },
    async ({ category, city, country, min_trust }) => {
      const data = await resolveData(
        "/v1/merchants/discover",
        () => {
          let results = getMockMerchants();

          if (category) {
            results = results.filter(
              (m) => m.category.toLowerCase() === category.toLowerCase(),
            );
          }
          if (city) {
            results = results.filter(
              (m) => m.city.toLowerCase() === city.toLowerCase(),
            );
          }
          if (country) {
            results = results.filter(
              (m) => m.country.toUpperCase() === country.toUpperCase(),
            );
          }
          if (min_trust !== undefined) {
            results = results.filter((m) => m.trustScore >= min_trust);
          }

          return {
            data: results.map((m) => ({
              slug: m.slug,
              name: m.name,
              category: m.category,
              city: m.city,
              country: m.country,
              trust_score: m.trustScore,
              attestations: m.attestations,
              product_count: m.products.length,
            })),
            total: results.length,
          };
        },
        "GET",
      );
      return mcpText(data);
    },
  );
}
