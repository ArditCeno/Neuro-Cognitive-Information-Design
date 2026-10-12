/*
 * Generates placeholder A/B materials for the research protocol:
 *   12 professions x 3 expertise levels x 3 modules x 2 formats x 2 languages = 432 files
 * Run: node scripts/gen-materials.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { PROFESSIONS, EXPERTISE } from "../js/fields.js";

const COMPLEX = { 1: "basic", 2: "intermediate", 3: "advanced" };

const factsEn = {
  1: ["Fact A: the entry value is 10.", "Fact B: the total is 30."],
  2: ["Fact A: the threshold is 25.", "Fact B: the anomaly is +45%.", "Fact C: the margin is 12%."],
  3: ["Fact A: the cap is 48,500.", "Fact B: notice is 60 days, breach notice 30 days.", "Fact C: the anomaly is 55,000 against a trend of 10,000."]
};
const factsAl = {
  1: ["Fakti A: vlera hyrëse është 10.", "Fakti B: totali është 30."],
  2: ["Fakti A: pragu është 25.", "Fakti B: anomalia është +45%.", "Fakti C: marzhi është 12%."],
  3: ["Fakti A: kufiri është 48,500.", "Fakti B: afati 60 ditë, njoftimi i shkeljes 30 ditë.", "Fakti C: anomalia 55,000 kundrejt trendit 10,000."]
};

function content(profession, expertise, mN, version, lang) {
  const p = lang === "al" ? profession.al : profession.en;
  const exp = lang === "al" ? expertise.al : expertise.en;
  const facts = lang === "al" ? factsAl[mN] : factsEn[mN];
  const title = lang === "al"
    ? `${p} - ${exp} - Moduli ${mN} (${COMPLEX[mN]})`
    : `${p} - ${exp} - Module ${mN} (${COMPLEX[mN]})`;

  if (version === "A") {
    return `<h1>${title}</h1>
<h2>${lang === "al" ? "Informacion" : "Information"}</h2>
<ul>
${facts.map((f, i) => `<li${i === facts.length - 1 ? ' data-aoi="kritike" data-critical="true"' : ""}>${f}</li>`).join("\n")}
</ul>
<p>${lang === "al" ? "Ky informacion është ndarë në pika të qarta dhe hapësira logjike." : "This information is split into clear points with logical spacing."}</p>`;
  }
  return `<h1>${title}</h1>
<p>${facts.join(" ")} <span data-aoi="kritike" data-critical="true">${facts[facts.length - 1]}</span> ${lang === "al" ? "Ky informacion paraqitet i ngjeshur, pa ndarje." : "This information is presented compressed, without separation."}</p>`;
}

mkdirSync("materials", { recursive: true });
let n = 0;
for (const prof of PROFESSIONS) {
  for (const exp of EXPERTISE) {
    for (let mN = 1; mN <= 3; mN++) {
      for (const v of ["a", "b"]) {
        for (const lang of ["al", "en"]) {
          const html = content(prof, exp, mN, v.toUpperCase(), lang);
          writeFileSync(`materials/${prof.id}_${exp.id}_m${mN}_${v}.${lang}.html`, html + "\n");
          n++;
        }
      }
    }
  }
}
console.log(`generated ${n} material files`);
