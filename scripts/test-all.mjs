/*
 * Full self-test: structure, materials, quizzes, diagrams, config.
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
const diagramRefs = new Set();
const missingFiles = [];
const missingDiagrams = [];

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
          ok((html.match(/class="(?:diagram|photo)"/g) || []).length === 1, "exactly one figure " + p);
          ok(!/assets\/figures\//.test(html), "no legacy figure refs " + p);
          const re = /src="([^"]+)"/g;
          let m;
          while ((m = re.exec(html))) {
            const src = m[1];
            if (/^(\.\.\/|\.\/)?assets\//.test(src)) {
              const rel = src.replace(/^(\.\.\/|\.\/)/, "");
              diagramRefs.add(rel);
              if (!existsSync(rel)) missingDiagrams.push(rel);
            }
          }
        }
      }
    });
  }
}
ok(missingFiles.length === 0, "all material files exist (" + missingFiles.length + " missing)");
ok(missingDiagrams.length === 0, "all referenced diagrams exist (" + missingDiagrams.length + " missing)");
ok(modules === 108, "108 modules (got " + modules + ")");
ok(quizzes === 648, "648 quiz items (got " + quizzes + ")");
ok(enQuestions > 600, "EN questions translated (" + enQuestions + ")");

// diagrams
const diagramFiles = existsSync("assets/diagrams") ? readdirSync("assets/diagrams").filter((x) => /\.svg$/i.test(x)) : [];
ok(diagramFiles.length === 108, "108 diagrams (got " + diagramFiles.length + ")");
const photoFiles = existsSync("assets/photos") ? readdirSync("assets/photos").filter((x) => /\.(jpg|jpeg|png|webp|svg)$/i.test(x)) : [];
ok(photoFiles.length === 5, "5 approved photos (got " + photoFiles.length + ")");
ok(diagramRefs.size === 108, "image refs in materials (" + diagramRefs.size + " unique: 103 diagrams + 5 photos)");
ok(existsSync("assets/photos/CREDITS.md"), "photo credits present");
ok(!existsSync("assets/figures"), "legacy assets/figures removed");

// config
const s = CONFIG.storage || {};
ok(s.supabase && /supabase\.co/.test(s.supabase.url || ""), "Supabase URL configured");
ok(s.supabase && /^sb_publishable_/.test(s.supabase.anonKey || ""), "Supabase publishable key");
ok(
  s.submission && (/functions\/v1\/submit/.test(s.submission.url || "") ||
    /script\.google\.com/.test(s.submission.url || "") ||
    /script\.google\.com/.test(s.submission.fallbackUrl || "")),
  "submission/email endpoint configured"
);
ok(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(s.submission.fallbackUrl || ""), "Apps Script email endpoint configured");
ok(!!s.submission.fallbackToken, "email token configured (documented tradeoff)");
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

// one-email guarantees (client + Apps Script)
const storageSrc = readFileSync("js/storage.js", "utf8");
ok(/ensureSubmissionId/.test(storageSrc), "stable submission id persisted");
ok(/markReportSent/.test(storageSrc) && /reportWasSent/.test(storageSrc), "client at-most-once marker");
ok(/uncertain: true/.test(storageSrc), "ambiguous send is not blind-retried");
ok(!/mode:\s*["']no-cors["']/.test(storageSrc), "no blind no-cors POST");
ok(/ev\.source\s*&&\s*ev\.source\s*!==\s*iframe\.contentWindow/.test(storageSrc), "iframe reply origin checked");
const gs = readFileSync("email-setup/Code.gs", "utf8");
ok(/function alreadySent_/.test(gs) && /function markSent_/.test(gs), "server dedupes emails by submission and participant id");
ok(/LockService/.test(gs), "server serializes duplicate submissions");
ok(/duplicate: true/.test(gs), "duplicate submissions return a success reply");
const appSrc = readFileSync("js/app.js", "utf8");
ok(/submissionId:\s*Storage\.ensureSubmissionId\(\)/.test(appSrc), "export carries the stable submission id");
ok(/state\.sending/.test(appSrc), "resend cannot run twice at once");
ok(/reportWasSent\(sid\)/.test(appSrc), "resend respects the sent marker");

// content truth (no contradictory numbers)
const readme = readFileSync("README.md", "utf8");
ok(!/10[–-]15 minutes/.test(readme), "README duration matches the 30-minute flow");
ok(/432 documents/.test(readme), "README document count (108 x A/B x EN/AL)");
const infoSrc = readFileSync("study-info.html", "utf8");
ok(!/desktop only/i.test(infoSrc), "study-info no longer says desktop only");
ok(/laptop is recommended/i.test(infoSrc), "study-info states the recommendation");
const methodSrc = readFileSync("methodology.html", "utf8");
ok(!/3 of 5 modules/.test(methodSrc), "methodology module count is accurate");
const fieldsSrc = readFileSync("fields.html", "utf8");
ok(/Twelve professions/.test(fieldsSrc), "fields page covers 12 professions");

console.log(`PASS ${pass}  FAIL ${fail}`);
if (fails.length) { console.log("Failures:"); fails.forEach((x) => console.log(" - " + x)); }
console.log("modules", modules, "| quiz items", quizzes, "| EN questions", enQuestions, "| diagrams", diagramFiles.length, "| diagram refs", diagramRefs.size);
process.exit(fail ? 1 : 0);
