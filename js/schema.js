/*
 * Session schema builder — emits the exact UML class-model structure from
 * Diagram 5 (Participant / Session / Module / Stimulus / Trial / Response /
 * QuizItem / GazeSample) plus readability metadata (Diagram 5, Diagram 6).
 */

import { round } from "./utils.js";
import { tr } from "./i18n.js";

const VOWELS = /[aeiouyëáéíóúàèìòù]/;

/* --------------------------- Readability --------------------------- */
function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-zëçáéíóúàèìòù]/g, "");
  if (!w) return 0;
  let count = 0, prevVowel = false;
  for (const ch of w) {
    const v = VOWELS.test(ch);
    if (v && !prevVowel) count++;
    prevVowel = v;
  }
  return Math.max(1, count);
}

/** Approximate Flesch Reading Ease (higher = easier). */
export function fleschReadingEase(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const words = clean ? clean.split(" ") : [];
  const sentences = (clean.match(/[.!?]+/g) || []).length || 1;
  if (!words.length) return 0;
  const syll = words.reduce((s, w) => s + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syll / words.length);
  return round(Math.max(0, Math.min(120, score)), 1);
}

export function stimulusMeta(field, version, html) {
  const text = stripTags(html);
  const words = text ? text.split(/\s+/).length : 0;
  return {
    fusha: field.id,
    versioni: version,
    gjatësia: words,
    lexueshmëria: fleschReadingEase(text)
  };
}

/* --------------------------- Gaze/Biometrics merge --------------------------- */
/** Align gaze samples with MediaPipe blink/head-pose samples by timestamp. */
export function alignGazeSamples(gaze, bio, windowMs = 200) {
  if (!bio || !bio.length) {
    return (gaze || []).map((g) => ({
      t_ms: round(g.t, 1), x: round(g.x, 1), y: round(g.y, 1), blink: 0, head_pose: null
    }));
  }
  const sorted = bio.slice().sort((a, b) => a.t - b.t);
  let j = 0;
  return (gaze || []).map((g) => {
    while (j < sorted.length - 1 && Math.abs(sorted[j + 1].t - g.t) <= Math.abs(sorted[j].t - g.t)) j++;
    const b = sorted[j];
    const near = b && Math.abs(b.t - g.t) <= windowMs;
    return {
      t_ms: round(g.t, 1),
      x: round(g.x, 1),
      y: round(g.y, 1),
      dx: g.dx != null ? round(g.dx, 1) : null,
      dy: g.dy != null ? round(g.dy, 1) : null,
      blink: near ? (b.ear < 0.21 ? 1 : 0) : 0,
      head_pose: near ? { yaw: b.yaw, pitch: b.pitch, roll: b.roll } : null
    };
  });
}

/* --------------------------- Trial / Module / Session --------------------------- */
export function buildTrial({ field, version, stimulus, readingTimeSec, taskTimeSec, metrics, quiz }) {
  const responses = (quiz || []).map((r) => ({
    zgjedhja: r.chosen,
    "e_saktë": r.correct,
    koha_s: r.time_s != null ? r.time_s : null
  }));
  const quizItems = (quiz || []).map((r) => {
    const cfg = field.quiz[r.index];
    return {
      pyetja: r.q,
      "përgjigja_e_saktë": cfg ? tr(cfg.options[cfg.correct]) : null,
      kritike: !!r.critical
    };
  });
  const correct = responses.filter((r) => r["e_saktë"]).length;
  return {
    versioni: version,
    stimulus,
    koha_e_leximit_s: round(readingTimeSec, 1),
    koha_detyrës_s: round(taskTimeSec, 1),
    TTFF_ms: metrics ? metrics.time_to_first_fixation_ms : null,
    regresione: metrics ? metrics.saccadic_regressions : null,
    fixation_duration_ms: metrics ? metrics.fixation_duration_ms : null,
    fixation_count: metrics ? metrics.fixation_count : null,
    aoi_dwell: metrics && metrics.dwell ? metrics.dwell : [],
    accuracy_score_pct: responses.length ? round((correct / responses.length) * 100, 1) : 0,
    response: responses,
    quiz_item: quizItems
  };
}

export function buildModule({ field, orderIndex, firstVersion, trials, nasaTlx }) {
  return {
    fusha: field.id,
    "rendi_në_seson": orderIndex + 1,
    versioni_i_parë: firstVersion,
    trials,
    nasa_tlx: nasaTlx || null
  };
}

export function assembleSession({ participant, session, modules, biometricMetrics, quizResults, gaze }) {
  return {
    participant,
    session,
    modules,
    biometric_metrics: biometricMetrics,
    quiz_results: quizResults,
    gaze: gaze || [],
    exported_at: new Date().toISOString()
  };
}
