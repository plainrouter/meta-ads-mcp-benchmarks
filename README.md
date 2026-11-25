# Meta Ads MCP Server Benchmarks (Tool Count, Schema Footprint & Write Safety)

Reproducible static source-code and public-schema audit of 6 Meta Ads Model Context Protocol (MCP) options checked on **2026-11-24**: Meta's official Ads MCP (`mcp.facebook.com/ads`), four public GitHub Meta Ads MCP repositories, and Plainrouter's hosted MCP server.

> **Disclosure:** [Plainrouter](https://plainrouter.com) maintains this repository and is included in the comparison. Every open-source count below is extracted mechanically from pinned public GitHub commits by running [`scripts/audit.mjs`](./scripts/audit.mjs). Meta's official Ads MCP is closed-source behind Facebook Login for Business OAuth, so its tool count cannot be extracted statically and is documented from Meta's public specs. If a maintainer adds approval gates, changes tool counts, or spots a parsing bug, please open a PR or issue.

## Summary Table (Checked 2026-11-24)

| Server | Commit / Version | Lang / Hosting | Total Tools | Write Tools | Delete Tools | Approx. Def Tokens | `create_campaign` Default | Direct Live Status / Budget Writes | Approval Queue / Rules | Decision Receipts / Audit Log | First-Party CAPI / Arrival Counts |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | :--- | :--- | :--- | :--- | :--- |
| **Meta Official Ads MCP** (`https://mcp.facebook.com/ads`) | Hosted (closed-source) | Meta hosted remote (OAuth) | Closed-source | Managed | Managed | Not statically inspectable | Managed | Configurable via Meta Ads MCP Rules | Meta Ads MCP Rules (no external approval inbox) | No external receipts | No (Meta-reported Pixel/CAPI only) |
| [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) | `63d0e5e` | Python (local or hosted) | 40 | 14 | 0 | ~20.7k | `PAUSED` | Yes (`update_campaign` / `update_adset`) | No | No | No |
| [Plainrouter MCP](https://plainrouter.com/docs/mcp/overview) *(ours)* | `v0.4.2` (`e5b1ef5`) | Hosted remote (HTTP) | 44 *(15/page)* | 12 *(proposal/rule/launch)* | 0 | Paginated (15/page) | `PAUSED` | No (budget raises & campaign/ad-set activations always wait for approval) | Yes (`Ask`, `Custom`, `Full`) | Yes (`get_action_decision_receipt`) | Yes (10 signal/arrival/consent tools) |
| [mikusnuz/meta-ads-mcp](https://github.com/mikusnuz/meta-ads-mcp) | `ccb4489` | TypeScript (local) | 88 | 29 | 7 | ~25.5k | `PAUSED` | Yes (+ `delete_campaign` / `delete_adset`) | No | No | Send helper only (`send_conversion_event`) |
| [EfrainTorres/armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp) | `8ff63fa` | Rust (local binary) | 125 | 61 | 6 | ~19.5k | `PAUSED` | Yes (+ 6 `delete_*` tools) | No | No | Send helper only (`send_capi_events`) |
| [oliverames/meta-mcp-server](https://github.com/oliverames/meta-mcp-server) | `9b2a7d6` | TypeScript (local) | 185 | 61 | 12 | ~56.5k | `PAUSED` | Yes (+ 12 `delete_*` tools) | No | No | 4 Meta Pixel/CAPI wrappers (no independent arrival count) |

## Key Findings

1. **Meta's official Ads MCP (`mcp.facebook.com/ads`) covers native Meta workflows, not independent first-party verification.** It connects via Facebook Login for Business OAuth (with `ads_mcp_management` App Review for multi-client/agency apps) and supports Meta Ads MCP Rules, but only sees Meta's own claimed metrics and does not provide an external human approval inbox or decision receipts. It can be connected alongside Plainrouter in the same MCP client.
2. **Open-source tool surface size varies 4.6x (40 to 185 tools).** Loading 125 to 185 raw Graph API wrappers into a single MCP session consumes ~20k to ~56k tokens of tool definitions before the first prompt.
3. **Defaulting `create_campaign` to `PAUSED` is common, but server-side write governance is rare.** All four open-source servers default new campaigns to `PAUSED` as a parameter default, yet all four let the LLM pass `status: "ACTIVE"`, update live budgets directly, or (in 3 of 4 servers) call `delete_*` tools with no server-side approval queue or audit receipt.
4. **Ad-platform wrappers do not verify first-party conversion pipelines.** Without independent arrival counts and CAPI deduplication checks, an agent cannot distinguish ad fatigue from a broken tracking pipeline.
5. **Notable strengths of each option:**
   - **Meta Official Ads MCP:** First-party Facebook Login for Business OAuth, direct Marketing API coverage, and native Ads MCP Rules.
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
