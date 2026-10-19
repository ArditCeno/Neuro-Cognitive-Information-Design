/*
 * Local-first storage: crash-safe buffer in localStorage, JSON export,
 * plus an optional Supabase adapter (disabled until configured).
 * The export shape is assembled by js/schema.js (UML class model).
 */

import { CONFIG } from "./config.js?v=44";
import { isoNow, downloadJSON } from "./utils.js?v=44";

const K = CONFIG.storage;

function key(sessionId) { return K.keyName + ":" + sessionId; }

export const Storage = {
  sessionId: null,

  init(sessionId) {
    this.sessionId = sessionId;
    const existing = this.read();
    if (!existing || existing.__id !== sessionId) {
      this.write({
        __id: sessionId,
        created_at: isoNow(),
        events: [],
        trials: [],
        gaze: [],
        participant: null,
        session: null
      });
    }
  },

  read() {
    try { return JSON.parse(localStorage.getItem(key(this.sessionId))); }
    catch (e) { return null; }
  },

  write(s) {
    try { localStorage.setItem(key(this.sessionId), JSON.stringify(s)); }
    catch (e) { console.warn("Storage write failed", e); }
  },

  patch(updater) {
    const s = this.read() || {};
    updater(s);
    this.write(s);
  },

  addEvent(type, data) {
    this.patch((s) => { (s.events = s.events || []).push({ t_ms: Date.now(), type, data }); });
  },

  addTrial(trial) {
    this.patch((s) => { (s.trials = s.trials || []).push(trial); });
  },

  nextSessionCounter() {
    const n = parseInt(localStorage.getItem(K.counterKey) || "0", 10) + 1;
    localStorage.setItem(K.counterKey, String(n));
    return n;
  },

  clear() {
    try { localStorage.removeItem(key(this.sessionId)); this.sessionId = null; }
    catch (e) { /* ignore */ }
  }
};

export function exportSummary(summary, filename) {
  downloadJSON(summary, filename || ("session_" + summary.participant.id_anonim + ".json"));
}

export function exportGaze(summary, filename) {
  downloadJSON(
    { id_anonim: summary.participant.id_anonim, gaze: summary.gaze || [] },
    filename || ("gaze_" + summary.participant.id_anonim + ".json")
  );
}

/**
 * Single write path: the Supabase Edge Function `submit`.
 *
 * The function (service role) inserts the anonymous study payload, stores the
 * optional name in a separate identity table, applies a per-IP rate limit and
 * sends the email report. The Apps Script URL and its token never reach the
 * browser, so the public anon key cannot be used to spam the researcher.
 */
/**
 * POST to the Apps Script as a hidden form (iframe) so we get a real reply via
 * postMessage: { ok:true } or { ok:false, error }. Falls back to a fire-and-forget
 * request if the frame is blocked or times out.
 */
function postViaIframe(url, payload, timeoutMs) {
  return new Promise((resolve) => {
    const name = "ncid_if_" + Math.random().toString(36).slice(2);
    const iframe = document.createElement("iframe");
    iframe.name = name;
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = name;
    form.style.display = "none";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload";
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    let settled = false;
    const cleanup = () => {
      try { form.remove(); } catch (e) { /* ignore */ }
      try { iframe.remove(); } catch (e) { /* ignore */ }
      window.removeEventListener("message", onMsg);
    };
    const onMsg = (ev) => {
      const d = ev && ev.data;
      if (!d || d.ncid !== true) return;
      settled = true; cleanup();
      const r = d.result || {};
      resolve(r.ok ? { ok: true, via: "iframe" } : { ok: false, error: r.error || "server_error", definitive: true });
    };
    window.addEventListener("message", onMsg);
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    try { form.submit(); } catch (e) { if (!settled) { settled = true; cleanup(); resolve({ ok: false, error: "submit_failed" }); } }
    setTimeout(() => { if (!settled) { settled = true; cleanup(); resolve({ ok: false, error: "timeout" }); } }, timeoutMs || 15000);
  });
}

