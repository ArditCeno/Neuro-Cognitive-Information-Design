/*
 * Sends realistic test submissions to the Apps Script endpoint so the researcher
 * receives real emails (verifies end-to-end delivery).
 *
 * Run: node scripts/test-send.mjs desktop
 *      node scripts/test-send.mjs phone
 *
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { CONFIG } from "../js/config.js";

const URL = CONFIG.storage.submission.fallbackUrl;
const TOKEN = CONFIG.storage.submission.fallbackToken;

const rnd = (a, b, d = 0) => Number((a + Math.random() * (b - a)).toFixed(d));

function makeTrial(mid, version, fusha, aoiList) {
  const choices = ["A", "B", "C", "D"];
  const quiz = [0, 1, 2].map((i) => ({
    pyetja: `${fusha} ${mid} ${version} - question ${i + 1}`,
    chosen: choices[Math.floor(Math.random() * 4)],
    "e_saktë": Math.random() > 0.35
  }));
  const correct = quiz.filter((q) => q["e_saktë"]).length;
  const dwell = aoiList.map((a) => ({ aoi: a, ms: Math.round(rnd(400, 3200)) }));
  return {
    versioni: version,
    module_id: mid,
    quiz_item: quiz.map((q) => ({ pyetja: q.pyetja })),
    response: quiz.map((q) => ({ zgjedhja: q.chosen, "e_saktë": q["e_saktë"] })),
    accuracy_score_pct: Math.round((correct / quiz.length) * 1000) / 10,
    fixation_duration_ms: Math.round(rnd(180, 260)),
    regresione: Math.round(rnd(4, 22)),
    TTFF_ms: Math.round(rnd(280, 620)),
    koha_e_leximit_s: Math.round(rnd(22, 55)),
    dwell
  };
}

function makeSummary(o) {
  const tlx = () => ({
    mental: Math.round(rnd(4, 16)), physical: Math.round(rnd(1, 8)), temporal: Math.round(rnd(3, 13)),
    performance: Math.round(rnd(2, 10)), effort: Math.round(rnd(5, 15)), frustration: Math.round(rnd(2, 11))
  });
  const aoi = ["titull", "kritike", "mesatare", "perfundim"];
  const fusha = o.fusha;
  const modules = ["m1", "m2", "m3"].map((mid) => ({
    module_id: mid,
    fusha,
    "versioni_i_parë": Math.random() > 0.5 ? "A" : "B",
    preference: Math.random() > 0.5 ? "A" : "B",
    nasa_tlx: tlx(),
    trials: [makeTrial(mid, "A", fusha, aoi), makeTrial(mid, "B", fusha, aoi)]
  }));
  const totalQ = 18;
  const correctQ = 9 + Math.round(rnd(0, 8));
  return {
    kind: "session",
    submission_id: "test_" + o.id,
    participant: { id_anonim: o.id, emri_mbiemer: o.name, profesioni: o.prof, fusha, "niveli_i_ekspertizës": o.exp, mosha: o.age },
    session: {
      session_number: 1, gjuha: "en", metoda: o.method,
      kalibrimi_px: o.method === "mouse" ? null : Number(rnd(70, 130, 1)),
      "kohëzgjatja_min": Number(rnd(8, 16, 1)),
      shfletuesi: o.browser, pajisja: o.device
    },
    modules,
    biometric_metrics: {
      fixation_duration_ms: Math.round(rnd(190, 250)),
      saccadic_regressions: Math.round(rnd(6, 24)),
      time_to_first_fixation_ms: Math.round(rnd(300, 600)),
      task_completion_time_s: Math.round(rnd(70, 130)),
      reading_time_s: Math.round(rnd(60, 120)),
      blink_rate_per_min: Number(rnd(10, 22, 1)),
      head_pose: { yaw_mean: Number(rnd(-3, 3, 2)), pitch_mean: Number(rnd(-4, 4, 2)), roll_mean: Number(rnd(-2, 2, 2)) }
    },
    quiz_results: { total_questions: totalQ, correct_answers: correctQ, accuracy_score_pct: Math.round((correctQ / totalQ) * 1000) / 10 },
    exported_at: new Date().toISOString()
  };
}

async function send(summary, identity) {
  const payload = { id_anonim: summary.participant.id_anonim, summary, identity, token: TOKEN };
  // new server: hidden form field "payload"
  try {
    const body = new URLSearchParams();
    body.set("payload", JSON.stringify(payload));
    const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    const text = (await res.text()).trim();
    if (/"ok"\s*:\s*true/.test(text)) return { via: "form", ok: true };
    if (/"ok"\s*:\s*false/.test(text)) return { via: "form", ok: false, detail: text.slice(0, 160) };
  } catch (e) { /* try json below */ }
  // old server: JSON body
  try {
    const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    const text = (await res.text()).trim();
    if (/"ok"\s*:\s*true/.test(text)) return { via: "json", ok: true };
    return { via: "json", ok: false, detail: text.slice(0, 160) };
  } catch (e) {
    return { via: "json", ok: false, detail: String(e.message || e) };
  }
}

const who = (process.argv[2] || "desktop").toLowerCase();
const presets = {
  desktop: { name: "Test Desktop Ardit", id: "TESTDESK" + Math.floor(rnd(100, 999)), method: "eyetracking", device: "Desktop", browser: "Chrome", age: 24, prof: "Law", fusha: "legal", exp: "Senior" },
  phone: { name: "Test Phone Ardit", id: "TESTPHONE" + Math.floor(rnd(100, 999)), method: "eyetracking", device: "Mobile", browser: "Chrome Mobile", age: 24, prof: "Medicine", fusha: "health", exp: "Senior" }
};
const o = presets[who] || presets.desktop;
const summary = makeSummary(o);
const r = await send(summary, { id_anonim: summary.participant.id_anonim, emri_mbiemer: summary.participant.emri_mbiemer });
console.log(`${who}: ${summary.participant.id_anonim} (${o.prof}) -> ${JSON.stringify(r)}`);
