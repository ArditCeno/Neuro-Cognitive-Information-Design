/*
 * Bumps the asset version everywhere:
 *   - ?v=NN on js/ and css/ references in the HTML pages
 *   - ?v=NN on every relative ES-module import inside js/*.js
 *     (so the browser cannot mix a new entry file with a cached old module)
 *
 * Run: node scripts/bump-version.mjs 31
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const v = process.argv[2];
if (!v || !/^\d+$/.test(v)) {
  console.error("usage: node scripts/bump-version.mjs <number>");
  process.exit(1);
}
const q = "?v=" + v;

for (const f of ["index.html", "study.html", "admin.html", "privacy.html", "terms.html"]) {
  let s = readFileSync(f, "utf8");
  s = s.replace(/(js\/[\w.-]+\.js)\?v=\d+/g, "$1" + q);
  s = s.replace(/(css\/[\w.-]+\.css)\?v=\d+/g, "$1" + q);
  writeFileSync(f, s);
}

for (const f of readdirSync("js").filter((x) => x.endsWith(".js"))) {
  const p = "js/" + f;
  let s = readFileSync(p, "utf8");
  s = s.replace(/from\s+(["'])(\.\/[^"'?]+\.js)(\?v=\d+)?\1/g, (_m, qt, path) => "from " + qt + path + q + qt);
  s = s.replace(/import\(\s*(["'])(\.\/[^"'?]+\.js)(\?v=\d+)?\1\s*\)/g, (_m, qt, path) => "import(" + qt + path + q + qt + ")");
  writeFileSync(p, s);
}

console.log("asset version set to " + v);
