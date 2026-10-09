/*
 * Heatmap.js wrapper (researcher illustration view).
 */

import { CONFIG } from "./config.js";
import { loadScript } from "./utils.js";

let loaded = false;

export const Heatmap = {
  async render(container, points, docSize) {
    if (!container) return;
    try {
      if (!loaded) { await loadScript(CONFIG.cdn.heatmap); loaded = true; }
    } catch (e) {
      console.warn("Heatmap.js unavailable:", e);
      container.textContent = "Heatmap.js could not be loaded.";
      return;
    }
    container.innerHTML = "";
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 300;
    const dw = docSize && docSize.width ? docSize.width : w;
    const dh = docSize && docSize.height ? docSize.height : h;

    const hm = window.h337.create({ container, radius: 28, maxOpacity: 0.7, blur: 0.85 });
    const data = (points || []).map((p) => ({
      x: Math.round((p.x / dw) * w),
      y: Math.round((p.y / dh) * h),
      value: p.duration || 1
    }));
    const max = data.reduce((m, d) => Math.max(m, d.value), 1);
    hm.setData({ max, data });
    this._instance = hm;
  },

  maxDocSize(trials) {
    let mx = 0, my = 0;
    trials.forEach((t) => (t.metrics ? t.metrics.fixations.forEach((f) => { mx = Math.max(mx, f.x); my = Math.max(my, f.y); }) : null));
    return { width: mx || 800, height: my || 600 };
  },

  collectFixations(trials) {
    const pts = [];
    trials.forEach((t) => { if (t.metrics) pts.push(...t.metrics.fixations); });
    return pts;
  }
};
