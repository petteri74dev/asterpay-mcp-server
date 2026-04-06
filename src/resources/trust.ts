import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { getMockMerchant, getDefaultMockMerchant } from "../mock-data.js";
import { resolveData } from "../api-client.js";

export function registerTrustResource(server: McpServer): void {
  server.resource(
    "trust",
    "asterpay://trust",
    {
      description:
        "Probe KYA (Know Your Agent) trust score and attestation data for this merchant.",
      mimeType: "application/json",
    },
    async () => {
      const config = getConfig();
      const slug = config.MERCHANT_SLUG ?? "default";

      const data = await resolveData(
        `/v1/trust/${slug}`,
        () => {
          const merchant = getMockMerchant(slug) ?? getDefaultMockMerchant();
          return {
            merchant_slug: merchant.slug,
            merchant_name: merchant.name,
            trust_score: merchant.trustScore,
            attestations: merchant.attestations,
            provider: "Probe (getprobe.xyz)",
            schema: "EAS on Base",
            last_verified: new Date().toISOString(),
          };
        },
      );

      return {
        contents: [
          {
            uri: "asterpay://trust",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                version: "1",
                lastUpdated: new Date().toISOString(),
                data,
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
