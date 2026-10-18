/*
 * Live endpoint health check for the Apps Script admin/submission API.
 * Read-only probes (no submission is sent), so it is safe to run any time.
 *
 * Run: node scripts/test-endpoint.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { CONFIG } from "../js/config.js";

const url = (CONFIG.storage && CONFIG.storage.submission && CONFIG.storage.submission.fallbackUrl) || "";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok  " + m); } else { fail++; console.log("  FAIL " + m); } };

async function get(qs) {
  const res = await fetch(url + (qs ? "?" + qs : ""), { redirect: "follow" });
  return (await res.text()).trim();
}

console.log("endpoint: " + url);
ok(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url), "endpoint URL shape");

try {
  let body = await get("");
  ok(/"service"\s*:\s*"ncid"/.test(body), "GET returns the ncid service banner");
  ok(/"ok"\s*:\s*true/.test(body), "GET ok:true");

  body = await get("callback=cb&action=login&email=arditceno82@gmail.com&password=__definitely_wrong__");
  ok(/^cb\(/.test(body), "JSONP callback is honoured (admin page can read the reply)");
  ok(/bad_password|not_allowed/.test(body), "login rejects a wrong password");

  body = await get("callback=cb&action=data&token=__bad__");
  ok(/unauthorized/.test(body), "data rejects an invalid token");

  body = await get("callback=cb&action=verify&email=arditceno82@gmail.com&code=000000");
  ok(/expired|bad_code/.test(body), "verify rejects an unknown code");
} catch (e) {
  fail++;
  console.log("  FAIL network: " + e.message);
}

console.log("endpoint checks: PASS " + pass + "  FAIL " + fail);
process.exit(fail ? 1 : 0);
