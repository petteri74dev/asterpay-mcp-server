import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { getMockBusinessInfo } from "../mock-data.js";
import { resolveData } from "../api-client.js";

export function registerMerchantInfoResource(server: McpServer): void {
  server.resource(
    "merchant-info",
    "asterpay://merchant/info",
    {
      description:
        "Merchant business information: name, hours, contact, delivery, returns.",
      mimeType: "application/json",
    },
    async () => {
      const config = getConfig();
      const slug = config.MERCHANT_SLUG ?? "default";

      const data = await resolveData(
        `/m/${slug}/business-info`,
        () => getMockBusinessInfo(slug),
      );

      return {
        contents: [
          {
            uri: "asterpay://merchant/info",
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
