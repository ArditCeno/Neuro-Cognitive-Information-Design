/*
 * Biometrics (exploratory): MediaPipe Face Mesh blink rate and head pose.
 * Additive only: failures never block the main study flow.
 * Reuses the WebGazer video feed to avoid a second camera stream.
 */

import { CONFIG } from "./config.js?v=48";
import { loadScript, mean, round } from "./utils.js?v=48";

const L_EYE = [33, 160, 158, 133, 153, 144];
const R_EYE = [362, 385, 387, 263, 373, 380];
const EAR_THRESHOLD = 0.21;
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];

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
  _low: null,
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
        maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
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
    if (!this.ready || this.running) return;
    const video = document.getElementById("webgazerVideoFeed") || document.querySelector("video");
    if (!video) return;
    this._video = video;
    // Feed a small copy of the video so the second FaceMesh stays light on phones.
    this._low = document.createElement("canvas");
    this._low.width = 160; this._low.height = 120;
    const touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    this.running = true;
    this._startT = performance.now();
    this._timer = setInterval(() => this._tick(), touch ? 260 : 130);
  },

  async _tick() {
    if (!this.running || this._busy || !this._video || this._video.readyState < 2 || !this._video.videoWidth) return;
    this._busy = true;
    try {
      const ctx = this._low.getContext("2d");
      ctx.drawImage(this._video, 0, 0, this._low.width, this._low.height);
      await this._faceMesh.send({ image: this._low });
    } catch (e) { /* ignore per-frame errors */ }
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
    const vid = this._video || document.querySelector("video");
    const host = (vid && vid.closest && vid.closest("#wgOverlay, #cameraPreview")) ||
      document.getElementById("wgOverlay") || document.getElementById("cameraPreview");
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
    }
    if (c.parentElement !== host) host.appendChild(c);   // follow the video (preview -> overlay)
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
    const X = (i) => (1 - pts[i].x) * w;   // video is mirrored
    const Y = (i) => pts[i].y * h;

    // full mesh: fine cyan dots
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#7fd3f0";
    for (let i = 0; i < pts.length; i++) {
      ctx.fillRect(X(i) - 0.6, Y(i) - 0.6, 1.2, 1.2);
    }
    ctx.restore();

    // face oval outline
    ctx.save();
    ctx.strokeStyle = "rgba(14,127,176,.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    FACE_OVAL.forEach((i, k) => { const x = X(i), y = Y(i); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // lips outline (warm)
    ctx.save();
    ctx.strokeStyle = "rgba(255,110,66,.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    LIPS.forEach((i, k) => { const x = X(i), y = Y(i); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // eyes: glowing orange points
    ctx.save();
    ctx.shadowColor = "rgba(255,110,66,.95)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#FF6E42";
    [...L_EYE, ...R_EYE].forEach((i) => { ctx.beginPath(); ctx.arc(X(i), Y(i), 2.4, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();

    // eye centres: bright white with a cyan halo
    ctx.save();
    ctx.shadowColor = "#8fe6ff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#F9F9F9";
    [[33, 133], [362, 263]].forEach((pair) => {
      const cx = (X(pair[0]) + X(pair[1])) / 2, cy = (Y(pair[0]) + Y(pair[1])) / 2;
      ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
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
