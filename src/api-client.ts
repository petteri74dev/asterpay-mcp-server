import { randomUUID } from "node:crypto";
import { log } from "./logger.js";
import { getConfig } from "./config.js";
import type { Config } from "./config.js";

export interface McpToolResponse {
  [key: string]: unknown;
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
}

export function mcpText(data: unknown): McpToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function mcpError(message: string): McpToolResponse {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

export async function apiCall(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const config = getConfig();
  const requestId = randomUUID().slice(0, 8);
  const url = `${config.ASTERPAY_API_URL}${path}`;

  log.info(`request=${path} id=${requestId} method=${method}`);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.ASTERPAY_API_KEY}`,
        "X-AsterPay-Request-Id": requestId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    log.info(`request=${path} id=${requestId} status=${res.status}`);

    if (res.status === 429) {
      return mcpError(
        "Rate limit reached. Please wait 60 seconds and try again.",
      );
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      return mcpError(
        `API error ${res.status}: ${res.statusText}. ${errorBody}`,
      );
    }

    return await res.json();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error(`request=${path} id=${requestId} error=${msg}`);
    return mcpError(`Connection failed: ${msg}`);
  }
}

/**
 * Calls the API or returns mock data depending on config.
 * Tools should use this instead of apiCall directly.
 */
export async function resolveData<T>(
  apiPath: string,
  mockFn: () => T,
  method = "GET",
  body?: unknown,
): Promise<T | McpToolResponse> {
  const config = getConfig();

  if (config.MOCK) {
    log.mock(`${apiPath} → returning mock data`);
    return mockFn();
  }

  return apiCall(method, apiPath, body) as Promise<T | McpToolResponse>;
}
