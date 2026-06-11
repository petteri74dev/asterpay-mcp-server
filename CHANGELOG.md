# Changelog

All notable changes to `@asterpay/mcp-server` will be documented here.

This project follows [Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-06-11

/budget — prepaid spending money for AI agents. One human USDC transfer
(1-500 USDC on Base) gives the agent a hard, server-enforced spending cap
across all paid AsterPay x402 APIs.

### Added

- `set_budget` tool: activate an existing `bud_` token, create a budget from
  a confirmed human payment, or get funding instructions (human-in-the-loop
  by design — an agent cannot grant itself money)
- `get_budget_status` tool: remaining balance, total spent, per-call receipts
- `budget` MCP prompt — shows up as a native slash command in Claude Code
- Budget token persistence in `~/.asterpay/budget-token` (chmod 600); also
  honors `ASTERPAY_BUDGET_TOKEN` env var
- Budget tools require NO API key

### Changed

- The server now boots without `ASTERPAY_API_KEY` (budget-only mode).
  Commerce tools return a clear error at call time instead of the previous
  hard exit at startup.

## [2.0.0-beta.1] - 2026-04-07

Complete rewrite. The v1.x package was a data API wrapper. v2.0 is a full
dual-mode MCP server for merchant commerce with x402 + EUR settlement.

Breaking changes from v1.x: all tools, resources, and configuration are new.

### Added

- Dual-mode MCP server: seller and buyer modes
- Seller tools: `list_products`, `get_product`, `check_availability`, `get_business_info`, `place_order`, `get_order_status`
- Buyer tools: `discover_merchants`, `set_spending_limit`, `get_spending_summary`
- Shared tool: `get_x402_payment_details`
- MCP resources: merchant info, settlement details, trust score, agents.txt
- Mock mode with built-in demo data (4 merchants across EU)
- Zod-based configuration with validation
- ENV-based spending limits (daily + weekly hard caps)
- CLI flags: `--mode`, `--mock`, `--smoke-test`, `--help`
- x402 payment flow (returns payment header for agent execution)
- Request ID tracking for observability
