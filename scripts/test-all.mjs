/*
 * Full self-test: structure, materials, quizzes, photos, config.
 * node scripts/test-all.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { FIELDS, EXPERTISE } from "../js/fields.js";
import { CONFIG } from "../js/config.js";

let pass = 0, fail = 0;
const fails = [];
const ok = (cond, msg) => { if (cond) pass++; else { fail++; fails.push(msg); } };

// structure
ok(FIELDS.length === 12, "12 professions (got " + FIELDS.length + ")");
ok(EXPERTISE.length === 3, "3 expertise levels");
let modules = 0, quizzes = 0, enQuestions = 0, alQuestions = 0;
const photoRefs = new Set();
const missingFiles = [];
const missingPhotos = [];

for (const f of FIELDS) {
  ok(!!f.id && !!f.name.en && !!f.name.al, "field names: " + f.id);
  for (const e of EXPERTISE) {
    const ex = f.expertise[e.id];
    ok(!!ex, "expertise " + f.id + "/" + e.id);
    ok(ex && ex.modules.length === 3, "modules=3 " + f.id + "/" + e.id);
    (ex ? ex.modules : []).forEach((mod) => {
      modules++;
      ok(["m1", "m2", "m3"].includes(mod.id), "module id " + f.id + "/" + e.id + "/" + mod.id);
      for (const v of ["A", "B"]) {
        ok(mod.quiz[v].length >= 3, "quiz " + f.id + "/" + e.id + "/" + mod.id + "/" + v);
        mod.quiz[v].forEach((q) => {
          quizzes++;
          if (q.q.en && q.q.en !== q.q.al) enQuestions++; else alQuestions++;
          ok(q.options.every((o) => o.en && o.al), "quiz options " + f.id);
          ok(q.correct >= 0 && q.correct < q.options.length, "correct index " + f.id);
        });
        for (const lang of ["al", "en"]) {
          const p = mod.materials[v][lang];
          if (!p || !existsSync(p)) { missingFiles.push(p || "null"); continue; }
          const html = readFileSync(p, "utf8");
          const re = /src="([^"]+)"/g;
          let m;
          while ((m = re.exec(html))) {
            const src = m[1];
            if (src.indexOf("../assets/") === 0) {
              const rel = src.replace(/^\.\.\//, "");
              photoRefs.add(rel);
              if (!existsSync(rel)) missingPhotos.push(rel);
            }
          }
        }
      }
    });
  }
}
ok(missingFiles.length === 0, "all material files exist (" + missingFiles.length + " missing)");
ok(missingPhotos.length === 0, "all referenced photos exist (" + missingPhotos.length + " missing)");
ok(modules === 108, "108 modules (got " + modules + ")");
ok(quizzes === 648, "648 quiz items (got " + quizzes + ")");
ok(enQuestions > 600, "EN questions translated (" + enQuestions + ")");

// photos
const photoFiles = existsSync("assets/photos") ? readdirSync("assets/photos").filter((x) => /\.(jpg|jpeg|png|webp)$/i.test(x)) : [];
ok(photoFiles.length === 36, "36 photos (got " + photoFiles.length + ")");
ok(photoRefs.size > 0, "photos referenced in materials (" + photoRefs.size + " unique)");

// config
const s = CONFIG.storage || {};
ok(s.supabase && /supabase\.co/.test(s.supabase.url || ""), "Supabase URL configured");
ok(s.supabase && /^sb_publishable_/.test(s.supabase.anonKey || ""), "Supabase publishable key");
ok(
  s.submission && (/functions\/v1\/submit/.test(s.submission.url || "") || /script\.google\.com/.test(s.submission.url || "")),
  "submission endpoint configured (" + ((s.submission && s.submission.url) || "none") + ")"
);
ok(!!s.submission.fallbackUrl || /script.google.com/.test(s.submission.url || ""), "email fallback configured");
ok(existsSync("supabase/functions/submit/index.ts"), "Edge Function submit present");
const edge = existsSync("supabase/functions/submit/index.ts")
  ? readFileSync("supabase/functions/submit/index.ts", "utf8") : "";
ok(/APPS_SCRIPT_URL/.test(edge) && /APPS_SCRIPT_TOKEN/.test(edge), "Edge Function email secrets referenced");
ok(existsSync("supabase/security.sql"), "security.sql present");
ok(CONFIG.adminEmail === "arditceno82@gmail.com", "admin email configured");
ok(CONFIG.fields.length === 12, "CONFIG fields loaded");

// pages
["index.html", "study.html", "admin.html", "privacy.html", "terms.html"].forEach((p) =>
  ok(existsSync(p), "page exists: " + p));

console.log(`PASS ${pass}  FAIL ${fail}`);
if (fails.length) { console.log("Failures:"); fails.forEach((x) => console.log(" - " + x)); }
console.log("modules", modules, "| quiz items", quizzes, "| EN questions", enQuestions, "| photos", photoFiles.length, "| photo refs", photoRefs.size);
process.exit(fail ? 1 : 0);
