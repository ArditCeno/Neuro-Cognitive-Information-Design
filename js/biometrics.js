/*
 * Biometrics (exploratory): MediaPipe Face Mesh blink rate and head pose.
 * Additive only: failures never block the main study flow.
 * Reuses the WebGazer video feed to avoid a second camera stream.
 */

import { CONFIG } from "./config.js?v=36";
import { loadScript, mean, round } from "./utils.js?v=36";

const L_EYE = [33, 160, 158, 133, 153, 144];
const R_EYE = [362, 385, 387, 263, 373, 380];
const EAR_THRESHOLD = 0.21;

function d(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function eyeAspectRatio(pts, idx) {
  const p = idx.map((i) => pts[i]);
  const vertical = d(p[1], p[5]) + d(p[2], p[4]);
  const horizontal = 2 * d(p[0], p[3]);
  return horizontal ? vertical / horizontal : 0;
}

export const Biometrics = {
  ready: false,
  running: false,
  samples: [],
  headPose: { yaw: [], pitch: [], roll: [] },
  blinkCount: 0,
  _closed: false,
  _faceMesh: null,
  _video: null,
  _timer: null,
  _busy: false,
  _startT: 0,

  async init() {
    try {
      await loadScript(CONFIG.cdn.mediapipeFaceMesh);
      if (!window.FaceMesh) throw new Error("FaceMesh not available");
      this._faceMesh = new window.FaceMesh({
        locateFile: (file) => "mediapipe/face_mesh/" + file
      });
      this._faceMesh.setOptions({
        maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
      });
      this._faceMesh.onResults((r) => this._onResults(r));
      this.ready = true;
      return true;
    } catch (e) {
      console.warn("Biometrics unavailable:", e);
      this.ready = false;
      return false;
    }
  },

  start() {
    if (!this.ready) return;
    const video = document.getElementById("webgazerVideoFeed");
    if (!video) return;
    this._video = video;
    this.running = true;
    this._startT = performance.now();
    this._timer = setInterval(() => this._tick(), 120);
  },

  async _tick() {
    if (!this.running || this._busy || !this._video || this._video.readyState < 2) return;
    this._busy = true;
    try { await this._faceMesh.send({ image: this._video }); }
    catch (e) { /* ignore per-frame errors */ }
    this._busy = false;
  },

  _onResults(results) {
    const lm = results.multiFaceLandmarks && results.multiFaceLandmarks[0];
    if (!lm) { this._clearDots(); return; }
    const pts = lm.map((p) => ({ x: p.x, y: p.y, z: p.z }));

    const ear = (eyeAspectRatio(pts, L_EYE) + eyeAspectRatio(pts, R_EYE)) / 2;
    if (ear < EAR_THRESHOLD && !this._closed) { this._closed = true; this.blinkCount++; }
    else if (ear >= EAR_THRESHOLD) this._closed = false;

    // rough head pose proxies (normalized, exploratory)
    const nose = pts[1], lOut = pts[33], rOut = pts[263], chin = pts[152], brow = pts[10];
    const eyeMidX = (lOut.x + rOut.x) / 2;
    const eyeDist = d(lOut, rOut) || 1e-6;
    const yaw = (nose.x - eyeMidX) / eyeDist;
    const faceH = d(chin, brow) || 1e-6;
    const pitch = (nose.y - (brow.y + chin.y) / 2) / faceH;
    const roll = Math.atan2(rOut.y - lOut.y, rOut.x - lOut.x);

    this.headPose.yaw.push(yaw);
    this.headPose.pitch.push(pitch);
    this.headPose.roll.push(roll);
    this.samples.push({ t: performance.now(), ear: round(ear, 3), yaw: round(yaw, 3), pitch: round(pitch, 3), roll: round(roll, 3) });

    this._drawDots(pts);
  },

  /* ---------- small dots over the face (scanning feedback) ---------- */
  _ensureCanvas() {
    const host = document.getElementById("cameraPreview");
    if (!host) return null;
    let c = document.getElementById("faceDots");
    if (!c) {
      c = document.createElement("canvas");
      c.id = "faceDots";
      c.style.position = "absolute";
      c.style.inset = "0";
      c.style.width = "100%";
      c.style.height = "100%";
      c.style.pointerEvents = "none";
      c.style.zIndex = "2";
      host.appendChild(c);
    }
    const w = host.clientWidth || 320, h = host.clientHeight || 240;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return c;
  },

  _drawDots(pts) {
    const c = this._ensureCanvas();
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);

    // mesh: small blue dots
    ctx.fillStyle = "rgba(14,127,176,.9)";
    for (let i = 0; i < pts.length; i += 2) {
      const x = (1 - pts[i].x) * w;  // video is mirrored
      const y = pts[i].y * h;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // eyes: orange, glowing
    ctx.shadowColor = "rgba(255,110,66,.9)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#FF6E42";
    [...L_EYE, ...R_EYE].forEach((i) => {
      const x = (1 - pts[i].x) * w, y = pts[i].y * h;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;

    // eye centres: filled pale dots
    ctx.fillStyle = "#F9F9F9";
    [[33, 133], [362, 263]].forEach((pair) => {
      const cx = (1 - (pts[pair[0]].x + pts[pair[1]].x) / 2) * w;
      const cy = ((pts[pair[0]].y + pts[pair[1]].y) / 2) * h;
      ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
    });
  },

  _clearDots() {
    const c = document.getElementById("faceDots");
    if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
  },

  summary() {
    const minutes = this._startT ? Math.max((performance.now() - this._startT) / 60000, 1e-6) : 0;
    return {
      blink_rate_per_min: minutes ? round(this.blinkCount / minutes, 1) : 0,
      blink_count: this.blinkCount,
      head_pose: {
        yaw_mean: round(mean(this.headPose.yaw), 4),
        pitch_mean: round(mean(this.headPose.pitch), 4),
        roll_mean: round(mean(this.headPose.roll), 4),
        samples: this.headPose.yaw.length
      }
    };
  },

  stop() {
    this.running = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }
};
