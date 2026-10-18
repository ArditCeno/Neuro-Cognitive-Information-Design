/*
 * Generates one accurate, on-topic SVG diagram per study module (108 total)
 * and injects exactly ONE image into every material file (A/B x EN/AL).
 *
 * Replaces the old generic profession figures (assets/figures) and the
 * mismatched stock photos (assets/photos).
 *
 * Run: node scripts/gen-diagrams.mjs
 * Idempotent. Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { svg } from "./diagrams/lib.mjs";
import { register as registerA } from "./diagrams/groupA.mjs";
import { register as registerB } from "./diagrams/groupB.mjs";
import { register as registerC } from "./diagrams/groupC.mjs";

const D = {}, TITLES = {}, SIZES = {};

function add(key, title, node) {
  const out = typeof node === "string" ? node : svg(title, node.h, node.g);
  const m = out.match(/viewBox="0 0 640 (\d+(?:\.\d+)?)"/);
  D[key] = out.endsWith("\n") ? out : out + "\n";
  TITLES[key] = title;
  SIZES[key] = m ? Number(m[1]) : 300;
}

registerA(add);
registerB(add);
registerC(add);

const keys = Object.keys(D).sort();
mkdirSync("assets/diagrams", { recursive: true });
for (const k of keys) writeFileSync("assets/diagrams/" + k + ".svg", D[k]);
writeFileSync("assets/diagrams/manifest.json", JSON.stringify(
  Object.fromEntries(keys.map((k) => [k + ".svg", [640, SIZES[k]]])), null, 1) + "\n");

/* ----- inject exactly one diagram per material ----- */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const RE_FILE = /^([a-z]+)_(fillestar|mid|senior)_(m\d)_[ab]\.(al|en)\.html$/;
let injected = 0, missing = [];
for (const f of readdirSync("materials")) {
  const m = f.match(RE_FILE);
  if (!m) continue;
  const key = m[1] + "_" + m[2] + "_" + m[3];
  if (!D[key]) { missing.push(key); continue; }
  const path = "materials/" + f;
  let html = readFileSync(path, "utf8");
  html = html.replace(/<figure class="photo">[\s\S]*?<\/figure>\s*/g, "");
  html = html.replace(/<img class="fig"[^>]*>\s*/g, "");
  html = html.replace(/<figure class="diagram">[\s\S]*?<\/figure>\s*/g, "");
  const tag = '<figure class="diagram"><img src="assets/diagrams/' + key + '.svg" width="640" height="' +
    SIZES[key] + '" alt="' + esc(TITLES[key]) + '" loading="lazy" decoding="async"></figure>\n';
  html = html.replace("</h1>", "</h1>\n" + tag);
  writeFileSync(path, html);
  injected++;
}

console.log("diagrams: " + keys.length + "  |  material files updated: " + injected);
if (missing.length) console.log("no diagram for: " + [...new Set(missing)].join(", "));
