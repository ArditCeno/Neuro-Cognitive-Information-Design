/*
 * EyeTracking: WebGazer lifecycle, gaze sampling, trial markers and a
 * mock generator (used with ?mock=1 to validate the pipeline without a webcam).
 */

import { CONFIG } from "./config.js";
import { loadScript } from "./utils.js";
import { MouseView } from "./mouseview.js";

export const EyeTracking = {
  mock: false,
  ready: false,
  running: false,
  mode: "webgazer",            // "webgazer" | "mouse" | "mock"
  webgazer: null,
  samples: [],                 // all samples (current session)
  trial: null,                 // active trial buffer
  readingRegion: null,         // { left, top, width, height, scrollLeft, scrollTop } viewport coords
  showDot: false,
  _mockTimer: null,
  _mockPos: null,

  async init({ mock = false } = {}) {
    this.mock = mock;
    this.samples = [];
    if (mock) {
      this.mode = "mock";
      this.ready = true;
      const dot = document.getElementById("gazeDot");
      this.showDot = !!dot;
      if (dot) dot.classList.remove("hidden");
      return true;
    }
    this.mode = "webgazer";
    await loadScript(CONFIG.cdn.webgazer);
    this.webgazer = window.webgazer;
    if (!this.webgazer) throw new Error("WebGazer failed to load");
    this.ready = true;
    return true;
  },

  /** Plan B: switch to mouse-tracking when WebGazer accuracy is insufficient. */
  async enableMouseFallback() {
    this.mode = "mouse";
    await MouseView.enable((x, y, t) => this._onGaze({ x, y }, t));
    const dot = document.getElementById("gazeDot");
    if (dot) dot.classList.remove("hidden");
    this.showDot = !!dot;
    return true;
  },

  async startCamera() {
    if (this.mock) return true;
    const wg = this.webgazer;
    const safe = (fn) => { try { fn(); } catch (e) { /* optional call */ } };
    safe(() => wg.setRegression("ridge"));
    safe(() => wg.setTracker("TFFacemesh"));
    safe(() => wg.applyKalmanFilter && wg.applyKalmanFilter(true));
    safe(() => wg.setGazeListener((data, ts) => this._onGaze(data, ts)));
    await wg.begin();                 // rejects only when the camera cannot start
    this.running = true;
    safe(() => wg.showVideoPreview && wg.showVideoPreview(true));
    safe(() => wg.showPredictionPoints && wg.showPredictionPoints(false));
    safe(() => wg.addMouseListener && wg.addMouseListener());
    this._mountVideo();
    return true;
  },

  _injectStyles() {
    if (document.getElementById("wgStyle")) return;
    const style = document.createElement("style");
    style.id = "wgStyle";
    style.textContent = `
      #cameraPreview { position: relative; overflow: hidden; }
      #webgazerVideoFeed, #webgazerVideoContainer video {
        width: 100% !important; height: 100% !important;
        object-fit: cover !important; border-radius: inherit;
      }
      #webgazerFaceOverlay, #webgazerFaceFeedbackBox { display: none !important; }
      #webgazerVideoContainer.wg-mounted {
        position: absolute !important; inset: 0 !important;
        width: 100% !important; height: 100% !important;
        margin: 0 !important; z-index: 1;
      }
      /* safety: never let a stray WebGazer container overflow the page */
      body > #webgazerVideoContainer { display: none !important; }
    `;
    document.head.appendChild(style);
  },

  _mountVideo(retries = 25) {
    this._injectStyles();
    const host = document.getElementById("cameraPreview");
    const vc = document.getElementById("webgazerVideoContainer");
    if (host && vc) {
      vc.classList.add("wg-mounted");
      if (vc.parentElement !== host) host.appendChild(vc);
      const ph = document.getElementById("cameraPlaceholder");
      if (ph) ph.classList.add("hidden");
      return;
    }
    if (retries > 0) setTimeout(() => this._mountVideo(retries - 1), 120);
  },

  _onGaze(data, ts) {
    if (!data || data.x == null || data.y == null) return;
    const s = { t: ts, x: data.x, y: data.y };
    if (this.readingRegion) {
      const r = this.readingRegion;
      s.dx = data.x - r.left + (r.scrollLeft || 0);
      s.dy = data.y - r.top + (r.scrollTop || 0);
    }
    this.samples.push(s);
    if (this.trial) this.trial.samples.push(s);
    if (this.showDot) this._moveDot(s.x, s.y);
  },

  _moveDot(x, y) {
    const d = document.getElementById("gazeDot");
    if (d) { d.style.left = x + "px"; d.style.top = y + "px"; }
  },

  /** Region of the document (viewport coordinates) used for docX/docY mapping. */
  setReadingRegion(region) { this.readingRegion = region; },
  clearReadingRegion() { this.readingRegion = null; },

  startTrial(label) {
    this.trial = { label, startT: performance.now(), samples: [] };
    if (this.mock) this._startMock();
    return this.trial;
  },

  endTrial() {
    if (this.mock) this._stopMock();
    const tr = this.trial;
    this.trial = null;
    return tr;
  },

  getSessionSamples() { return this.samples; },
  clearSession() { this.samples = []; },

  async stop() {
    this._stopMock();
    MouseView.disable();
    if (this.webgazer && this.webgazer.end) {
      try { await this.webgazer.end(); } catch (e) { /* ignore */ }
    }
    this.running = false;
  },

  /* ---------- Mock gaze: serpentine reading path inside the doc region ---------- */
  _startMock() {
    const r = this.readingRegion || { left: 100, top: 150, width: 700, height: 400, scrollLeft: 0, scrollTop: 0 };
    this._mockPos = { x: r.left + 30, y: r.top + 24, lineH: 30, line: 0, dir: 1 };
    let n = 0;
    this._mockTimer = setInterval(() => {
      const p = this._mockPos;
      const right = r.left + r.width - 40;
      // step along the line
      p.x += p.dir * (30 + Math.random() * 25);
      // occasional regression (jump back / re-read)
      if (n > 0 && n % 23 === 0) p.x -= 180;
      if (p.x >= right) { p.x = r.left + 30; p.y += p.lineH; p.line++; p.dir = 1; }
      if (p.x <= r.left + 20) p.x = r.left + 20;
      if (p.y > r.top + r.height - 20) { p.x = r.left + 30; p.y = r.top + 24; p.line = 0; }
      const x = p.x + (Math.random() * 6 - 3);
      const y = p.y + (Math.random() * 4 - 2);
      // gentle drift back and forth to emulate scan path
      if (Math.random() < 0.15) p.dir = -1; else if (Math.random() < 0.4) p.dir = 1;
      this._onGaze({ x, y }, performance.now());
      n++;
    }, 33);
  },

  _stopMock() {
    if (this._mockTimer) { clearInterval(this._mockTimer); this._mockTimer = null; }
  }
};
