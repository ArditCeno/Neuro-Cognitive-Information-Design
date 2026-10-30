/*
 * SEO/PWA/metadata checks for the public pages.
 * Run: node scripts/test-seo.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { readFileSync, existsSync } from "node:fs";

const BASE = "https://arditceno.github.io/Neuro-Cognitive-Information-Design/";
const PAGES = [
  "index.html", "study.html", "study-info.html", "about.html",
  "methodology.html", "fields.html", "contact.html", "privacy.html", "terms.html"
];

let pass = 0, fail = 0;
const fails = [];
const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };

for (const page of PAGES) {
  ok(existsSync(page), "page exists: " + page);
  if (!existsSync(page)) continue;
  const html = readFileSync(page, "utf8");
  const url = BASE + (page === "index.html" ? "" : page);

  ok(/<title>[^<]{10,}<\/title>/i.test(html), page + " -> title");
  ok(/<meta name="description" content="[^"]{40,}"/i.test(html), page + " -> meta description");
  ok(/<meta name="theme-color"/i.test(html), page + " -> theme-color");
  ok(/<meta property="og:title"/i.test(html), page + " -> og:title");
  ok(/<meta property="og:description"/i.test(html), page + " -> og:description");
  ok(/<meta property="og:type"/i.test(html), page + " -> og:type");
  ok(new RegExp('rel="canonical" href="' + url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"').test(html), page + " -> canonical");
  ok(/rel="manifest" href="site\.webmanifest"/.test(html), page + " -> manifest link");
  ok(/<html lang="(en|sq)"/.test(html), page + " -> html lang");
}

// manifest
const manifest = JSON.parse(readFileSync("site.webmanifest", "utf8"));
ok(manifest.name && manifest.short_name, "manifest name/short_name");
ok(manifest.start_url && manifest.scope, "manifest start_url/scope");
ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest icons");

// robots + sitemap
ok(existsSync("robots.txt"), "robots.txt present");
const robots = readFileSync("robots.txt", "utf8");
ok(/Sitemap:\s*https:\/\//.test(robots), "robots.txt has sitemap");
ok(existsSync("sitemap.xml"), "sitemap.xml present");
const sitemap = readFileSync("sitemap.xml", "utf8");
for (const page of PAGES) {
  const url = BASE + (page === "index.html" ? "" : page);
  ok(sitemap.includes("<loc>" + url + "</loc>"), "sitemap includes " + page);
}

// security.txt
const sec = ".well-known/security.txt";
ok(existsSync(sec), "security.txt present");
if (existsSync(sec)) {
  const body = readFileSync(sec, "utf8");
  ok(/^Contact:/m.test(body), "security.txt Contact");
  ok(/^Expires:/m.test(body), "security.txt Expires");
  ok(/^Canonical:/m.test(body), "security.txt Canonical");
}

console.log("SEO/metadata checks: PASS " + pass + "  FAIL " + fail);
if (fails.length) {
  console.log("Failures:");
  for (const f of fails) console.log(" - " + f);
}
process.exit(fail ? 1 : 0);
