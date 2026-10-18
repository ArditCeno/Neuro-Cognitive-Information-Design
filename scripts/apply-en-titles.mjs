/*
 * Translates the <h1> heading of every EN material into English, e.g.
 *   "Software - fillestar - M1 - Variabla dhe tipe"
 *   -> "Software - Beginner - M1 - Variables and types"
 *
 * The English topic comes from the diagram's aria-label (assets/diagrams/<key>.svg).
 * Only *.en.html files are touched; the AL materials are left as they are.
 *
 * Run: node scripts/apply-en-titles.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fieldsSrc = readFileSync("js/fields.js", "utf8");
const profMap = {};
for (const m of fieldsSrc.matchAll(/\{"id":"([a-z]+)","al":"[^"]*","en":"([^"]+)"\}/g)) profMap[m[1]] = m[2];
const expMap = {};
const expArr = fieldsSrc.match(/export const EXPERTISE = \[([^\]]*)\]/);
if (expArr) for (const m of expArr[1].matchAll(/\{"id":"([a-z]+)","al":"[^"]*","en":"([^"]+)"\}/g)) expMap[m[1]] = m[2];

const titles = {};
for (const f of readdirSync("assets/diagrams").filter((x) => x.endsWith(".svg"))) {
  const s = readFileSync("assets/diagrams/" + f, "utf8");
  const m = s.match(/aria-label="([^"]*)"/);
  titles[f.replace(/\.svg$/, "")] = m ? m[1] : "";
}

const RE = /^([a-z]+)_(fillestar|mid|senior)_(m\d)_([ab])\.en\.html$/;
let changed = 0, missing = new Set();
for (const f of readdirSync("materials")) {
  const m = f.match(RE);
  if (!m) continue;
  const key = m[1] + "_" + m[2] + "_" + m[3];
  const topic = titles[key];
  if (!topic) { missing.add(key); continue; }
  const level = expMap[m[2]] || m[2];
  const field = profMap[m[1]] || m[1];
  const title = esc(field + " - " + level + " - " + m[3].toUpperCase() + " - " + topic);
  const p = "materials/" + f;
  const html = readFileSync(p, "utf8");
  const next = html.replace(/<h1>[\s\S]*?<\/h1>/, "<h1>" + title + "</h1>");
  if (next !== html) { writeFileSync(p, next); changed++; }
}

console.log("EN headings updated: " + changed);
if (missing.size) console.log("no diagram title for: " + [...missing].join(", "));
