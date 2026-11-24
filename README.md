# Meta Ads MCP Server Benchmarks (Tool Count, Schema Footprint & Write Safety)

Reproducible static source-code and public-schema audit of 5 Meta Ads Model Context Protocol (MCP) servers checked on **2026-11-24**.

> **Disclosure:** [Plainrouter](https://plainrouter.com) maintains this repository and is included in the comparison. Every third-party count below is extracted mechanically from pinned public GitHub commits by running [`scripts/audit.mjs`](./scripts/audit.mjs). If a maintainer adds approval gates, changes tool counts, or spots a parsing bug, please open a PR or issue.

## Summary Table (Checked 2026-11-24)

| Server | Commit / Version | Lang / Hosting | Total Tools | Write Tools | Delete Tools | Approx. Def Tokens | `create_campaign` Default | Direct Live Status / Budget Writes | Server Approval Queue | Decision Receipts / Audit Log | First-Party CAPI / Arrival Counts |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | :--- | :--- | :--- | :--- | :--- |
| [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) | `63d0e5e` | Python (local or hosted) | 40 | 14 | 0 | ~20.7k | `PAUSED` | Yes (`update_campaign` / `update_adset`) | No | No | No |
| [Plainrouter MCP](https://plainrouter.com/docs/mcp/overview) *(ours)* | `v0.4.2` (`e5b1ef5`) | Hosted remote (HTTP) | 44 *(15/page)* | 12 *(proposal/rule/launch)* | 0 | Paginated (15/page) | `PAUSED` | No (budget raises & campaign/ad-set activations always wait for approval) | Yes (`Ask`, `Custom`, `Full`) | Yes (`get_action_decision_receipt`) | Yes (10 signal/arrival/consent tools) |
| [mikusnuz/meta-ads-mcp](https://github.com/mikusnuz/meta-ads-mcp) | `ccb4489` | TypeScript (local) | 88 | 29 | 7 | ~25.5k | `PAUSED` | Yes (+ `delete_campaign` / `delete_adset`) | No | No | Send helper only (`send_conversion_event`) |
| [EfrainTorres/armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp) | `8ff63fa` | Rust (local binary) | 125 | 61 | 6 | ~19.5k | `PAUSED` | Yes (+ 6 `delete_*` tools) | No | No | Send helper only (`send_capi_events`) |
| [oliverames/meta-mcp-server](https://github.com/oliverames/meta-mcp-server) | `9b2a7d6` | TypeScript (local) | 185 | 61 | 12 | ~56.5k | `PAUSED` | Yes (+ 12 `delete_*` tools) | No | No | 4 Meta Pixel/CAPI wrappers (no independent arrival count) |

## Key Findings

1. **Tool surface size varies 4.6x across Meta Ads MCP servers (40 to 185 tools).** Loading 125 to 185 raw Graph API wrappers into a single MCP session consumes ~20k to ~56k tokens of tool definitions before the first prompt.
2. **Defaulting `create_campaign` to `PAUSED` is common, but server-side write governance is rare.** All four open-source servers default new campaigns to `PAUSED` as a parameter default, yet all four let the LLM pass `status: "ACTIVE"`, update live budgets directly, or (in 3 of 4 servers) call `delete_*` tools with no server-side approval queue or audit receipt.
3. **Ad-platform wrappers do not verify first-party conversion pipelines.** Most Meta Ads MCP servers only read Meta's self-reported Insights API (or wrap raw CAPI event POSTs). Without independent arrival counts and CAPI deduplication checks, an agent cannot distinguish ad fatigue from a broken tracking pipeline.
4. **Notable strengths of each open-source option:**
   - **Pipeboard (`pipeboard-co/meta-ads-mcp`):** Leanest open-source tool surface (40 tools, zero delete tools) and supports both local stdio and hosted OAuth.
   - **Armavita (`EfrainTorres/armavita-meta-ads-mcp`):** Compact Rust binary with built-in token redaction and tight schema descriptions despite broad API coverage (125 tools).
   - **mikusnuz (`mikusnuz/meta-ads-mcp`):** Broad TypeScript Marketing API coverage (88 tools) for self-hosted teams wanting raw Graph API access.
   - **oliverames (`oliverames/meta-mcp-server`):** Widest cross-Meta coverage (185 tools across Ads, Pages, Instagram, WhatsApp, and Commerce) when a single server must cover non-ad Meta APIs too.

## Reproducing the Audit

Requires Node.js 20+ and `git`:

```bash
node scripts/audit.mjs
```

The script clones the 4 public GitHub repositories into a temporary directory, extracts tool registrations and source-level schema sizes, verifies Plainrouter's public MCP documentation, and outputs [`data/audit-2026-11-24.json`](./data/audit-2026-11-24.json).

## Related Guides

- [Meta Ads MCP options compared](https://plainrouter.com/library/meta-ads-mcp-options)
- [Plainrouter MCP tools reference](https://plainrouter.com/docs/mcp/tools)
- [Governance modes: Ask, Custom, and Full](https://plainrouter.com/docs/actions/policies-and-safety)
