// ── Apply a .sql migration directly to Postgres (ADMIN) ────────────────────
// Runs each statement in its own autocommit so one failure can't roll back the
// rest, and prints the exact error per statement.
//
//   node --env-file=.env.local scripts/db-apply.mjs ../supabase/migrations/0002_rls_repair.sql
//   (or: npm run db:apply -- ../supabase/migrations/0002_rls_repair.sql)
//
// Needs SUPABASE_DB_URL in .env.local (Supabase → Settings → Database →
// Connection string → Session pooler URI, with your DB password filled in).

import { readFileSync } from 'node:fs'
import pg from 'pg'

const url = process.env.SUPABASE_DB_URL
const file = process.argv[2]
if (!url) { console.error('Set SUPABASE_DB_URL in .env.local'); process.exit(1) }
if (!file) { console.error('usage: db-apply.mjs <file.sql>'); process.exit(1) }

// split on top-level semicolons; ignore ; inside $$...$$ bodies and -- comments
function splitStatements(text) {
  const stmts = []; let buf = ''; let i = 0; let inDollar = false; let inLineComment = false;
  while (i < text.length) {
    if (inLineComment) { if (text[i] === '\n') { inLineComment = false; buf += '\n'; } i++; continue }
    if (!inDollar && text[i] === '-' && text[i + 1] === '-') { inLineComment = true; i += 2; continue }
    if (text[i] === '$' && text[i + 1] === '$') { inDollar = !inDollar; buf += '$$'; i += 2; continue }
    if (text[i] === ';' && !inDollar) { const s = buf.trim(); if (s) stmts.push(s); buf = ''; i++; continue }
    buf += text[i]; i++
  }
  const last = buf.trim(); if (last) stmts.push(last)
  return stmts
}

// If SUPABASE_DB_PASSWORD is set, use it raw (no URL-encoding needed) and take
// host/user/db from the URL. Otherwise use the connection string as-is.
function buildConfig() {
  const raw = process.env.SUPABASE_DB_PASSWORD
  if (raw) {
    const m = url.match(/^postgres(?:ql)?:\/\/([^:@/]+)(?::[^@]*)?@([^:/]+):(\d+)\/(.+?)(?:\?.*)?$/)
    if (m) return { user: decodeURIComponent(m[1]), host: m[2], port: +m[3], database: m[4], password: raw, ssl: { rejectUnauthorized: false } }
  }
  return { connectionString: url, ssl: { rejectUnauthorized: false } }
}

const sql = readFileSync(file, 'utf8')
const stmts = splitStatements(sql)
const client = new pg.Client(buildConfig())
await client.connect()
let ok = 0, fail = 0
for (const s of stmts) {
  try { await client.query(s); ok++ }
  catch (e) { fail++; console.error('FAILED:', s.replace(/\s+/g, ' ').slice(0, 80), '\n   ->', e.message) }
}
console.log(`\nApplied ${ok}/${stmts.length} statements${fail ? `, ${fail} FAILED` : ' — all ok'}`)
await client.end()
process.exitCode = fail ? 1 : 0
