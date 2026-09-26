#!/usr/bin/env node
/**
 * Apply db/schema.sql to your Turso database.
 *
 * Usage:  node scripts/apply-schema.mjs
 * Needs:  TURSO_DATABASE_URL and TURSO_AUTH_TOKEN set (in .env.local or the environment)
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client/web"; // pure-JS client (no native binaries — works on Windows ARM64)

// Tiny .env.local loader (no dotenv dependency needed)
function loadEnvLocal() {
  const p = path.resolve(".env.local");
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  for (const line of content.split(/\r?\n/)) { // CRLF-safe (Windows)
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

loadEnvLocal();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (set them in .env.local)");
  process.exit(1);
}

const schema = fs.readFileSync(path.resolve("db/schema.sql"), "utf8");
const db = createClient({ url, authToken });

// Drop full-line comments first (inline -- comments are valid SQL and stay),
// then split on statement-ending semicolons. No semicolons live inside
// string literals in this schema.
const statements = schema
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const main = async () => {
  for (const stmt of statements) {
    try {
      await db.execute(stmt);
      console.log(`✓ ${stmt.split("\n")[0].slice(0, 60)}…`);
    } catch (e) {
      // "already exists" is fine on re-runs:
      if (String(e.message).includes("already exists")) {
        console.log(`↷ skipped (exists): ${stmt.split("\n")[0].slice(0, 50)}…`);
      } else {
        console.error(`✗ FAILED: ${stmt.split("\n")[0].slice(0, 60)}…`);
        console.error(`  ${e.message}`);
        process.exit(1);
      }
    }
  }
  console.log("\nSchema applied ✔");
};

main().catch((e) => { console.error(e); process.exit(1); });
