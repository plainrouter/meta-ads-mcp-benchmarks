# Meta Ads MCP Server Benchmarks (Tool Count, Schema Footprint & Write Safety)

Reproducible audit of 6 Meta Ads Model Context Protocol (MCP) servers checked on **2026-11-24 / 2026-11-25**: Meta's official Ads MCP (`https://mcp.facebook.com/ads`, live 111-tool authenticated inventory), four public GitHub Meta Ads MCP repositories (pinned commits), and Plainrouter's hosted MCP server (`v0.4.2`).

> **Disclosure:** [Plainrouter](https://plainrouter.com) maintains this repository and is included in the comparison. Open-source counts come from pinned public commits via [`scripts/audit.mjs`](./scripts/audit.mjs). Meta Official Ads MCP counts come from an authenticated live connector tool inventory captured on 2026-11-25 plus a live `WWW-Authenticate` OAuth scope probe, archived in [`data/meta-official-ads-mcp-2026-11-25.json`](./data/meta-official-ads-mcp-2026-11-25.json). If a maintainer updates tools or approval gates, please open a PR or issue.

## Summary Table (Checked 2026-11-24 / 2026-11-25)

| Server | Source / Version | Lang / Hosting | Total Tools | Write Tools | Delete Tools | Approx. Def Tokens | Direct Live Spend / Activation Writes | Approval Queue & Audit Receipts | Independent First-Party Arrival Counts |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | :--- | :--- | :--- |
| [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) | `63d0e5e` | Python (local or hosted) | 40 | 14 | 0 | ~20.7k | Yes (`update_campaign` / `update_adset`) | No | No |
| [Plainrouter MCP](https://plainrouter.com/docs/mcp/overview) *(ours)* | `v0.4.2` (`e5b1ef5`) | Hosted remote (HTTP) | 44 *(15/page)* | 12 | 0 | Paginated (15/page) | No (budget raises & campaign/ad-set activations always wait for approval) | Yes (`Ask`, `Custom`, `Full` + receipts) | Yes (10 signal/arrival/consent tools) |
| [mikusnuz/meta-ads-mcp](https://github.com/mikusnuz/meta-ads-mcp) | `ccb4489` | TypeScript (local) | 88 | 29 | 7 | ~25.5k | Yes (+ `delete_campaign` / `delete_adset`) | No | No (send helper only) |
| **Meta Official Ads MCP** (`https://mcp.facebook.com/ads`) | Live `2026-11-25` | Meta hosted remote (OAuth, 10 scopes) | 111 *(12 interactive, 58 read, 41 write/delete)* | 48 *(41 + 7 interactive)* | 8 | Live OAuth only | Yes (`ads_activate_entity`, `ads_boost_ig_post`, `ads_update_entity`) | Client toggles / interactive prompts (no external approval inbox or decision receipts) | No (14 Meta-side dataset/pixel tools only) |
| [EfrainTorres/armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp) | `8ff63fa` | Rust (local binary) | 125 | 61 | 6 | ~19.5k | Yes (+ 6 `delete_*` tools) | No | No (send helper only) |
| [oliverames/meta-mcp-server](https://github.com/oliverames/meta-mcp-server) | `9b2a7d6` | TypeScript (local) | 185 | 61 | 12 | ~56.5k | Yes (+ 12 `delete_*` tools) | No | No (4 Meta Pixel/CAPI wrappers only) |

## Key Findings

1. **Meta Official Ads MCP exposes 111 live tools across 3 categories** (captured 2026-11-25): 12 interactive tools (7 mutations), 58 read-only tools (including unique first-party Meta reads like `ads_insights_anomaly_signal`, `ads_insights_auction_ranking_benchmarks`, `ads_insights_performance_vs_peers`, and `ads_get_opportunity_score`), and 41 write/delete tools (including `ads_activate_entity`, `ads_boost_ig_post`, and 8 explicit delete tools such as `ads_pixel_event_delete` and `ads_creative_delete`). Its unauthenticated `401` response requests 10 OAuth scopes up front.
2. **Tool surface size varies 4.6x across all 6 servers (40 to 185 tools).** Loading 111 to 185 raw API tools into a single MCP session significantly increases context overhead on every turn.
3. **Direct delete and live-spend writes are widespread.** Four of the six servers (`mikusnuz`, `armavita`, `oliverames`, and Meta Official Ads MCP) expose 6 to 12 explicit delete tools directly to the model, and none of the non-Plainrouter servers provide an external human approval inbox with stored decision receipts.
4. **Ad-platform MCPs do not verify first-party conversion pipelines.** Even Meta Official Ads MCP's 14 dataset/pixel tools only report Meta's side of the fence, not independent first-party site arrivals or backend revenue reconciliation. Teams can connect Meta Official Ads MCP (with write/delete tools disabled) alongside Plainrouter in the same client.

## Meta Official Ads MCP Breakdown by Domain (111 Live Tools)

Grouping all 111 live tools captured from `https://mcp.facebook.com/ads` shows why its surface is 2.5x larger than focused Meta Ads servers: **Product Catalogs & DPA alone account for 38 tools** even for advertisers who do not run catalog ads.

| Domain Category | Total | Read-Only | Interactive | Write / Delete |
| :--- | ---: | ---: | ---: | ---: |
| Product Catalogs & DPA | 38 | 19 | 2 | 17 |
| Pixels, Datasets & Conversions | 15 | 7 | 0 | 8 |
| Core Campaigns, Ad Sets, Ads & Account | 13 | 6 | 5 | 2 |
| Creatives & Media | 13 | 4 | 2 | 7 |
| Permissions, Pages & Instagram | 10 | 8 | 1 | 1 |
| Insights, Benchmarks & Ad Library | 9 | 7 | 2 | 0 |
| Experiments (A/B & Lift) | 7 | 4 | 0 | 3 |
| Custom Audiences | 6 | 3 | 0 | 3 |

## Reproducing the Audit

Requires Node.js 20+ and `git`:

```bash
node scripts/audit.mjs
```

- Open-source audit output: [`data/audit-2026-11-24.json`](./data/audit-2026-11-24.json)
- Live Meta Official Ads MCP 111-tool snapshot: [`data/meta-official-ads-mcp-2026-11-25.json`](./data/meta-official-ads-mcp-2026-11-25.json)

## Related Guides

- [Meta Ads MCP options compared](https://plainrouter.com/library/meta-ads-mcp-options)
- [Plainrouter MCP tools reference](https://plainrouter.com/docs/mcp/tools)
- [Governance modes: Ask, Custom, and Full](https://plainrouter.com/docs/actions/policies-and-safety)
