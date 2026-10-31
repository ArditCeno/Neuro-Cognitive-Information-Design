/*
 * Download raw gaze objects from R2 through the Worker export route.
 *
 * Usage:
 *   WORKER_URL=https://ncid-api.<account>.workers.dev \
 *   EXPORT_TOKEN=... \
 *   node scripts/export_r2.mjs
 *
 * Writes: data/raw/gaze/<filename>.json.gz
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
  console.error("Could not list sessions:", res.status);
  process.exit(1);
}
const data = await res.json();
const objects = (data.sessions || []).filter((s) => s.gaze_key);

mkdirSync("data/raw/gaze", { recursive: true });

let saved = 0;
for (const s of objects) {
  const key = s.gaze_key;
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  const r = await fetch(base + "/export/gaze/" + encoded, { headers });
  if (!r.ok) {
    console.error("Failed " + key + ": " + r.status);
    continue;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  const name = key.split("/").pop();
  writeFileSync(join("data/raw/gaze", name), buf);
  saved++;
}

console.log("Downloaded " + saved + " gaze objects to data/raw/gaze/.");
