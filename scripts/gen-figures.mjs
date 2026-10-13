/*
 * Generates one SVG figure per profession and injects it into that
 * profession's materials (figure element after the <h1>).
 * Run: node scripts/gen-figures.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "node:fs";

const B = "#0E7FB0", O = "#FF6E42", N = "#092634", W = "#F9F9F9", G = "#2F7FA0";

function wrap(inner, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" height="260" font-family="Arial, sans-serif">
  <rect width="640" height="260" fill="${W}"/>
  <text x="16" y="26" font-size="15" font-weight="700" fill="${N}">${title}</text>
  <g transform="translate(0,34)">${inner}</g>
</svg>`;
}
const box = (x, y, w, h, fill, label, tc) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${N}" stroke-opacity=".15"/>
   <text x="${x + w / 2}" y="${y + h / 2 + 5}" font-size="13" text-anchor="middle" fill="${tc || N}">${label}</text>`;

const FIGURES = {
  software: wrap(`
    ${box(40, 80, 140, 60, "#E8F1F7", "input")}
    ${box(230, 80, 160, 60, "#E8F1F7", "if condition")}
    ${box(440, 40, 150, 50, "#FDE7DF", "output A", "#7a2b12")}
    ${box(440, 120, 150, 50, "#FDE7DF", "output B", "#7a2b12")}
    <line x1="180" y1="110" x2="230" y2="110" stroke="${N}" marker-end="url(#a)"/>
    <line x1="390" y1="95" x2="440" y2="65" stroke="${N}"/>
    <line x1="390" y1="125" x2="440" y2="145" stroke="${N}"/>
    <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${N}"/></marker></defs>
  `, "Informatikë · flowchart"),
  legal: wrap(`
    <rect x="60" y="20" width="240" height="190" rx="10" fill="#fff" stroke="${N}"/>
    <text x="80" y="45" font-size="13" fill="${N}">SECTION 4</text>
    ${[0, 1, 2, 3, 4].map((i) => `<line x1="80" y1="${65 + i * 22}" x2="280" y2="${65 + i * 22}" stroke="${B}" stroke-width="3" stroke-opacity=".5"/>`).join("")}
    <text x="340" y="60" font-size="12" fill="${G}">heading</text><line x1="340" y1="70" x2="560" y2="70" stroke="${N}" stroke-opacity=".3"/>
    <text x="340" y="95" font-size="12" fill="${G}">short point</text><line x1="340" y1="105" x2="560" y2="105" stroke="${N}" stroke-opacity=".3"/>
    <text x="340" y="130" font-size="12" fill="${G}">short point</text><line x1="340" y1="140" x2="560" y2="140" stroke="${N}" stroke-opacity=".3"/>
  `, "Drejtësi · structured vs plain"),
  finance: wrap(`
    ${[60, 140, 220, 300].map((x, i) => {
      const h = [60, 90, 70, 40][i];
      return `<rect x="${x}" y="${170 - h}" width="60" height="${h}" fill="${i === 3 ? O : B}" rx="4"/>
              <text x="${x + 30}" y="188" font-size="12" text-anchor="middle" fill="${N}">Q${i + 1}</text>`;
    }).join("")}
    <text x="440" y="80" font-size="24" font-weight="700" fill="${O}">55k</text>
    <text x="440" y="100" font-size="12" fill="${N}">marketing spike</text>
  `, "Financë · P&L chart"),
  business: wrap(`
    <rect x="80" y="20" width="200" height="90" rx="8" fill="#E8F1F7" stroke="${N}"/><text x="180" y="70" text-anchor="middle" font-size="13">S</text>
    <rect x="300" y="20" width="200" height="90" rx="8" fill="#E8F1F7" stroke="${N}"/><text x="400" y="70" text-anchor="middle" font-size="13">W</text>
    <rect x="80" y="125" width="200" height="90" rx="8" fill="#FDE7DF" stroke="${N}"/><text x="180" y="175" text-anchor="middle" font-size="13">O</text>
    <rect x="300" y="125" width="200" height="90" rx="8" fill="#FDE7DF" stroke="${N}"/><text x="400" y="175" text-anchor="middle" font-size="13">T</text>
  `, "Biznes · SWOT"),
  health: wrap(`
    <rect x="60" y="90" width="100" height="60" rx="8" fill="#FDE0E0" stroke="#b91c1c"/><text x="110" y="126" text-anchor="middle">Red</text>
    <rect x="180" y="90" width="100" height="60" rx="8" fill="#FEF7C3" stroke="#a16207"/><text x="230" y="126" text-anchor="middle">Yellow</text>
    <rect x="300" y="90" width="100" height="60" rx="8" fill="#DEFCE7" stroke="#15803d"/><text x="350" y="126" text-anchor="middle">Green</text>
    <text x="440" y="120" font-size="13" fill="${N}">T 38.9 · HR 112</text>
  `, "Mjekësi · triage"),
  nurse: wrap(`
    ${box(40, 100, 120, 50, "#E8F1F7", "assess")}
    ${box(200, 100, 120, 50, "#E8F1F7", "plan")}
    ${box(360, 100, 120, 50, "#E8F1F7", "act")}
    ${box(520, 100, 100, 50, "#FDE7DF", "eval", "#7a2b12")}
    ${[160, 320, 480].map((x) => `<line x1="${x}" y1="125" x2="${x + 40}" y2="125" stroke="${N}" marker-end="url(#b)"/>`).join("")}
    <defs><marker id="b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${N}"/></marker></defs>
  `, "Infermieri · care sequence"),
  pedagogue: wrap(`
    <circle cx="320" cy="110" r="36" fill="${O}"/><text x="320" y="115" text-anchor="middle" fill="#fff" font-size="12">topic</text>
    ${[[180, 50], [180, 170], [460, 50], [460, 170]].map(([x, y]) =>
      `<line x1="320" y1="110" x2="${x}" y2="${y}" stroke="${B}" stroke-opacity=".5"/>
       <circle cx="${x}" cy="${y}" r="26" fill="#E8F1F7" stroke="${B}"/>`).join("")}
  `, "Pedagogji · concept map"),
  biologist: wrap(`
    <circle cx="320" cy="120" r="80" fill="#E8F1F7" stroke="${B}" stroke-width="2"/>
    <circle cx="320" cy="120" r="30" fill="${B}" fill-opacity=".35" stroke="${N}"/>
    <text x="320" y="125" text-anchor="middle" font-size="12">cell</text>
  `, "Biologji · cell"),
  biotech: wrap(`
    <path d="M120 30 C 200 90, 120 150, 200 210" fill="none" stroke="${B}" stroke-width="4"/>
    <path d="M200 30 C 120 90, 200 150, 120 210" fill="none" stroke="${O}" stroke-width="4"/>
    ${[50, 90, 130, 170].map((y) => `<line x1="140" y1="${y}" x2="180" y2="${y}" stroke="${N}" stroke-opacity=".4"/>`).join("")}
    <text x="300" y="120" font-size="13" fill="${N}">DNA / process</text>
  `, "Bioteknologji · helix"),
  chemist: wrap(`
    <circle cx="260" cy="110" r="26" fill="#E8F1F7" stroke="${N}"/><text x="260" y="115" text-anchor="middle" font-size="12">A</text>
    <circle cx="340" cy="70" r="22" fill="#FDE7DF" stroke="${N}"/>
    <circle cx="350" cy="160" r="22" fill="#FDE7DF" stroke="${N}"/>
    <line x1="284" y1="98" x2="320" y2="78" stroke="${N}"/>
    <line x1="285" y1="122" x2="330" y2="152" stroke="${N}"/>
    <text x="420" y="120" font-size="16" fill="${O}">→</text>
  `, "Kimi · molecule"),
  electrical: wrap(`
    <rect x="80" y="40" width="480" height="160" rx="8" fill="none" stroke="${B}" stroke-width="3"/>
    <rect x="150" y="90" width="40" height="60" fill="${N}"/><text x="170" y="128" text-anchor="middle" fill="#fff" font-size="11">V</text>
    <rect x="330" y="90" width="70" height="40" fill="#fff" stroke="${N}"/><text x="365" y="116" text-anchor="middle" font-size="11">R</text>
    <text x="230" y="180" font-size="12" fill="${N}">I = V / R</text>
  `, "Inxhinieri elektrike · circuit"),
  cook: wrap(`
    ${[80, 260, 440].map((x, i) => box(x, 90, 120, 60, i === 2 ? "#FDE7DF" : "#E8F1F7", `step ${i + 1}`)).join("")}
    <line x1="200" y1="120" x2="260" y2="120" stroke="${N}"/>
    <line x1="380" y1="120" x2="440" y2="120" stroke="${N}"/>
    <circle cx="540" cy="120" r="24" fill="none" stroke="${O}" stroke-width="3"/><text x="540" y="125" text-anchor="middle" font-size="11" fill="${O}">timing</text>
  `, "Kuzhinieri · steps")
};

mkdirSync("assets/figures", { recursive: true });
for (const id of Object.keys(FIGURES)) writeFileSync(`assets/figures/${id}.svg`, FIGURES[id] + "\n");

// inject figure into each material of the profession (once)
let injected = 0;
for (const f of readdirSync("materials")) {
  if (!f.endsWith(".al.html")) continue;
  const id = f.split("_")[0];
  if (!FIGURES[id]) continue;
  const path = "materials/" + f;
  let html = readFileSync(path, "utf8");
  if (html.indexOf("assets/figures") >= 0) continue;
  html = html.replace("</h1>", `</h1>\n<img class="fig" src="../assets/figures/${id}.svg" alt="${id} figure">`);
  writeFileSync(path, html);
  injected++;
}
console.log(`figures: ${Object.keys(FIGURES).length}, injected into ${injected} materials`);
