/*
 * 9-point eye calibration on top of WebGazer's click-trained model.
 * Measures mean prediction error (px) against the on-screen targets.
 */

import { CONFIG } from "./config.js";
import { EyeTracking } from "./eyetracking.js";
import { t } from "./i18n.js";
import { el, mean, round, sleep } from "./utils.js";

const GRID = [
  [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
  [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
  [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
];

export const Calibration = {
  errors: [],
  accuracyPx: null,

  async run(areaEl, statusEl) {
    this.errors = [];
    this.accuracyPx = null;
    areaEl.innerHTML = "";

    const rect = areaEl.getBoundingClientRect();
    const targets = GRID.map(([fx, fy], i) => ({
      i,
      x: rect.width * fx,
      y: rect.height * fy
    }));

    targets.forEach((tg) => {
      const dot = el("div", { class: "calib-dot", title: t("calib_point") + " " + (tg.i + 1) });
      dot.style.left = tg.x + "px";
      dot.style.top = tg.y + "px";
      dot.addEventListener("click", () => this._onClick(dot, tg, areaEl), { once: true });
      areaEl.appendChild(dot);
    });

    return new Promise((resolve) => { this._resolve = resolve; });
  },

  async _onClick(dot, tg, areaEl) {
    dot.classList.add("done");
    // let WebGazer process the click as a training sample, then read prediction
    await sleep(280);
    const err = await this._sampleError(dot);
    if (err != null) this.errors.push(err);

    const remaining = areaEl.querySelectorAll(".calib-dot:not(.done)").length;
    if (remaining === 0) {
      this.accuracyPx = this.errors.length ? round(mean(this.errors), 1) : null;
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
    const recent = EyeTracking.samples.filter((s) => now - s.t < 400 && s.x != null);
    if (!recent.length) return null;
    const px = mean(recent.map((s) => s.x));
    const py = mean(recent.map((s) => s.y));
    return Math.hypot(px - cx, py - cy);
  },

  isGood() {
    return this.accuracyPx != null && this.accuracyPx < CONFIG.study.calibrationThresholdPx;
  }
};
