/*
 * Export structured sessions from the Worker/D1 for local analysis.
 *
 * Usage:
 *   WORKER_URL=https://ncid-api.<account>.workers.dev \
 *   EXPORT_TOKEN=... \
 *   node scripts/export_d1.mjs
 *
 * Writes:
 *   data/raw/session_<submission_id>.json  (analysis payload, no names)
 *   data/raw/export-meta.json              (statuses + gaze keys)
 *   data/private/identity.json             (names, gitignored)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.env.WORKER_URL || "").replace(/\/+$/, "");
const token = process.env.EXPORT_TOKEN || "";
if (!base || !token) {
  console.error("Set WORKER_URL and EXPORT_TOKEN.");
  process.exit(1);
}

const headers = { authorization: "Bearer " + token };
const res = await fetch(base + "/export/sessions", { headers });
if (!res.ok) {
  console.error("Export failed:", res.status);
  process.exit(1);
}
const data = await res.json();
const sessions = data.sessions || [];

mkdirSync("data/raw", { recursive: true });
mkdirSync("data/private", { recursive: true });

const meta = [];
for (const s of sessions) {
  const id = String(s.submission_id || "unknown").replace(/[^A-Za-z0-9_.-]/g, "_");
  writeFileSync(join("data/raw", "session_" + id + ".json"), JSON.stringify(s.payload, null, 2));
  meta.push({
    submission_id: s.submission_id,
    email_status: s.email_status,
    gaze_status: s.gaze_status,
    gaze_key: s.gaze_key || null
  });
}
writeFileSync("data/raw/export-meta.json", JSON.stringify(meta, null, 2));

const idRes = await fetch(base + "/export/identity", { headers });
if (idRes.ok) {
  const identity = await idRes.json();
  writeFileSync("data/private/identity.json", JSON.stringify(identity.identity || [], null, 2));
}

console.log("Exported " + sessions.length + " sessions to data/raw/.");
console.log("Names exported to data/private/identity.json (gitignored).");
