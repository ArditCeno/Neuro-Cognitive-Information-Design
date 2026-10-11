/*
 * Generates placeholder A/B materials for every profession x 3 levels x (AL/EN).
 * Run: node scripts/gen-materials.mjs
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { PROFESSIONS, LEVELS } from "../js/fields.js";

const facts = {
  easy: [
    "The service is provided free of charge.",
    "The notice period is 30 days."
  ],
  medium: [
    "The total budget is 200,000 EUR.",
    "The payback period is 18 months.",
    "The expected ROI is 30% over three years.",
    "The main risk is regulatory."
  ],
  hard: [
    "Liability is capped at the fees paid in the last 12 months (48,500 EUR).",
    "The notice period is 60 days; breach notice is 30 days.",
    "Confidentiality lasts 5 years after termination.",
    "The measured anomaly is a marketing cost of 55,000 EUR in Q3 (trend ~10,000 EUR).",
    "The prescribed dose is 500 mg twice daily for 7 days.",
    "The patient is allergic to penicillin (contraindicated).",
    "The triage category is yellow; temperature 38.9 C, heart rate 112 bpm."
  ]
};

function titleOf(p, level) {
  const lv = { easy: "Very easy", medium: "Medium", hard: "Hard" }[level];
  return `${p.en} — ${lv} level`;
}
function titleOfAl(p, level) {
  const lv = { easy: "Shumë e lehtë", medium: "Mesatare", hard: "E vështirë" }[level];
  return `${p.al} — Niveli ${lv}`;
}

function contentEn(p, level, version) {
  const f = facts[level];
  if (version === "B") {
    return `<h1>${titleOf(p, level)}</h1>
<h2>Summary</h2>
<p>The document presents the key information in a clear, structured format.</p>
<h2>Key facts</h2>
<ul>
${f.map((x, i) => `<li${i === f.length - 1 ? ' data-aoi="kritike" data-critical="true"' : ""}>${x}</li>`).join("\n")}</ul>
<h2>Action</h2>
<p>Read the facts and answer the questions.</p>`;
  }
  return `<h1>${titleOf(p, level)}</h1>
<p>This document was prepared for review and contains several statements of fact which the reader must identify and use, without any particular visual emphasis, headings or spacing, so that the text appears as one continuous block of dense prose typical of traditional formatting used in this professional field. ${f.join(" ")} <span data-aoi="kritike" data-critical="true">${f[f.length - 1]}</span> The reader should carefully consider all of the above before answering the questions that follow.</p>`;
}

function contentAl(p, level, version) {
  const f = facts[level];
  if (version === "B") {
    return `<h1>${titleOfAl(p, level)}</h1>
<h2>Përmbledhje</h2>
<p>Dokumenti paraqet informacionin kryesor në një format të qartë dhe të strukturuar.</p>
<h2>Faktet kryesore</h2>
<ul>
${f.map((x, i) => `<li${i === f.length - 1 ? ' data-aoi="kritike" data-critical="true"' : ""}>${x}</li>`).join("\n")}</ul>
<h2>Veprimi</h2>
<p>Lexo faktet dhe përgjigju pyetjeve.</p>`;
  }
  return `<h1>${titleOfAl(p, level)}</h1>
<p>Ky dokument është përgatitur për rishikim dhe përmban disa deklarata faktesh që lexuesi duhet t'i identifikojë dhe përdorë, pa ndonjë theksim vizual, tituj ose hapësirë, kështu që teksti shfaqet si një bllok i vetëm proze i ngjeshur, tipik për formatin tradicional të kësaj fushe profesionale. ${f.join(" ")} <span data-aoi="kritike" data-critical="true">${f[f.length - 1]}</span> Lexuesi duhet t'i shqyrtojë me kujdes të gjitha sa më sipër përpara se t'u përgjigjet pyetjeve që vijojnë.</p>`;
}

mkdirSync("materials", { recursive: true });
let n = 0;
for (const p of PROFESSIONS) {
  for (const l of LEVELS) {
    for (const v of ["A", "B"]) {
      const en = contentEn(p, l.id, v);
      const al = contentAl(p, l.id, v);
      writeFileSync(`materials/${p.id}_${l.id}_${v.toLowerCase()}.en.html`, en + "\n");
      writeFileSync(`materials/${p.id}_${l.id}_${v.toLowerCase()}.al.html`, al + "\n");
      n += 2;
    }
  }
}
console.log(`generated ${n} material files`);
