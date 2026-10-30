/*
 * Static quality checks: local links, duplicate ids, image alt text,
 * external-link rel, and EN/AL pairing. No dependencies, no network.
 *
 * Run: node scripts/test-links.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

const OPTIONAL = new Set(["js/config.local.js"]);
const pages = readdirSync(".")
  .filter((f) => f.endsWith(".html"))
  .map((f) => join(".", f))
  .concat(readdirSync("conference").filter((f) => f.endsWith(".html")).map((f) => join("conference", f)));

let pass = 0, fail = 0;
const fails = [];
const ok = (cond, msg) => { if (cond) pass++; else { fail++; fails.push(msg); } };

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const base = dirname(page);

  // 1. local href/src targets exist
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)(?:\?[^"]*)?"/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|data:|javascript:|\/\/|\/)/.test(target)) continue;
    const rel = target.replace(/^\.\//, "");
    if (OPTIONAL.has(rel) || OPTIONAL.has(join(base, rel))) continue;
    const file = join(base, rel);
    ok(existsSync(file), page + " -> missing " + rel);
  }

  // 2. duplicate ids
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  ok(dup.length === 0, page + " -> duplicate id(s): " + [...new Set(dup)].join(", "));

  // 3. every <img> has alt
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    ok(/\balt="/.test(m[0]), page + " -> img without alt: " + m[0].slice(0, 70));
  }

  // 4. target=_blank links are safe
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    ok(/rel="[^"]*noopener/.test(m[0]), page + " -> target=_blank without noopener");
  }

  // 5. bilingual attributes are paired on the same element
  for (const m of html.matchAll(/<[a-z][^>]*\bdata-en="[^"]*"[^>]*>/g)) {
    ok(/\bdata-al="/.test(m[0]), page + " -> data-en without data-al: " + m[0].slice(0, 70));
  }
}

console.log("link/HTML checks: PASS " + pass + "  FAIL " + fail);
if (fails.length) {
  console.log("Failures:");
  for (const f of fails) console.log(" - " + f);
}
process.exit(fail ? 1 : 0);
