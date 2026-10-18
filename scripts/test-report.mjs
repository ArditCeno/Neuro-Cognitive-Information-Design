/*
 * End-to-end report test with a named participant.
 *
 * Runs the REAL pipeline: js/schema.js builders -> assembleSession ->
 * splitIdentity -> the Apps Script email body (email-setup/Code.gs) and the
 * EmailJS body (js/report.js). Writes inspectable artifacts to test-output/.
 *
 * Run: node scripts/test-report.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

/* ---- minimal browser polyfills so the app modules import under Node ---- */
globalThis.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] == null ? null : this._d[k]; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; }
};
globalThis.document = {
  documentElement: { setAttribute() {} },
  querySelectorAll() { return []; },
  createElement() {
    return {
      width: 0, height: 0, style: {},
      getContext() { return { fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set font(v) {} }; },
      toDataURL() { return "data:image/png;base64,"; }
    };
  }
};
if (!globalThis.window) globalThis.window = globalThis;

const { buildTrial, buildModule, assembleSession, stimulusMeta, alignGazeSamples } =
  await import("../js/schema.js");
const { emailTableHTML } = await import("../js/report.js");

/* ---- the real Apps Script email body, evaluated from email-setup/Code.gs ---- */
const codeGs = readFileSync("email-setup/Code.gs", "utf8");
const appsScriptTableHTML = new Function(codeGs + "\nreturn tableHTML;")();

/* ------------------------------ assertions ------------------------------ */
let pass = 0, fail = 0; const fails = [];
const ok = (cond, msg) => { if (cond) pass++; else { fail++; fails.push(msg); } };
const has = (hay, needle, msg) => ok(String(hay).indexOf(needle) >= 0, msg + "  [missing: " + needle + "]");

/* --------------------------- synthetic participant --------------------------- */
const field = { id: "software", name: { en: "Software", al: "Informatikë" } };
const expertise = { id: "senior", en: "Senior", al: "Senior" };
const participant = {
  id_anonim: "USR_TEST_ARDIT_001",
  emri_mbiemer: "Ardit Ceno",
  profesioni: "Software",
  fusha: "software",
  "niveli_i_ekspertizës": "Senior",
  mosha: 24
};
const session = {
  session_number: 1,
  gjuha: "en",
  metoda: "eyetracking",
  kalibrimi_px: 74,
  "kohëzgjatja_min": 12.4,
  shfletuesi: "Chrome",
  pajisja: "Desktop"
};

const MODS = [
  { id: "m1", complexity: "basic", preference: "A" },
  { id: "m2", complexity: "intermediate", preference: "B" },
  { id: "m3", complexity: "advanced", preference: "A" }
];
const TLX = { mental: 12, physical: 3, temporal: 8, performance: 6, effort: 9, frustration: 4 };
const QUESTIONS = [];
const modules = [];

MODS.forEach((mm, orderIndex) => {
  const trials = ["A", "B"].map((version, vi) => {
    const quiz = [0, 1, 2].map((qi) => {
      const qText = "Test " + mm.id + " " + version + " question " + (qi + 1) + "?";
      QUESTIONS.push(qText);
      return {
        q: qText,
        chosen: ["Opsi A", "Opsi B", "Opsi C"][qi],
        correct: qi !== 2,
        correct_text: ["Opsi A", "Opsi B", "Opsi A"][qi],
        critical: qi === 0,
        time_s: 3 + qi
      };
    });
    return buildTrial({
      field, version, moduleId: mm.id, complexity: mm.complexity,
      stimulus: stimulusMeta(field, version, "<h1>Software</h1><p>Compressed vs structured sample text for readability.</p>", mm.id, mm.complexity),
      readingTimeSec: 30 + vi * 12 + orderIndex * 5,
      taskTimeSec: 44 + vi * 10,
      metrics: { time_to_first_fixation_ms: 380 + vi * 40, saccadic_regressions: 9 + vi * 3, fixation_duration_ms: 205 + vi * 15, fixation_count: 60 + vi * 7, dwell: [{ aoi: "kritike", ms: 1200 + vi * 100 }] },
      quiz
    });
  });
  modules.push(buildModule({
    field, expertise: expertise.id, moduleId: mm.id, complexity: mm.complexity,
    preference: mm.preference, orderIndex, firstVersion: "A",
    trials, nasaTlx: TLX
  }));
});

const gazeRaw = Array.from({ length: 12 }, (_, i) => ({ t: i * 100, x: 100 + i * 5, y: 200 + i * 3, dx: 50 + i, dy: 60 + i }));
const bioSamples = Array.from({ length: 12 }, (_, i) => ({ t: i * 100, ear: i % 4 === 0 ? 0.18 : 0.30, yaw: 1 + i * 0.1, pitch: -2 - i * 0.1, roll: 0.4 - i * 0.05 }));
const biometricMetrics = {
  fixation_duration_ms: 212, saccadic_regressions: 15, time_to_first_fixation_ms: 420,
  task_completion_time_s: 96, reading_time_s: 88, blink_rate_per_min: 17,
  head_pose: { yaw_mean: 1.2, pitch_mean: -2.1, roll_mean: 0.4 }
};
const quizResults = { total_questions: 18, correct_answers: 12, accuracy_score_pct: 66.7 };

