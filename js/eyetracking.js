/*
 * EyeTracking: WebGazer lifecycle, gaze sampling, trial markers and a
 * mock generator (used with ?mock=1 to validate the pipeline without a webcam).
 *
 * Works on desktop and phones:
 *  - forces the front (selfie) camera and a light stream on touch devices;
 *  - feeds taps to the model via recordClick() (WebGazer only self-trains on mouse);
 *  - keeps the video decoding and visible in a small overlay so the face/eye
 *    points keep tracking even when the setup stage is hidden.
 */

import { CONFIG } from "./config.js?v=39";
import { loadScript } from "./utils.js?v=39";
import { MouseView } from "./mouseview.js?v=39";

export const EyeTracking = {
  mock: false,
  ready: false,
  running: false,
  mode: "webgazer",            // "webgazer" | "mouse" | "mock"
  webgazer: null,
  samples: [],                 // all samples (current session)
  trial: null,                 // active trial buffer
  readingRegion: null,         // { left, top, width, height, scrollLeft, scrollTop } viewport coords
  hostSelector: "#cameraPreview",
  gazeOffset: { x: 0, y: 0 },  // calibration bias correction (px)
  _mockTimer: null,
  _mockPos: null,

  /** Warm up the WebGazer bundle early so the camera starts faster later. */
  async preload() {
    if (this.mock || this.ready || this.webgazer || typeof window === "undefined") return;
    try { await loadScript(CONFIG.cdn.webgazer); this.webgazer = window.webgazer || null; } catch (e) { /* ignore */ }
  },

  async init({ mock = false } = {}) {
    this.mock = mock;
    this.samples = [];
    this.gazeOffset = { x: 0, y: 0 };
    if (mock) {
      this.mode = "mock";
      this.ready = true;
      return true;
    }
    this.mode = "webgazer";
    if (!window.webgazer) await loadScript(CONFIG.cdn.webgazer);
    this.webgazer = window.webgazer;
    if (!this.webgazer) throw new Error("WebGazer failed to load");
    this.ready = true;
    return true;
  },

  /** Plan B: switch to mouse-tracking when WebGazer accuracy is insufficient. */
  async enableMouseFallback() {
    this.mode = "mouse";
    this.gazeOffset = { x: 0, y: 0 };   // pointer coords are already exact
    await MouseView.enable((x, y, t) => this._onGaze({ x, y }, t));
    return true;
  },

  async startCamera() {
    if (this.mock) return true;
    const wg = this.webgazer;
    const safe = (fn) => { try { fn(); } catch (e) { /* optional call */ } };
    const touch = this.isTouch();
    this.hostSelector = "#cameraPreview";

    // WebGazer loads the MediaPipe FaceMesh assets from this local path.
    safe(() => { if (wg.params) wg.params.faceMeshSolutionPath = "mediapipe/face_mesh"; });

    safe(() => wg.setRegression("ridge"));
    safe(() => wg.setTracker("TFFacemesh"));
    safe(() => wg.applyKalmanFilter && wg.applyKalmanFilter(true));
    safe(() => wg.setGazeListener((data, ts) => this._onGaze(data, ts)));

    // Force the FRONT (selfie) camera and a light stream - crucial on phones,
    // where WebGazer would otherwise pick the rear camera (no face) or a heavy stream.
    const md = (typeof navigator !== "undefined") ? navigator.mediaDevices : null;
    const original = md && md.getUserMedia ? md.getUserMedia.bind(md) : null;
    if (original) {
      md.getUserMedia = (constraints) => {
        const c = Object.assign({}, constraints || {});
        const v = (constraints && typeof constraints.video === "object") ? Object.assign({}, constraints.video) : {};
        v.facingMode = { ideal: "user" };
        if (touch) { v.width = { ideal: 320 }; v.height = { ideal: 240 }; v.frameRate = { ideal: 24, max: 30 }; }
        c.video = v;
        return original(c);
      };
    }
    try {
      // rejects when the camera cannot start; time out so we never hang forever
      await this._withTimeout(wg.begin(), touch ? 35000 : 20000);
    } finally {
      if (original) md.getUserMedia = original;
    }

    this.running = true;
    this._applyDisplay();
    if (!touch) safe(() => wg.addMouseListener && wg.addMouseListener());   // mouse self-training (desktop only)
    this._mountVideo();
    this._watchStream();
    return true;
  },

  /** Face/eye points on, cursor/prediction dot OFF (re-applied on demand). */
  _applyDisplay() {
    const wg = this.webgazer;
    if (!wg) return;
    const safe = (fn) => { try { fn(); } catch (e) { /* optional call */ } };
    safe(() => wg.showVideoPreview && wg.showVideoPreview(true));
    safe(() => wg.showFaceOverlay && wg.showFaceOverlay(true));
    safe(() => wg.showFaceFeedbackBox && wg.showFaceFeedbackBox(false));
    safe(() => wg.showPredictionPoints && wg.showPredictionPoints(false));
  },

  _withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("camera timeout")), ms))
    ]);
  },

  /** Watch the video track; if it stops, notify the app so it can recover. */
  _watchStream() {
    try {
      const v = document.querySelector("video");
      if (!v) return;
      this._video = v;
      const stream = v.srcObject;
      const track = stream && stream.getVideoTracks && stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => { if (typeof this.onCameraLost === "function") this.onCameraLost(); };
        track.onmute = () => this.ensureVideoPlaying();
        track.onunmute = () => this.ensureVideoPlaying();
      }
      setTimeout(() => this._applyDisplay(), 800);
    } catch (e) { /* ignore */ }
  },

  /** Coarse pointer (phone / tablet). */
  isTouch() {
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  },

  /** Feed a screen position to WebGazer's model. Works for mouse clicks AND taps. */
  recordClick(x, y) {
    if (this.mock || !this.webgazer) return;
    try { this.webgazer.recordScreenPosition(x, y, "click"); } catch (e) { /* optional */ }
  },

  /** Keep the webcam stream decoding even when its container is not on screen. */
  ensureVideoPlaying() {
    if (this.mock) return;
    try {
      document.querySelectorAll("video").forEach((v) => {
        v.setAttribute("playsinline", "");
        v.muted = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      });
    } catch (e) { /* ignore */ }
  },

  /** Re-parent the camera preview (e.g. into a fixed overlay during calibration). */
  attachPreview(selector) {
    this.hostSelector = selector;
    const host = document.querySelector(selector);
    if (host) host.classList.remove("hidden");
    this.ensureVideoPlaying();
    this._mountVideo();
  },

  /** Live status for debugging (used by the ?calib=1 test screen). */
  diagnostics() {
    const v = document.querySelector((this.hostSelector || "") + " video") || document.querySelector("video");
    return {
      mode: this.mode,
      running: this.running,
      samples: (this.samples || []).length,
      video: v ? `${v.videoWidth}x${v.videoHeight} ${v.paused ? "paused" : "playing"} rs${v.readyState}` : "none",
      faceOverlay: !!document.getElementById("webgazerFaceOverlay"),
      hasWG: !!this.webgazer
    };
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
      #webgazerVideoContainer.wg-mounted {
        position: absolute !important; inset: 0 !important;
        width: 100% !important; height: 100% !important;
        margin: 0 !important; z-index: 1;
      }
      #webgazerFaceOverlay, #webgazerFaceFeedbackBox {
        width: 100% !important; height: 100% !important;
        object-fit: cover !important;
      }
      .wg-overlay #webgazerFaceOverlay, .wg-overlay #webgazerFaceFeedbackBox {
        object-fit: cover !important;
      }
      /* safety: never let a stray WebGazer container overflow the page */
      body > #webgazerVideoContainer { display: none !important; }
    `;
    document.head.appendChild(style);
  },

  _mountVideo(retries = 25) {
    this._injectStyles();
    const host = document.querySelector(this.hostSelector || "#cameraPreview");
    const vc = document.getElementById("webgazerVideoContainer") || document.getElementById("webgazerVideoFeed");
    if (host && vc) {
      vc.classList.add("wg-mounted");
      if (vc.parentElement !== host) host.appendChild(vc);
      const vid = vc.tagName === "VIDEO" ? vc : vc.querySelector("video");
      if (vid) {
        vid.setAttribute("playsinline", "");
        vid.muted = true;
        const p = vid.play();
        if (p && p.catch) p.catch(() => {});
      }
      const ph = document.getElementById("cameraPlaceholder");
      if (ph) ph.classList.add("hidden");
      return;
    }
    if (retries > 0) setTimeout(() => this._mountVideo(retries - 1), 120);
  },

  _onGaze(data, ts) {
    if (!data || data.x == null || data.y == null) return;
    const off = this.gazeOffset || { x: 0, y: 0 };
    const x = data.x - off.x, y = data.y - off.y;
    const s = { t: ts, x, y };
    if (this.readingRegion) {
      const r = this.readingRegion;
      s.dx = x - r.left + (r.scrollLeft || 0);
      s.dy = y - r.top + (r.scrollTop || 0);
    }
    this.samples.push(s);
    if (this.trial) this.trial.samples.push(s);
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
