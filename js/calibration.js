/*
 * 9-point eye calibration on top of WebGazer's click-trained model.
 *
 * Measures the mean prediction error (px) AND the mean bias (dx, dy). The bias
 * is applied as a gaze offset, which measurably improves alignment - important
 * on phones, where the model tends to sit slightly off-centre.
 *
 * On touch devices it trains the model from taps and uses a screen-relative
 * accuracy target (a phone screen is much smaller).
 */

import { CONFIG } from "./config.js?v=55";
import { EyeTracking } from "./eyetracking.js?v=55";
import { t } from "./i18n.js?v=55";
import { el, mean, round, sleep } from "./utils.js?v=55";

const GRID = [
  [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
  [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
  [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
];

export const Calibration = {
  errors: [],
  offsets: [],
  offset: { x: 0, y: 0 },
  accuracyPx: null,

  async run(areaEl, statusEl, progressEl) {
    this.errors = [];
    this.offsets = [];
    this.offset = { x: 0, y: 0 };
    this.accuracyPx = null;
    EyeTracking.gazeOffset = { x: 0, y: 0 };   // measure the bias from an unbiased model
    areaEl.innerHTML = "";

    const rect = areaEl.getBoundingClientRect();
    // Keep the edge dots fully inside the panel, especially on phones where a
    // 40-44 px target plus its glow would otherwise be clipped.
    const pad = Math.min(56, Math.max(34, rect.width * 0.14));
    const targets = GRID.map(([fx, fy], i) => ({
      i,
      x: Math.min(Math.max(rect.width * fx, pad), Math.max(pad, rect.width - pad)),
      y: Math.min(Math.max(rect.height * fy, pad), Math.max(pad, rect.height - pad))
    }));

    this._statusEl = statusEl;
    this._progressEl = progressEl || null;
    this._total = targets.length;
    if (this._progressEl) this._progressEl.textContent = "0 / " + targets.length;
    targets.forEach((tg) => {
      const label = t("calib_point") + " " + (tg.i + 1);
      const dot = el("div", {
        class: "calib-dot",
        role: "button",
        tabindex: "0",
        "aria-label": label,
        title: label
      });
      dot.style.left = tg.x + "px";
      dot.style.top = tg.y + "px";
      dot.addEventListener("click", () => this._onClick(dot, tg, areaEl), { once: true });
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dot.click(); }
      });
      areaEl.appendChild(dot);
    });

    return new Promise((resolve) => { this._resolve = resolve; });
  },

  async _onClick(dot, tg, areaEl) {
    dot.classList.add("done");
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* haptics are optional */ }
    const total = this._total || areaEl.querySelectorAll(".calib-dot").length;
    const done = total - areaEl.querySelectorAll(".calib-dot:not(.done)").length;
    // Keep the attempt label fixed (e.g. "Point - 1/1"); show point progress separately.
    if (this._progressEl) this._progressEl.textContent = done + " / " + total;
    const touch = EyeTracking.isTouch();
    // Feed the tap position to the model explicitly: WebGazer only self-trains
    // on mouse events, so taps would otherwise never calibrate the model.
    if (touch) {
      const r = dot.getBoundingClientRect();
      EyeTracking.recordClick(r.left + r.width / 2, r.top + r.height / 2);
    }
    // let WebGazer process the training sample (longer on phones)
    await sleep(touch ? 700 : 280);
    const err = await this._sampleError(dot);
    if (err != null) this.errors.push(err);

    const remaining = areaEl.querySelectorAll(".calib-dot:not(.done)").length;
    if (remaining === 0) {
      this.accuracyPx = this.errors.length ? round(mean(this.errors), 1) : null;
      this._finalize();
      if (this._resolve) this._resolve(this.accuracyPx);
    }
  },

  async _sampleError(dot) {
    if (EyeTracking.mode === "mouse") return 15;
    if (EyeTracking.mode === "mock") return 60 + Math.round(Math.random() * 70);
    const rect = dot.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const now = performance.now();
    const win = EyeTracking.isTouch() ? 900 : 400;
    const recent = EyeTracking.samples.filter((s) => now - s.t < win && s.x != null);
    if (!recent.length) return null;
    const px = mean(recent.map((s) => s.x));
    const py = mean(recent.map((s) => s.y));
    this.offsets.push({ x: px - cx, y: py - cy });
    return Math.hypot(px - cx, py - cy);
  },

  /** Mean bias -> gaze offset (only when there is enough data). */
  _finalize() {
    if (this.offsets.length >= 5) {
      this.offset = {
        x: round(mean(this.offsets.map((o) => o.x)), 1),
        y: round(mean(this.offsets.map((o) => o.y)), 1)
      };
    } else {
      this.offset = { x: 0, y: 0 };
    }
    EyeTracking.gazeOffset = this.offset;
  },

  /** Accuracy target in px, scaled to the screen (a phone screen is small). */
  goodThresholdPx() {
    const w = (typeof window !== "undefined" && window.innerWidth) || 1024;
    const h = (typeof window !== "undefined" && window.innerHeight) || 768;
    const minDim = Math.min(w, h);
    const ratio = EyeTracking.isTouch() ? 0.30 : 0.19;
    return Math.max(60, Math.min(CONFIG.study.calibrationThresholdPx || 150, ratio * minDim));
  },

  isGood() {
    return this.accuracyPx != null && this.accuracyPx < this.goodThresholdPx();
  }
};
