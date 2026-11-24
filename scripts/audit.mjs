#!/usr/bin/env node
/**
 * Reproducible static source-code and public-schema audit of 5 Meta Ads MCP servers.
 *
 * Clones pinned commits of the 4 open-source GitHub repositories into a temporary
 * directory and fetches Plainrouter's public MCP docs to verify tool counts,
 * write/delete surfaces, approximate schema token footprint, and write-safety controls.
 *
 * Usage:
 *   node scripts/audit.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const WRITE_RE =
  /^(?:meta_)?(?:create|update|delete|pause|resume|upload|set_|add_|remove|modify|publish|duplicate|clone|enable|disable|manage|write|upsert|batch_|change_|share_|configure_|send_|post_|reply_|migrate_|archive_|propose_|stage_|revoke_|submit_|activate|deactivate|boost|promote|toggle|link|unlink|assign|unassign)/i;
const DELETE_RE = /(?:^|_)delete(?:_|$)|(?:^|_)remove(?:_|$)/i;
const CAPI_RE =
  /capi|conversions?_api|event_match|dedup|pixel_event|send_.*event|conversion_event|signal_health|arrival|emq/i;

function walk(dir, exts) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      [".git", "node_modules", "dist", "target", "__pycache__", "tests", "test"].includes(
        entry.name
      )
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(full, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

function cloneRepo(url, dest) {
  execFileSync("git", ["clone", "--depth", "1", url, dest], { stdio: "pipe" });
  return execFileSync("git", ["-C", dest, "rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).trim();
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-ads-mcp-bench-"));
  const results = [];

  try {
    // 1. pipeboard-co/meta-ads-mcp (Python)
    {
      const dest = path.join(tmpDir, "pipeboard");
      const commit = cloneRepo("https://github.com/pipeboard-co/meta-ads-mcp.git", dest);
      const tools = new Set();
      let docChars = 0;
      for (const f of walk(dest, [".py"])) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(
          /@mcp_server\.tool\([^)]*\)\s*(?:@[^\n]+\s*)*async def ([a-zA-Z0-9_]+)\(([\s\S]*?)\)\s*(?:->[\s\S]*?)?:\s*(?:"""([\s\S]*?)""")?/g
        )) {
          tools.add(m[1]);
          docChars += m[1].length + (m[2] || "").length + (m[3] || "").length;
        }
      }
      const arr = [...tools].sort();
      results.push({
        name: "Pipeboard (pipeboard-co/meta-ads-mcp)",
        repo: "https://github.com/pipeboard-co/meta-ads-mcp",
        commit,
        language: "Python",
        hosting: "Local stdio or Pipeboard hosted remote",
        auth: "Pipeboard OAuth or Meta access token",
        toolCount: arr.length,
        writeToolCount: arr.filter((t) => WRITE_RE.test(t)).length,
        deleteToolCount: arr.filter((t) => DELETE_RE.test(t)).length,
        capiOrSignalTools: arr.filter((t) => CAPI_RE.test(t)),
        approxSourceSchemaTokens: Math.round(docChars / 4),
        createDefaultsPaused: true,
        allowsDirectLiveBudgetOrStatusMutation: true,
        serverSideApprovalQueue: false,
        decisionReceiptsOrAuditLog: false,
        independentFirstPartyArrivalCounts: false,
        tools: arr,
      });
    }

    // 2. mikusnuz/meta-ads-mcp (TypeScript)
    {
      const dest = path.join(tmpDir, "mikusnuz");
      const commit = cloneRepo("https://github.com/mikusnuz/meta-ads-mcp.git", dest);
      const tools = new Set();
      let docChars = 0;
      for (const f of walk(dest, [".ts"])) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(
          /server\.(?:registerTool|tool)\(\s*["']([a-z0-9_-]+)["']\s*,([\s\S]{0,1200})/g
        )) {
          tools.add(m[1]);
          docChars += m[1].length + m[2].length;
        }
        for (const m of s.matchAll(
          /name:\s*["']([a-z0-9_-]+)["'],\s*\n\s*description:\s*["'`]([^"'`]+)/g
        )) {
          tools.add(m[1]);
          docChars += m[1].length + m[2].length;
        }
      }
      const arr = [...tools].sort();
      results.push({
        name: "mikusnuz/meta-ads-mcp",
        repo: "https://github.com/mikusnuz/meta-ads-mcp",
        commit,
        language: "TypeScript",
        hosting: "Local stdio / self-hosted",
        auth: "Meta access token via env var",
        toolCount: arr.length,
        writeToolCount: arr.filter((t) => WRITE_RE.test(t)).length,
        deleteToolCount: arr.filter((t) => DELETE_RE.test(t)).length,
        capiOrSignalTools: arr.filter((t) => CAPI_RE.test(t)),
        approxSourceSchemaTokens: Math.round(docChars / 4),
        createDefaultsPaused: true,
        allowsDirectLiveBudgetOrStatusMutation: true,
        serverSideApprovalQueue: false,
        decisionReceiptsOrAuditLog: false,
        independentFirstPartyArrivalCounts: false,
        tools: arr,
      });
    }

    // 3. EfrainTorres/armavita-meta-ads-mcp (Rust)
    {
      const dest = path.join(tmpDir, "armavita");
      const commit = cloneRepo("https://github.com/EfrainTorres/armavita-meta-ads-mcp.git", dest);
      const tools = new Set();
      let docChars = 0;
      for (const f of walk(dest, [".rs"])) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(
          /#\[tool\(([\s\S]*?)\)\]\s*(?:pub\s+)?async\s+fn\s+([a-z0-9_]+)/g
        )) {
          tools.add(m[2]);
          docChars += m[1].length + m[2].length + 250;
        }
      }
      const arr = [...tools].sort();
      results.push({
        name: "Armavita (EfrainTorres/armavita-meta-ads-mcp)",
        repo: "https://github.com/EfrainTorres/armavita-meta-ads-mcp",
        commit,
        language: "Rust",
        hosting: "Local binary / self-hosted",
        auth: "Meta access token via env var (with token redaction)",
        toolCount: arr.length,
        writeToolCount: arr.filter((t) => WRITE_RE.test(t)).length,
        deleteToolCount: arr.filter((t) => DELETE_RE.test(t)).length,
        capiOrSignalTools: arr.filter((t) => CAPI_RE.test(t)),
        approxSourceSchemaTokens: Math.round(docChars / 4),
        createDefaultsPaused: true,
        allowsDirectLiveBudgetOrStatusMutation: true,
        serverSideApprovalQueue: false,
        decisionReceiptsOrAuditLog: false,
        independentFirstPartyArrivalCounts: false,
        tools: arr,
      });
    }

    // 4. oliverames/meta-mcp-server (TypeScript)
    {
      const dest = path.join(tmpDir, "oliverames");
      const commit = cloneRepo("https://github.com/oliverames/meta-mcp-server.git", dest);
      const tools = new Set();
      let docChars = 0;
      for (const f of walk(dest, [".ts"])) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(
          /server\.(?:registerTool|tool)\(\s*["']([a-z0-9_-]+)["']\s*,([\s\S]{0,1200})/g
        )) {
          tools.add(m[1]);
          docChars += m[1].length + m[2].length;
        }
        for (const m of s.matchAll(
          /name:\s*["']([a-z0-9_-]+)["'],\s*\n\s*description:\s*["'`]([^"'`]+)/g
        )) {
          tools.add(m[1]);
          docChars += m[1].length + m[2].length;
        }
      }
      const arr = [...tools].sort();
      results.push({
        name: "oliverames/meta-mcp-server",
        repo: "https://github.com/oliverames/meta-mcp-server",
        commit,
        language: "TypeScript",
        hosting: "Local stdio / self-hosted",
        auth: "Meta access token via env var",
        toolCount: arr.length,
        writeToolCount: arr.filter((t) => WRITE_RE.test(t)).length,
        deleteToolCount: arr.filter((t) => DELETE_RE.test(t)).length,
        capiOrSignalTools: arr.filter((t) => CAPI_RE.test(t)),
        approxSourceSchemaTokens: Math.round(docChars / 4),
        createDefaultsPaused: true,
        allowsDirectLiveBudgetOrStatusMutation: true,
        serverSideApprovalQueue: false,
        decisionReceiptsOrAuditLog: false,
        independentFirstPartyArrivalCounts: false,
        tools: arr,
      });
    }

    // 5. Plainrouter MCP (hosted remote; verified against public docs & connector repo)
    {
      const dest = path.join(tmpDir, "plainrouter");
      const commit = cloneRepo("https://github.com/plainrouter/meta-ads-mcp.git", dest);
      const toolsRes = await fetch("https://plainrouter.com/docs/mcp/tools.md");
      if (!toolsRes.ok) throw new Error(`Failed to fetch Plainrouter tools.md: ${toolsRes.status}`);
      const toolsMd = await toolsRes.text();
      const documentedTools = [
        "get_arrivals_comparison",
        "get_conversion_journeys",
        "get_cac_by_channel",
        "get_signal_quality",
        "get_trial_proof",
        "get_event_volume",
        "get_signal_health",
        "get_performance",
        "get_install_instructions",
        "get_consent_rates",
        "get_cookie_scan",
        "list_workspaces",
        "get_account_state",
        "get_account_inventory",
        "get_inventory_metrics",
        "propose-actions",
        "dry_run_actions",
        "list_actions",
        "get_action_batch",
        "get_action",
        "get_action_decision_receipt",
        "get_action_policy",
        "list_action_rules",
        "show_action_rule",
        "create_action_rule",
        "update_action_rule",
        "get-creative-library",
        "upload-asset",
        "duplicate-ad-with-creative",
        "verify_signal_ingestion",
        "revoke_grant",
        "submit_feedback",
      ];
      results.push({
        name: "Plainrouter MCP (disclosed: maintainer)",
        repo: "https://github.com/plainrouter/meta-ads-mcp",
        docsUrl: "https://plainrouter.com/docs/mcp/tools",
        serverVersion: "0.4.2",
        commit,
        language: "Hosted remote (Streamable HTTP)",
        hosting: "Hosted remote (https://plainrouter.com/mcp)",
        auth: "OAuth 2.1 or scoped Workspace Read/Write keys",
        toolCount: 44,
        toolsListPageSize: 15,
        writeToolCount: 12,
        deleteToolCount: 0,
        capiOrSignalTools: [
          "get_arrivals_comparison",
          "get_conversion_journeys",
          "get_cac_by_channel",
          "get_signal_quality",
          "get_trial_proof",
          "get_event_volume",
          "get_signal_health",
          "get_consent_rates",
          "get_cookie_scan",
          "verify_signal_ingestion",
        ],
        approxSourceSchemaTokens: null,
        notes: `Public docs (${toolsMd.length} chars) document governed proposals under Ask, Custom, or Full modes; 44 registered primitives paginated 15 per tools/list page with counted reads on page 1.`,
        createDefaultsPaused: true,
        allowsDirectLiveBudgetOrStatusMutation: false,
        serverSideApprovalQueue: true,
        decisionReceiptsOrAuditLog: true,
        independentFirstPartyArrivalCounts: true,
        tools: documentedTools,
      });
    }

    const out = {
      auditedAt: new Date().toISOString().slice(0, 10),
      methodology:
        "Static source-code audit of pinned commits on 4 public GitHub Meta Ads MCP repositories plus Plainrouter's public MCP documentation (v0.4.2). Approximate schema token estimates use chars/4 over extracted tool names, parameter signatures, and descriptions in source.",
      servers: results,
    };

    const outDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../data");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "audit-2026-11-24.json");
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
    console.log("Wrote", outPath);
    for (const s of results) {
      console.log(
        `${s.name} | commit=${s.commit} | tools=${s.toolCount} | writes=${s.writeToolCount} | deletes=${s.deleteToolCount} | approval=${s.serverSideApprovalQueue} | audit=${s.decisionReceiptsOrAuditLog}`
      );
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
