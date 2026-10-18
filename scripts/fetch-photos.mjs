/*
 * Downloads the 36 study photos from Wikimedia Commons (free licences),
 * saves them in assets/photos/, writes CREDITS.md and prints failures.
 *
 * node scripts/fetch-photos.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { writeFileSync, appendFileSync, mkdirSync } from "node:fs";

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "NCID-Study/1.0 (research; contact arditceno82@gmail.com)";

const ITEMS = [
  ["software_m1_ide", "programming code computer screen"],
  ["software_m2_stack_queue", "stack data structure"],
  ["software_m3_traceback", "software error message screen"],
  ["legal_m1_gazette", "official gazette newspaper"],
  ["legal_m2_appeal_route", "courthouse building"],
  ["legal_m3_printed_code", "law book"],
  ["finance_m1_pl_excel", "spreadsheet finance"],
  ["finance_m2_budget_chart", "financial chart"],
  ["finance_m3_invoice", "invoice document"],
  ["business_m1_swot", "whiteboard meeting"],
  ["business_m2_kpi_dashboard", "business dashboard"],
  ["business_m3_bmc", "sticky notes planning"],
  ["health_m1_anatomy", "human anatomy diagram"],
  ["health_m2_ecg", "electrocardiogram"],
  ["health_m3_devices", "sphygmomanometer"],
  ["nurse_m1_handwash", "hand washing"],
  ["nurse_m2_gcs_card", "hospital medical chart"],
  ["nurse_m3_med_chart", "medication blister pack"],
  ["pedagogue_m1_concept_map", "concept map"],
  ["pedagogue_m2_rubric", "teacher grading papers"],
  ["pedagogue_m3_lesson_plan", "lesson plan"],
  ["biologist_m1_cell", "plant cell microscope"],
  ["biologist_m2_mitosis", "mitosis"],
  ["biologist_m3_foodchain", "food chain"],
  ["biotech_m1_gel", "agarose gel electrophoresis"],
  ["biotech_m2_pcr", "thermocycler"],
  ["biotech_m3_plasmid", "plasmid"],
  ["chemist_m1_ph_chart", "pH indicator chart"],
  ["chemist_m2_titration", "titration"],
  ["chemist_m3_periodic_table", "periodic table"],
  ["electrical_m1_breadboard", "breadboard circuit"],
  ["electrical_m2_oscilloscope", "oscilloscope"],
  ["electrical_m3_multimeter", "multimeter"],
  ["cook_m1_mise_en_place", "mise en place kitchen"],
  ["cook_m2_cuts", "julienne vegetables"],
  ["cook_m3_thermometer", "food thermometer"]
];

const strip = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function search(query) {
  const p = new URLSearchParams({
    action: "query", generator: "search",
    gsrsearch: "filetype:bitmap " + query,
    gsrnamespace: "6", gsrlimit: "8",
    prop: "imageinfo", iiprop: "url|extmetadata|mime",
    iiurlwidth: "1280", format: "json"
  });
  const res = await fetch(API + "?" + p.toString(), { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const pages = (data.query && data.query.pages) ? Object.values(data.query.pages) : [];
  for (const page of pages) {
    const ii = page.imageinfo && page.imageinfo[0];
    if (!ii || !ii.thumburl) continue;
    if (!/^image\/(jpeg|png|webp)$/i.test(ii.mime || "")) continue;
    const md = ii.extmetadata || {};
    return {
      title: page.title,
      url: ii.thumburl,
      page: ii.descriptionurl,
      mime: ii.mime,
      author: strip(md.Artist && md.Artist.value),
      license: strip(md.LicenseShortName && md.LicenseShortName.value)
    };
  }
  return null;
}

mkdirSync("assets/photos", { recursive: true });
writeFileSync("assets/photos/CREDITS.md", "# Photo credits (Wikimedia Commons)\n\n");
let ok = 0; const failed = [];
for (const [name, query] of ITEMS) {
  try {
    let hit = await search(query);
    if (!hit) hit = await search(query.split(" ")[0]);
    if (!hit) { failed.push(name + " (no result)"); continue; }
    const ext = /png/i.test(hit.mime) ? "png" : (/webp/i.test(hit.mime) ? "webp" : "jpg");
    const file = name + "." + ext;
    const img = await fetch(hit.url, { headers: { "User-Agent": UA } });
    if (!img.ok) { failed.push(name + " (download " + img.status + ")"); continue; }
    const buf = Buffer.from(await img.arrayBuffer());
    writeFileSync("assets/photos/" + file, buf);
    appendFileSync("assets/photos/CREDITS.md",
      `- **${file}** — ${hit.title} · ${hit.author || "unknown"} · ${hit.license || "free licence"} · ${hit.page}\n`);
    ok++;
    console.log("ok", file, Math.round(buf.length / 1024) + "KB");
    await new Promise((r) => setTimeout(r, 250));
  } catch (e) {
    failed.push(name + " (" + e.message + ")");
  }
}
console.log(`\nDownloaded ${ok}/${ITEMS.length}`);
if (failed.length) console.log("Failed:\n" + failed.join("\n"));
