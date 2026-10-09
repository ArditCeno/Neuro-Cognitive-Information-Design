/*
 * Small shared helpers.
 */

export function now() {
  return (typeof performance !== "undefined" && performance.now)
    ? performance.now() : Date.now();
}

export function isoNow() {
  return new Date().toISOString();
}

export function anonId() {
  const n = Math.floor(10000 + Math.random() * 89999);
  return "USR_" + n;
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleN(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function mean(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function median(arr) {
  if (!arr || !arr.length) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function std(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) * (v - m), 0) / (arr.length - 1));
}

export function round(v, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}

export function detectBrowser() {
  const ua = navigator.userAgent;
  let name = "Unknown";
  if (/Edg\//.test(ua)) name = "Edge";
  else if (/Chrome\//.test(ua)) name = "Chrome";
  else if (/Firefox\//.test(ua)) name = "Firefox";
  else if (/Safari\//.test(ua)) name = "Safari";
  return { name, ua, language: navigator.language, device: screen.width + "x" + screen.height };
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const k of Object.keys(attrs)) {
    if (k === "class") node.className = attrs[k];
    else if (k === "html") node.innerHTML = attrs[k];
    else if (k === "text") node.textContent = attrs[k];
    else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}