export async function uploadToEndpoint(summary, identity) {
  const cfg = K.submission;
  if (!cfg || (!cfg.url && !cfg.fallbackUrl)) return { ok: false, skipped: true };
  const body = {
    id_anonim: summary.participant ? summary.participant.id_anonim : "unknown",
    submission_id: summary.submission_id,
    kind: summary.kind || "session",
    summary,
    identity: identity || null
  };
  if (cfg.includeGaze) body.gaze = summary.gaze || [];

  // 1) secure path: Supabase Edge Function
  if (cfg.url) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (K.supabase && K.supabase.anonKey) {
        headers.apikey = K.supabase.anonKey;
        headers.Authorization = "Bearer " + K.supabase.anonKey;
      }
      const res = await fetch(cfg.url, { method: "POST", headers, body: JSON.stringify(body) });
      let data = {};
      try { data = await res.json(); } catch (e) { /* non-JSON */ }
      if (res.ok && data.ok !== false) return { ok: true, status: res.status, via: "edge" };
    } catch (e) { /* fall through to the fallback */ }
  }

  // 2) Google Apps Script (email delivery): hidden-form post + postMessage reply
  if (cfg.fallbackUrl) {
    const emailSummary = JSON.parse(JSON.stringify(summary));
    if (identity && identity.emri_mbiemer && emailSummary.participant) {
      emailSummary.participant.emri_mbiemer = identity.emri_mbiemer;
    }
    const payload = {
      id_anonim: body.id_anonim,
      summary: emailSummary,
      identity: identity || null,
      token: cfg.fallbackToken
    };
    const r = await postViaIframe(cfg.fallbackUrl, payload, 15000);
    if (r.ok) return { ok: true, via: "iframe" };
    // if the server clearly rejected it, report that; otherwise try a blind POST
    if (r.definitive) return r;
    try {
      await fetch(cfg.fallbackUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return { ok: true, via: "fallback-opaque", uncertain: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  return { ok: false, status: 404 };
}

/**
 * Spring Boot backend (POST /api/sessions), optional.
 */
export async function uploadToBackend(summary, identity) {
  const cfg = K.backend;
  if (!cfg || !cfg.url) return { ok: false, skipped: true };
  try {
    const res = await fetch(cfg.url.replace(/\/$/, "") + "/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_anonim: summary.participant ? summary.participant.id_anonim : "unknown",
        summary,
        identity: identity || null
      })
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Stable id so a retried submission is stored (and emailed) only once. */
function newSubmissionId() {
  try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); }
  catch (e) { /* fall through */ }
  return "sub_" + Date.now() + "_" + Math.random().toString(16).slice(2, 10);
}

function withSubmissionId(summary) {
  if (summary && summary.submission_id) return summary;
  return Object.assign({}, summary, { submission_id: newSubmissionId() });
}

/** Send the session to every configured backend. */
export async function submitSession(summary, identity) {
  const s = withSubmissionId(summary);
  const [endpoint, backend] = await Promise.all([
    uploadToEndpoint(s, identity),
    uploadToBackend(s, identity)
  ]);
  return { endpoint, backend, summary: s };
}

/* ------------------------- Durable submission queue ------------------------- */
const PENDING_KEY = "ncid_pending_v1";

export function hasTarget() {
  const s = CONFIG.storage || {};
  const sub = s.submission || {};
  return !!((s.backend && s.backend.url) || sub.url || sub.fallbackUrl);
}

function readQueue() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); }
  catch (e) { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(q)); } catch (e) { /* ignore */ }
}

export function enqueue(summary, identity) {
  const q = readQueue();
  q.push({ id: summary.participant ? summary.participant.id_anonim : "unknown", at: Date.now(), summary, identity: identity || null });
  writeQueue(q);
}

export function pendingCount() { return readQueue().length; }

/** Try to upload every queued session; drop only the ones that succeed. */
export async function flushPending() {
  if (!hasTarget()) return { flushed: 0, remaining: readQueue().length };
  const q = readQueue();
  if (!q.length) return { flushed: 0, remaining: 0 };
  const keep = [];
  let flushed = 0;
  for (const item of q) {
    const r = await submitSession(item.summary, item.identity);
    const ok = (r.backend && r.backend.ok) || (r.endpoint && r.endpoint.ok);
    if (ok) flushed++; else keep.push(item);
  }
  writeQueue(keep);
  return { flushed, remaining: keep.length };
}

/** Submit now; if every target fails, keep it queued for a later retry. */
export async function submitAndQueue(summary, identity) {
  const r = await submitSession(summary, identity);
  const ok = (r.backend && r.backend.ok) || (r.endpoint && r.endpoint.ok);
  if (!ok && hasTarget()) enqueue(r.summary, identity);
  return { ...r, queued: !ok && hasTarget() };
}
