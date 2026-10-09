/*
 * AOI engine: fixation detection (I-DT), saccade/regression counting,
 * time-to-first-fixation and dwell aggregation.
 *
 * All coordinates are in "document content" space (pixels), i.e. relative to
 * the top-left of the scrollable document, independent of scrolling.
 */

import { CONFIG } from "./config.js";
import { mean, median, round } from "./utils.js";

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

/** Dispersion-based (I-DT) fixation detection. */
export function detectFixations(samples, opts = {}) {
  const disp = opts.dispersionPx || CONFIG.study.fixationDispersionPx;
  const minDur = opts.minDurationMs || CONFIG.study.fixationMinDurationMs;
  const pts = samples.filter((s) => s.dx != null && s.dy != null);
  const fixations = [];
  if (pts.length < 2) return fixations;

  let i = 0;
  while (i < pts.length - 1) {
    let j = i + 1;
    while (j < pts.length) {
      const xs = pts.slice(i, j + 1).map((p) => p.dx);
      const ys = pts.slice(i, j + 1).map((p) => p.dy);
      const d = (Math.max(...xs) - Math.min(...xs)) + (Math.max(...ys) - Math.min(...ys));
      if (d <= disp) j++;
      else break;
    }
    const dur = pts[j - 1].t - pts[i].t;
    if (dur >= minDur) {
      const seg = pts.slice(i, j);
      fixations.push({
        start: seg[0].t,
        end: seg[seg.length - 1].t,
        duration: dur,
        x: mean(seg.map((p) => p.dx)),
        y: mean(seg.map((p) => p.dy))
      });
      i = j;
    } else {
      i = Math.max(i + 1, j);
    }
  }
  return fixations;
}

/** Saccade detection (I-VT) between consecutive fixations. Kept for completeness. */
export function detectSaccades(fixations) {
  const sacc = [];
  for (let k = 1; k < fixations.length; k++) {
    const a = fixations[k - 1], b = fixations[k];
    const dt = (b.start - a.end) / 1000;
    const d = dist(a, b);
    if (dt > 0) sacc.push({ from: a, to: b, velocity: d / dt, dx: b.x - a.x, dy: b.y - a.y });
  }
  return sacc;
}

function orderAois(aois) {
  // reading order: top-to-bottom, then left-to-right
  return aois.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
}

function hit(aoi, x, y) {
  return x >= aoi.x && x <= aoi.x + aoi.width && y >= aoi.y && y <= aoi.y + aoi.height;
}

/**
 * Compute study metrics for one trial.
 * @param trial {samples, startT}
 * @param aois  array of {name, critical, x, y, width, height}
 */
export function computeMetrics(trial, aois) {
  const started = trial.startT || (trial.samples[0] ? trial.samples[0].t : 0);
  const fixations = detectFixations(trial.samples || []);
  const ordered = orderAois(aois);
  const orderIndex = new Map(ordered.map((a, idx) => [a.name, idx]));

  // assign each fixation to an AOI
  const assigned = fixations.map((f) => {
    const a = ordered.find((ao) => hit(ao, f.x, f.y));
    return { ...f, aoi: a ? a.name : null, order: a ? orderIndex.get(a.name) : null };
  });

  const inAoi = assigned.filter((f) => f.aoi);
  const fixDurations = (inAoi.length ? inAoi : assigned).map((f) => f.duration);

  // regressions: fixations that jump back to an earlier reading-order AOI
  let regressions = 0;
  let maxOrder = -1;
  let prevSeen = null;
  for (const f of assigned) {
    if (f.order == null) continue;
    if (prevSeen != null && f.order < maxOrder) regressions++;
    if (f.order > maxOrder) maxOrder = f.order;
    prevSeen = f.order;
  }

  // TTFF to the first critical AOI
  const criticalNames = new Set(aois.filter((a) => a.critical).map((a) => a.name));
  let ttff = null, firstCritical = null;
  for (const f of assigned) {
    if (f.aoi && criticalNames.has(f.aoi)) { ttff = f.start - started; firstCritical = f.aoi; break; }
  }

  // dwell per AOI
  const dwellMap = {};
  for (const f of inAoi) dwellMap[f.aoi] = (dwellMap[f.aoi] || 0) + f.duration;
  const dwell = Object.keys(dwellMap).map((name) => ({ name, duration_ms: Math.round(dwellMap[name]) }));

  return {
    fixation_duration_ms: Math.round(median(fixDurations)),
    fixation_duration_mean_ms: Math.round(mean(fixDurations)),
    fixation_count: fixations.length,
    saccadic_regressions: regressions,
    time_to_first_fixation_ms: ttff == null ? null : Math.round(ttff),
    ttff_critical_aoi: firstCritical,
    dwell,
    fixations: assigned.map((f) => ({ x: Math.round(f.x), y: Math.round(f.y), duration: Math.round(f.duration), aoi: f.aoi }))
  };
}

export function summarizeSessionMetrics(trials) {
  const all = trials.filter((t) => t.metrics);
  const fd = all.map((t) => t.metrics.fixation_duration_ms).filter((v) => v != null);
  const reg = all.map((t) => t.metrics.saccadic_regressions);
  const ttff = all.map((t) => t.metrics.time_to_first_fixation_ms).filter((v) => v != null);
  const times = all.map((t) => t.koha_detyres_s);
  return {
    fixation_duration_ms: Math.round(mean(fd)),
    fixation_duration_median_ms: Math.round(median(fd)),
    saccadic_regressions: reg.reduce((s, v) => s + v, 0),
    time_to_first_fixation_ms: ttff.length ? Math.round(mean(ttff)) : null,
    task_completion_time_s: round(mean(times), 1)
  };
}
