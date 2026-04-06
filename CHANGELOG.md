# Changelog

All notable changes to `@asterpay/mcp-server` will be documented here.

This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0-beta.1] - 2026-04-07

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
