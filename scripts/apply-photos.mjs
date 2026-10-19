/*
 * Downloads the approved Wikimedia Commons photos (optimised ~1280px) and
 * places them, with a short caption, INTO the matching modules - replacing the
 * diagram for those modules. One image per material is kept.
 *
 * Run: node scripts/apply-photos.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from "node:fs";

const UA = "NCID-study/1.0 (conference materials; contact arditceno1@gmail.com)";

const PHOTOS = {
  "health_fillestar_m3": {
    file: "medicine-circulatory.svg", w: 1600, h: 2413,
    src: "https://upload.wikimedia.org/wikipedia/commons/2/29/Circulatory_System_en.svg",
    credit: "LadyofHats, Mariana Ruiz Villarreal \u2014 Public domain (Wikimedia Commons)",
    cap: { en: "The human circulatory system: arteries in red, veins in blue.", al: "Sistemi i qarkullimit t\u00eb gjakut: arteriet me t\u00eb kuqe, venat me blu." }
  },
  "biologist_fillestar_m2": {
    file: "biology-laboratory.jpg", w: 1280, h: 1280,
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Biology_laboratory.jpg/1280px-Biology_laboratory.jpg",
    credit: "Eduardo (Flickr), CC BY-SA 2.0 (Wikimedia Commons)",
    cap: { en: "A biology laboratory: microscopes and prepared samples.", al: "Laborator biologjie: mikroskop\u00eb dhe mostra t\u00eb p\u00ebrgatitura." }
  },
  "electrical_fillestar_m1": {
    file: "electrical-capacitors.jpg", w: 1280, h: 853,
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Electrolytic_capacitors_mounted_on_a_circuit_board.jpg/1280px-Electrolytic_capacitors_mounted_on_a_circuit_board.jpg",
    credit: "Giovanna 27, CC BY 4.0 (Wikimedia Commons)",
    cap: { en: "Electrolytic capacitors mounted on a printed circuit board (PCB).", al: "Kondensator\u00eb elektrolitik\u00eb mbi nj\u00eb qark t\u00eb printuar (PCB)." }
  },
  "finance_mid_m2": {
    file: "finance-candlestick.png", w: 1280, h: 875,
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Price_Candlestick_Charts_%28US%24%29_and_SMA%2850%29.png/1280px-Price_Candlestick_Charts_%28US%24%29_and_SMA%2850%29.png",
    credit: "Nikolay Zvezdin, CC BY-SA 4.0 (Wikimedia Commons)",
    cap: { en: "Price candlestick charts with a 50-period moving average.", al: "Grafik\u00eb \u00e7mimesh (candlestick) me mesatare l\u00ebviz\u00ebse 50-periudh\u00ebshe." }
  },
  "finance_mid_m3": {
    file: "finance-dax-vdax.png", w: 1280, h: 715,
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/DAX_vs.VDAX-NEW.png/1280px-DAX_vs.VDAX-NEW.png",
    credit: "Watzmann \u2014 Public domain (Wikimedia Commons)",
    cap: { en: "Comparing two market indices over time (DAX vs VDAX).", al: "Krahasimi i dy indekseve t\u00eb tregut nd\u00ebr vite (DAX vs VDAX)." }
  }
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

mkdirSync("assets/photos", { recursive: true });

for (const key of Object.keys(PHOTOS)) {
  const p = PHOTOS[key];
  const out = "assets/photos/" + p.file;
  if (existsSync(out) && readFileSync(out).length > 1000) { console.log("have", p.file); continue; }
  const res = await fetch(p.src, { headers: { "User-Agent": UA } });
  if (!res.ok) { console.log("FAIL", p.file, res.status); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  console.log("saved", p.file, (buf.length / 1024).toFixed(0) + " KB");
}

const RE = /^([a-z]+)_(fillestar|mid|senior)_(m\d)_([ab])\.(al|en)\.html$/;
let n = 0;
for (const f of readdirSync("materials")) {
  const m = f.match(RE);
  if (!m) continue;
  const p = PHOTOS[m[1] + "_" + m[2] + "_" + m[3]];
  if (!p) continue;
  const lang = m[5];
  const path = "materials/" + f;
  let html = readFileSync(path, "utf8");
  html = html.replace(/<figure class="(?:diagram|photo)">[\s\S]*?<\/figure>\s*/g, "");
  const fig =
    '<figure class="photo">' +
    '<img src="assets/photos/' + p.file + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(p.cap[lang]) + '" loading="lazy" decoding="async">' +
    '<figcaption>' + esc(p.cap[lang]) + '</figcaption>' +
    '</figure>\n';
  html = html.replace("</h1>", "</h1>\n" + fig);
  writeFileSync(path, html);
  n++;
}

const lines = ["# Photo credits", "", "Photos are sourced from Wikimedia Commons. Licences and authors:", ""];
for (const key of Object.keys(PHOTOS)) {
  const p = PHOTOS[key];
  lines.push("- `assets/photos/" + p.file + "` \u2014 " + p.credit);
  lines.push("  - " + p.src);
}
lines.push("", "Public domain / CC0 items need no attribution; CC BY / CC BY-SA require the author credit above.");
writeFileSync("assets/photos/CREDITS.md", lines.join("\n") + "\n");

console.log("photo figures injected:", n);