const summary = assembleSession({
  participant, session, modules, biometricMetrics, quizResults,
  gaze: alignGazeSamples(gazeRaw, bioSamples)
});

/* --------------------------- privacy split (same as app.js) --------------------------- */
function splitIdentity(s) {
  const clean = JSON.parse(JSON.stringify(s));
  const id = (clean.participant && clean.participant.id_anonim) || "";
  const nome = (clean.participant && clean.participant.emri_mbiemer) || "";
  if (clean.participant) delete clean.participant.emri_mbiemer;
  return { clean, identity: { id_anonim: id, emri_mbiemer: nome } };
}
const { clean, identity } = splitIdentity(summary);

/* ------------------------------ assertions ------------------------------ */
ok(Array.isArray(summary.modules) && summary.modules.length === 3, "3 modules assembled");
ok(summary.modules.every((m) => m.trials.length === 2), "each module has A and B trials");
ok(summary.modules.every((m) => m.trials.every((t) => t.response.length === 3)), "3 answers per trial");
ok(summary.gaze.length === gazeRaw.length, "gaze aligned to bio samples");
ok(summary.gaze.some((g) => g.dx != null && g.head_pose != null), "gaze samples carry doc coords + head pose");

ok(summary.participant.emri_mbiemer === "Ardit Ceno", "summary carries the name");
ok(!("emri_mbiemer" in clean.participant), "PRIVACY: name removed from the stored payload");
ok(identity.emri_mbiemer === "Ardit Ceno", "PRIVACY: name isolated in identity");

/* ---- Apps Script email (the actual email the researcher receives) ---- */
const mail = appsScriptTableHTML(summary, identity);
["Ardit Ceno", "USR_TEST_ARDIT_001", "Software", "Senior", "24",
 "Session no", "74", "12.4", "Chrome", "Desktop", "en", "eyetracking", "66.7"]
  .forEach((needle) => has(mail, needle, "email identity/session field present"));
ok(/<h3>Results by level and version<\/h3>/.test(mail), "email has results table");
ok(/<h3>Answers<\/h3>/.test(mail), "email has answers table");
ok(/<h3>NASA-TLX and preference<\/h3>/.test(mail), "email has NASA-TLX table");
ok(/<h3>Biometrics and timing<\/h3>/.test(mail), "email has biometrics table");
QUESTIONS.forEach((q) => has(mail, q, "email contains every question"));
["Opsi A", "Opsi B", "Opsi C"].forEach((c) => has(mail, c, "email contains every chosen answer"));
["212", "15", "420", "96", "88", "17", "1.2", "-2.1", "0.4"].forEach((v) => has(mail, v, "email contains biometric value"));
["12", "3", "8", "6", "9", "4"].forEach((v) => has(mail, ">" + v + "<", "email contains a NASA-TLX value"));
ok((mail.match(/<tr>/g) || []).length >= (18 + 6 + 6), "email row count covers answers + TLX + biometrics");

/* ---- EmailJS body (js/report.js) ---- */
const mail2 = emailTableHTML(summary);
["Ardit Ceno", "USR_TEST_ARDIT_001", "Software", "Senior", "24", "66.7"].forEach((n) => has(mail2, n, "EmailJS body field present"));
QUESTIONS.forEach((q) => has(mail2, q, "EmailJS body contains every question"));

/* ---- Edge Function request body (as storage.js builds it) ---- */
const edgeBody = {
  id_anonim: clean.participant.id_anonim,
  submission_id: "11111111-2222-3333-4444-555555555555",
  kind: clean.kind || "session",
  summary: clean,
  identity
};
ok(/^[A-Za-z0-9_-]{6,80}$/.test(edgeBody.id_anonim), "edge id matches the server-side regex");
ok(edgeBody.identity.emri_mbiemer === "Ardit Ceno" && !("emri_mbiemer" in edgeBody.summary.participant), "edge body sends name only in identity");

/* ------------------------------ artifacts ------------------------------ */
mkdirSync("test-output", { recursive: true });
writeFileSync("test-output/session-summary.json", JSON.stringify(clean, null, 2) + "\n");
writeFileSync("test-output/identity.json", JSON.stringify(identity, null, 2) + "\n");
writeFileSync("test-output/edge-request.json", JSON.stringify(edgeBody, null, 2) + "\n");
writeFileSync("test-output/email.html",
  "<!DOCTYPE html><html><head><meta charset='utf-8'><title>NCID test email</title></head><body>" + mail + "</body></html>\n");

console.log("PASS " + pass + "  FAIL " + fail);
if (fails.length) { console.log("Failures:"); fails.forEach((x) => console.log(" - " + x)); }
console.log("artifacts -> test-output/ (session-summary.json, identity.json, edge-request.json, email.html)");
process.exit(fail ? 1 : 0);
