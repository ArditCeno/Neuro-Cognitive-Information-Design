/*
 * MouseView.js plan B: mouse-tracking as a gaze proxy when WebGazer
 * calibration fails (risk register). Attempts to load the official
 * MouseView.js from CDN, and always provides a native dwell sampler.
 */

import { CONFIG } from "./config.js";
import { loadScript } from "./utils.js";

export const MouseView = {
  active: false,
  libLoaded: false,
  _handler: null,
  _last: 0,

  async enable(onSample) {
    try {
      await loadScript(CONFIG.cdn.mouseview);
      this.libLoaded = true;
    } catch (e) {
      this.libLoaded = false; // native sampler still works
    }
    this.active = true;
    this._handler = (e) => {
      const t = performance.now();
      if (t - this._last < 40) return;   // ~25 Hz
      this._last = t;
      onSample(e.clientX, e.clientY, t);
    };
    window.addEventListener("mousemove", this._handler, { passive: true });
    window.addEventListener("touchmove", this._handler, { passive: true });
  },

  disable() {
    if (this._handler) {
      window.removeEventListener("mousemove", this._handler);
      window.removeEventListener("touchmove", this._handler);
      this._handler = null;
    }
    this.active = false;
  }
};
