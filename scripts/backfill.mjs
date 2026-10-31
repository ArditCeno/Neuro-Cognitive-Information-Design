/*
 * Backfill existing sessions into the Worker/D1 database.
 *
 * Usage:
 *   WORKER_URL=https://ncid-api.<account>.workers.dev \
 *   IMPORT_TOKEN=... \
 *   node scripts/backfill.mjs data/raw/mailbox-sessions.json
 *
 * Input: either an array of sessions or an object with { sessions: [...] }.
 * The Worker marks backfilled rows as email_status='sent' and never resends.
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
const base = (process.env.WORKER_URL || "").replace(/\/+$/, "");
const token = process.env.IMPORT_TOKEN || "";

if (!file) {
  console.error("Usage: node scripts/backfill.mjs <sessions.json>");
  process.exit(1);
}
if (!base || !token) {
  console.error("Set WORKER_URL and IMPORT_TOKEN.");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, "utf8"));
const sessions = Array.isArray(raw) ? raw : (raw.sessions || []);
if (!Array.isArray(sessions) || !sessions.length) {
  console.error("No sessions found in " + file);
  process.exit(1);
}

const chunk = 25;
let inserted = 0, duplicate = 0, failed = 0;

for (let i = 0; i < sessions.length; i += chunk) {
  const batch = sessions.slice(i, i + chunk);
  const res = await fetch(base + "/import", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + token
    },
    body: JSON.stringify({ sessions: batch })
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* ignore */ }
  if (!res.ok) {
    console.error("Batch " + (i / chunk + 1) + " failed:", res.status, data.error || "");
    failed += batch.length;
    continue;
  }
  inserted += data.inserted || 0;
  duplicate += data.duplicate || 0;
  failed += data.failed || 0;
  console.log("Batch " + (i / chunk + 1) + ": inserted " + (data.inserted || 0) +
    ", duplicate " + (data.duplicate || 0) + ", failed " + (data.failed || 0));
}

console.log("Backfill finished: inserted=" + inserted + " duplicate=" + duplicate + " failed=" + failed);
process.exit(failed ? 1 : 0);
