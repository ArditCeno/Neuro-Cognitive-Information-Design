/*
 * Inserts photos from assets/photos/ into the matching study materials.
 * A photo named  <profession>_m<N>_<anything>.(jpg|jpeg|png|webp|svg)
 * is placed in module m<N> (A and B, EN and AL).
 *
 * Run: node scripts/apply-photos.mjs
 * Idempotent: removes any previous photo block first.
 *
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { FIELDS } from "../js/fields.js";

const DIR = "assets/photos";
if (!existsSync(DIR)) { console.log("no assets/photos folder"); process.exit(0); }
const files = readdirSync(DIR).filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f));

const byProfModule = {};
for (const f of files) {
  const m = f.match(/^([a-z]+)_m(\d)_/i);
  if (!m) continue;
  (byProfModule[m[1]] = byProfModule[m[1]] || {})["m" + m[2]] = f;
}

function inject(html, file) {
  // remove previous photo block
  html = html.replace(/<figure class="photo">[\s\S]*?<\/figure>\s*/g, "");
  // insert after the first </h1>
  const tag = `<figure class="photo"><img src="../assets/photos/${file}" alt="" loading="lazy" decoding="async"></figure>\n`;
  return html.replace("</h1>", "</h1>\n" + tag);
}

let n = 0;
for (const field of FIELDS) {
  const maps = byProfModule[field.id];
  if (!maps) continue;
  for (const exp of Object.keys(field.expertise)) {
    for (const mod of field.expertise[exp].modules) {
      const file = maps[mod.id];
      if (!file) continue;
      for (const v of ["A", "B"]) {
        const path = mod.materials[v].al;
        if (path && existsSync(path)) { writeFileSync(path, inject(readFileSync(path, "utf8"), file)); n++; }
        const en = mod.materials[v].en;
        if (en && en !== path && existsSync(en)) { writeFileSync(en, inject(readFileSync(en, "utf8"), file)); n++; }
      }
    }
  }
}
console.log(`photos found: ${files.length}; material files updated: ${n}`);
