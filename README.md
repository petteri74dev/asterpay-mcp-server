# @asterpay/mcp-server

> EUR settlement MCP server for AI agent commerce.

The first MCP server that lets AI agents discover and buy from European merchants using the x402 protocol with EUR settlement via SEPA Instant.

## Quick Start

### Demo Mode (no API key needed)

Try it out immediately with built-in mock data:

```json
{
  "mcpServers": {
    "asterpay-demo": {
      "command": "npx",
      "args": ["@asterpay/mcp-server", "--mock"]
    }
  }
}
```

### Seller Mode

Expose your products to AI agents:

```json
{
  "mcpServers": {
    "my-shop": {
      "command": "npx",
      "args": ["@asterpay/mcp-server", "--mode", "seller"],
      "env": {
        "ASTERPAY_API_KEY": "ap_write_xxxxxxxxxxxx",
        "MERCHANT_SLUG": "your-shop-slug"
      }
    }
  }
}
```

### Buyer Mode

Let your agent discover and purchase from merchants:

```json
{
  "mcpServers": {
    "asterpay-buyer": {
      "command": "npx",
      "args": ["@asterpay/mcp-server", "--mode", "buyer"],
      "env": {
        "ASTERPAY_API_KEY": "ap_buyer_xxxxxxxxxxxx",
        "SPENDING_LIMIT_DAILY_EUR": "50",
        "SPENDING_LIMIT_WEEKLY_EUR": "200"
      }
    }
  }
}
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MODE` | No | `seller` | Server mode: `seller` or `buyer` |
| `ASTERPAY_API_KEY` | Yes* | — | Your API key. *Not needed with `--mock` |
| `ASTERPAY_API_URL` | No | `https://api.asterpay.io` | API endpoint |
| `MERCHANT_SLUG` | No | — | Your merchant identifier (seller mode) |
| `SPENDING_LIMIT_DAILY_EUR` | No** | — | Daily spending cap. **Required for buyer mode (non-mock) |
| `SPENDING_LIMIT_WEEKLY_EUR` | No** | — | Weekly spending cap. **At least one limit required for buyer mode |
| `DEBUG` | No | `false` | Enable verbose logging to stderr |

### CLI Flags

```
asterpay-mcp --mode seller|buyer   # Set mode
asterpay-mcp --mock                # Use demo data, no API key needed
asterpay-mcp --smoke-test          # Run diagnostic check and exit
asterpay-mcp --help                # Show help
```

## Tools

### Seller Mode (7 tools)

| Tool | Description |
|------|-------------|
| `list_products` | List all products with prices in EUR, descriptions, availability |
| `get_product` | Get details for a specific product by ID |
| `check_availability` | Check stock status and current price |
| `get_business_info` | Operating hours, contact, delivery zones, return policy |
| `place_order` | Place an order — returns x402 payment details |
| `get_order_status` | Check order status (pending/confirmed/rejected/expired) |
| `get_x402_payment_details` | Get x402 facilitator endpoint, USDC amount, network |

### Buyer Mode (10 tools)

All seller tools plus:

| Tool | Description |
|------|-------------|
| `discover_merchants` | Find merchants by category, city, country, or trust score |
| `set_spending_limit` | Set soft spending limits within your hard caps |
| `get_spending_summary` | View spending today/this week and remaining budget |

## Resources

Loaded automatically when the server starts:

| URI | Content |
|-----|---------|
| `asterpay://merchant/info` | Business name, hours, contact, delivery, returns |
| `asterpay://settlement` | Currency (EUR), SEPA Instant, facilitator details |
| `asterpay://trust` | Probe KYA trust score (0-100), attestation count |
| `asterpay://agents-txt` | Auto-generated agents.txt for discovery |

## How It Works

```
AI Agent  →  MCP Server  →  AsterPay API  →  Merchant
   │              │               │              │
   │  list_products               │              │
   │  ──────────────►             │              │
   │              │  GET /products│              │
   │              │  ────────────►│              │
   │              │               │              │
   │  place_order │               │              │
   │  ──────────────►             │              │
   │              │  POST /orders │              │
   │              │  ────────────►│              │
   │              │               │  SEPA EUR    │
   │              │  x402 header  │  ────────────►
   │  ◄──────────────             │              │
   │              │               │              │
   │  Agent pays USDC via x402    │              │
   │  ────────────────────────────►              │
   │              │  AsterPay converts USDC→EUR  │
   │              │               │  ────────────►
```

## x402 Payment

`place_order` returns an x402 payment header. The actual USDC payment must be executed by your agent's x402 client.

**Environments with full x402 support:**
- Custom agents with `@x402/axios` or similar
- Hermes agents
- Any MCP client with x402 integration

**Claude Desktop limitation:** Claude Desktop does not include an x402 client. Use `--mock` mode for testing and demos. For production, use a custom agent with x402 support.

## Spending Limits

Spending limits are tracked in-memory for the lifetime of the server process:

- **ENV hard cap**: Set via `SPENDING_LIMIT_DAILY_EUR` / `SPENDING_LIMIT_WEEKLY_EUR`. Cannot be exceeded.
- **Soft limits**: Set at runtime via `set_spending_limit`. Must be within the hard cap.
- **Reset**: Limits reset when the server restarts. Each `npx` invocation starts fresh.

> Spending limits are best-effort and not a security boundary. For production enforcement, backend-side limits will be available in a future release.

## Security

- **Scoped API keys**: Use the narrowest scope for your use case (`ap_read_*`, `ap_write_*`, `ap_buyer_*`)
- **No secrets in logs**: API keys are never logged, even in debug mode
- **x402 keys**: The MCP server never handles private keys — that's your agent's responsibility
- **Prompt injection**: ENV hard caps limit damage from prompt injection attacks

## Development

```bash
git clone https://github.com/asterpay/mcp-server.git
cd mcp-server
npm install
npm run build
npm test
```

Run locally in mock mode:

```bash
MOCK=true npx tsx src/index.ts
```

## License

Apache-2.0 — see [LICENSE](LICENSE) for details.

Built by [AELIRA LTD](https://asterpay.io) for the x402 ecosystem.
