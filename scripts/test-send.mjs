/*
 * Sends realistic test submissions to the Apps Script endpoint so the researcher
 * receives real emails (used to verify end-to-end delivery).
 *
 * Run: node scripts/test-send.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { CONFIG } from "../js/config.js";

const URL = CONFIG.storage.submission.fallbackUrl;
const TOKEN = CONFIG.storage.submission.fallbackToken;

function makeSummary({ name, id, method, device, browser, age, prof, fusha, exp }) {
  const tlx = (m) => ({ mental: m, physical: 3, temporal: 8, performance: 6, effort: 9, frustration: 4 });
  const trial = (mid, version, correctPattern) => ({
    versioni: version,
    module_id: mid,
    quiz_item: [0, 1, 2].map((i) => ({ pyetja: mid + " " + version + " - question " + (i + 1) })),
    response: correctPattern.map((ok, i) => ({ zgjedhja: "Option " + String.fromCharCode(65 + i), "e_saktë": ok })),
    accuracy_score_pct: Math.round((correctPattern.filter(Boolean).length / correctPattern.length) * 1000) / 10,
    fixation_duration_ms: 205 + (version === "B" ? 22 : 0),
    regresione: version === "B" ? 8 : 15,
    TTFF_ms: version === "B" ? 360 : 470,
    koha_e_leximit_s: version === "B" ? 26 : 38
  });
  return {
    kind: "session",
    submission_id: "test_" + id,
    participant: { id_anonim: id, emri_mbiemer: name, profesioni: prof, fusha, "niveli_i_ekspertizës": exp, mosha: age },
    session: { session_number: 1, gjuha: "en", metoda: method, kalibrimi_px: method === "mouse" ? null : 92.4, "kohëzgjatja_min": 11.2, shfletuesi: browser, pajisja: device },
    modules: [
      { module_id: "m1", fusha, "versioni_i_parë": "A", preference: "A", nasa_tlx: tlx(11), trials: [trial("m1", "A", [true, true, false]), trial("m1", "B", [true, false, true])] },
      { module_id: "m2", fusha, "versioni_i_parë": "B", preference: "B", nasa_tlx: tlx(13), trials: [trial("m2", "B", [true, true, true]), trial("m2", "A", [true, false, false])] },
      { module_id: "m3", fusha, "versioni_i_parë": "A", preference: "A", nasa_tlx: tlx(12), trials: [trial("m3", "A", [true, true, false]), trial("m3", "B", [false, true, true])] }
    ],
    biometric_metrics: {
      fixation_duration_ms: 212, saccadic_regressions: 14, time_to_first_fixation_ms: 430,
      task_completion_time_s: 96, reading_time_s: 88, blink_rate_per_min: 17,
      head_pose: { yaw_mean: 1.1, pitch_mean: -2.0, roll_mean: 0.4 }
    },
    quiz_results: { total_questions: 18, correct_answers: 13, accuracy_score_pct: 72.2 },
    exported_at: new Date().toISOString()
  };
}

async function send(summary, identity) {
  const payload = { id_anonim: summary.participant.id_anonim, summary, identity, token: TOKEN };
  // new server: form field "payload"
  try {
    const body = new URLSearchParams();
    body.set("payload", JSON.stringify(payload));
    const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    const text = (await res.text()).trim();
    if (/"ok"\s*:\s*true/.test(text)) return { via: "form", ok: true };
    if (/"ok"\s*:\s*false/.test(text)) return { via: "form", ok: false, detail: text.slice(0, 160) };
  } catch (e) { /* try json */ }
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

const who = process.argv[2] || "desktop";
const s1 = who === "phone"
  ? makeSummary({ name: "Test Phone Ardit", id: "TESTPHONE001", method: "eyetracking", device: "Mobile", browser: "Chrome Mobile", age: 24, prof: "Software", fusha: "software", exp: "Senior" })
  : makeSummary({ name: "Test Desktop Ardit", id: "TESTDESK001", method: "eyetracking", device: "Desktop", browser: "Chrome", age: 24, prof: "Software", fusha: "software", exp: "Senior" });

const r = await send(s1, { id_anonim: s1.participant.id_anonim, emri_mbiemer: s1.participant.emri_mbiemer });
console.log(who + ":", JSON.stringify(r));
