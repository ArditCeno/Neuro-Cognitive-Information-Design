/*
 * Captures the four README screenshots with headless Chrome (CDP).
 * No npm packages required. Run: node scripts/capture-screenshots.mjs
 *
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";

const ROOT = process.cwd();
const SERVE_PORT = 8765;
const CDP_PORT = 9333;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "assets/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

/* ---- tiny static server ---- */
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".wasm": "application/wasm", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/") p = "/index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  try {
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  } catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(SERVE_PORT, "127.0.0.1", r));

/* ---- launch Chrome ---- */
const profile = path.join(os.tmpdir(), "ncid-shot-" + Date.now());
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=" + CDP_PORT, "--user-data-dir=" + profile,
  "--window-size=1440,900", "about:blank"
], { stdio: "ignore" });

async function waitVersion() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`); if (r.ok) return; } catch {}
    await sleep(250);
  }
  throw new Error("Chrome did not start");
}
await waitVersion();

const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
const page = list.find((t) => t.type === "page");
if (!page) throw new Error("no page target");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function cmd(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expr) {
  const r = await cmd("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result && r.result.exceptionDetails) console.log("eval:", (r.result.exceptionDetails.text || "").slice(0, 120));
}
async function cap(name) {
  const r = await cmd("Page.captureScreenshot", { format: "png" });
  if (!r.result || !r.result.data) { console.log("capture failed", name); return; }
  writeFileSync(path.join(OUT, name + ".png"), Buffer.from(r.result.data, "base64"));
  console.log("saved", name + ".png");
}
async function capJpg(name, quality = 88) {
  const r = await cmd("Page.captureScreenshot", { format: "jpeg", quality });
  if (!r.result || !r.result.data) { console.log("capture failed", name); return; }
  writeFileSync(path.join(OUT, name + ".jpg"), Buffer.from(r.result.data, "base64"));
  console.log("saved", name + ".jpg");
}
const BASE = `http://127.0.0.1:${SERVE_PORT}`;

await cmd("Page.enable");
await cmd("Runtime.enable");
await cmd("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

/* 1) landing */
await cmd("Page.navigate", { url: BASE + "/index.html" });
await sleep(2600);
await capJpg("landing", 88);

/* 2) registration */
await cmd("Page.navigate", { url: BASE + "/study.html?mock=1" });
await sleep(2000);
await ev("document.getElementById('consentCheck').click(); document.getElementById('btnConsent').click();");
await sleep(900);
await cap("registration");

/* 3) reading (simulated run) */
await ev(`
  var n=document.getElementById('regName'); if(n) n.value='Ardit Ceno';
  var a=document.getElementById('regAge'); if(a) a.value='24';
  var p=document.getElementById('regProfession'); if(p) p.selectedIndex=1;
  var e=document.getElementById('regExpertise'); if(e) e.selectedIndex=1;
  var f=document.getElementById('regForm'); if(f) f.requestSubmit();
`);
await sleep(1000);
await cap("setup");
await ev("var b=document.getElementById('btnCamera'); if(b) b.click();");
await sleep(1600);
await ev("var x=document.getElementById('btnSetupNext'); if(x) x.click();");
await sleep(1900);
await ev("var s=document.getElementById('btnStartReading'); if(s) s.click();");
await sleep(3200);
await cap("reading");

/* 4) admin dashboard (demo preview, no login) */
await cmd("Page.navigate", { url: BASE + "/admin.html?demo=1" });
await sleep(2800);
await cap("admin");

ws.close();
chrome.kill();
server.close();
console.log("done");
process.exit(0);
