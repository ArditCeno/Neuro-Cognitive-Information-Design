/*
 * Local-first storage: crash-safe buffer in localStorage, JSON export,
 * plus an optional Supabase adapter (disabled until configured).
 * The export shape is assembled by js/schema.js (UML class model).
 */

import { CONFIG } from "./config.js";
import { isoNow, downloadJSON } from "./utils.js";

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
 * Optional Supabase REST insert (no SDK). Expects a table `sessions(id_anonim, payload jsonb)`.
 */
export async function uploadToSupabase(summary) {
  const cfg = K.supabase;
  if (!cfg || !cfg.url || !cfg.anonKey) return { ok: false, skipped: true };
  try {
    const res = await fetch(cfg.url.replace(/\/$/, "") + "/rest/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey,
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ id_anonim: summary.participant.id_anonim, payload: summary })
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Generic JSON endpoint (Google Apps Script Web App, Formspree, own API).
 */
export async function uploadToEndpoint(summary) {
  const cfg = K.submission;
  if (!cfg || !cfg.url) return { ok: false, skipped: true };
  try {
    const payload = { id_anonim: summary.participant.id_anonim, summary };
    if (cfg.includeGaze) payload.gaze = summary.gaze || [];
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Spring Boot backend (POST /api/sessions).
 */
export async function uploadToBackend(summary) {
  const cfg = K.backend;
  if (!cfg || !cfg.url) return { ok: false, skipped: true };
  try {
    const res = await fetch(cfg.url.replace(/\/$/, "") + "/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_anonim: summary.participant.id_anonim, summary })
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Send the session to every configured backend. */
export async function submitSession(summary) {
  const [supabase, endpoint, backend] = await Promise.all([
    uploadToSupabase(summary),
    uploadToEndpoint(summary),
    uploadToBackend(summary)
  ]);
  return { supabase, endpoint, backend };
}

/* ------------------------- Durable submission queue ------------------------- */
const PENDING_KEY = "ncid_pending_v1";

export function hasTarget() {
  const s = CONFIG.storage || {};
  return !!((s.supabase && s.supabase.url) || (s.backend && s.backend.url) || (s.submission && s.submission.url));
}

function readQueue() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); }
  catch (e) { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(q)); } catch (e) { /* ignore */ }
}

export function enqueue(summary) {
  const q = readQueue();
  q.push({ id: summary.participant ? summary.participant.id_anonim : "unknown", at: Date.now(), summary });
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
    const r = await submitSession(item.summary);
    const ok = (r.supabase && r.supabase.ok) || (r.backend && r.backend.ok) || (r.endpoint && r.endpoint.ok);
    if (ok) flushed++; else keep.push(item);
  }
  writeQueue(keep);
  return { flushed, remaining: keep.length };
}

/** Submit now; if every target fails, keep it queued for a later retry. */
export async function submitAndQueue(summary) {
  const r = await submitSession(summary);
  const ok = (r.supabase && r.supabase.ok) || (r.backend && r.backend.ok) || (r.endpoint && r.endpoint.ok);
  if (!ok && hasTarget()) enqueue(summary);
  return { ...r, queued: !ok && hasTarget() };
}
