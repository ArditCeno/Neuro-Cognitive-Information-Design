/*
 * NCID Cloudflare Worker: D1 (SQL) + R2 (raw gaze) + Apps Script (email).
 *
 * POST /submit  - participant session (idempotent)
 * POST /import  - researcher backfill from an authorised token
 * GET  /health  - version probe
 *
 * One write path: the browser posts here; the Worker writes the database and
 * only then asks Apps Script to email the report. A duplicate submission never
 * writes a second row and never sends a second email.
 */

import {
  WORKER_VERSION, MAX_BODY_BYTES, MAX_GAZE_SAMPLES,
  jsonResponse, corsOrigin, validateSubmission, gazeMeta,
  parseEmailResult, isoPlusMs, asText, asInt, asFloat,
  participantRows
} from "./lib.js";

const EMAIL_RETRY_MINUTES = 5;
const EMAIL_MAX_ATTEMPTS = 5;
const MAX_D1_GAZE_BYTES = 950000; // D1 row limit safety margin

export default {
  async fetch(request, env) {
    const origin = corsOrigin(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "POST, GET, OPTIONS",
          "access-control-allow-headers": "content-type, authorization",
          "access-control-max-age": "86400"
        }
      });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "ncid-api", version: WORKER_VERSION }, 200, origin);
    }
    if (url.pathname === "/submit" && request.method === "POST") {
      return handleSubmit(request, env, origin);
    }
    if (url.pathname === "/import" && request.method === "POST") {
      return handleImport(request, env, origin);
    }
    if (url.pathname === "/export/sessions" && request.method === "GET") {
      return handleExportSessions(request, env, origin);
    }
    if (url.pathname === "/export/identity" && request.method === "GET") {
      return handleExportIdentity(request, env, origin);
    }
    if (url.pathname.startsWith("/export/gaze/") && request.method === "GET") {
      return handleExportGaze(request, env);
    }
    return jsonResponse({ ok: false, error: "not_found" }, 404, origin);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(retryPendingEmails(env));
  }
};

async function handleSubmit(request, env, origin) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) return jsonResponse({ ok: false, error: "body_too_large" }, 413, origin);

  let body;
  try { body = await request.json(); }
  catch (e) { return jsonResponse({ ok: false, error: "invalid_json" }, 400, origin); }

  const v = validateSubmission(body);
  if (!v.ok) return jsonResponse({ ok: false, error: v.error }, 400, origin);

  let result;
  try {
    result = await persistSession(env, v, { source: "worker", emailStatus: "pending" });
  } catch (e) {
    return jsonResponse({ ok: false, error: "database_error", detail: String(e).slice(0, 300) }, 500, origin);
  }

  if (result.duplicate) {
    return jsonResponse({ ok: true, duplicate: true }, 200, origin);
  }

  const email = await sendEmail(env, result.summary, v.identity);
  await recordEmail(env, result.submission_id, email, 0);
  await updateEmailStatus(env, result.submission_id, email, 0);

  return jsonResponse({
    ok: true,
    submission_id: result.submission_id,
    email: email.ok ? "sent" : "pending"
  }, 200, origin);
}

async function handleImport(request, env, origin) {
  const auth = request.headers.get("Authorization") || "";
  if (!env.IMPORT_TOKEN || auth !== "Bearer " + env.IMPORT_TOKEN) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401, origin);
  }

  let body;
  try { body = await request.json(); }
  catch (e) { return jsonResponse({ ok: false, error: "invalid_json" }, 400, origin); }

  const sessions = Array.isArray(body) ? body : (body && body.sessions);
  if (!Array.isArray(sessions)) return jsonResponse({ ok: false, error: "expected_sessions_array" }, 400, origin);

  let inserted = 0, duplicate = 0, failed = 0;
  for (const item of sessions.slice(0, 300)) {
    try {
      const summary = item.payload || item.summary || item;
      const identity = {
        emri_mbiemer: (item.name || (summary.participant && summary.participant.emri_mbiemer) || null)
      };
      const v = validateSubmission({
        submission_id: item.submission_id || summary.submission_id || item.id ||
          ("legacy_" + (summary.participant && summary.participant.id_anonim)),
        summary,
        identity,
        gaze: []
      });
      if (!v.ok) { failed++; continue; }
      const r = await persistSession(env, v, { source: "backfill", emailStatus: "sent" });
      if (r.duplicate) duplicate++; else inserted++;
    } catch (e) {
      failed++;
    }
  }
  return jsonResponse({ ok: true, inserted, duplicate, failed }, 200, origin);
}

function exportAuth(request, env) {
  if (!env.EXPORT_TOKEN) return false;
  return (request.headers.get("Authorization") || "") === "Bearer " + env.EXPORT_TOKEN;
}

async function handleExportSessions(request, env, origin) {
  if (!exportAuth(request, env)) return jsonResponse({ ok: false, error: "unauthorized" }, 401, origin);
  const rows = await env.DB.prepare(
    `SELECT s.payload_json, s.submission_id, s.email_status, s.gaze_status,
            g.r2_key AS gaze_key, g.storage AS gaze_storage
     FROM sessions s LEFT JOIN gaze_objects g ON g.submission_id = s.submission_id
     ORDER BY s.created_at DESC LIMIT 5000`
  ).all();
  const sessions = (rows.results || []).map((r) => {
    let payload = {};
    try { payload = JSON.parse(r.payload_json); } catch (e) { /* keep empty */ }
    return {
      submission_id: r.submission_id,
      email_status: r.email_status,
      gaze_status: r.gaze_status,
      gaze_key: r.gaze_key || null,
      gaze_storage: r.gaze_storage || null,
      payload
    };
  });
  return jsonResponse({ ok: true, sessions }, 200, origin);
}

async function handleExportIdentity(request, env, origin) {
  if (!exportAuth(request, env)) return jsonResponse({ ok: false, error: "unauthorized" }, 401, origin);
  const rows = await env.DB.prepare(
    "SELECT id_anonim, full_name, updated_at FROM identity ORDER BY updated_at DESC LIMIT 5000"
  ).all();
  return jsonResponse({ ok: true, identity: rows.results || [] }, 200, origin);
}

async function handleExportGaze(request, env) {
  if (!exportAuth(request, env)) return new Response("unauthorized", { status: 401 });
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.slice("/export/gaze/".length));

  if (key.startsWith("d1:")) {
    const sid = key.slice(3);
    const row = await env.DB.prepare(
      "SELECT data_gz, compressed FROM gaze_objects WHERE submission_id=?"
    ).bind(sid).first();
    if (!row || !row.data_gz) return new Response("not_found", { status: 404 });
    // D1 may return the BLOB as ArrayBuffer, typed array or a Blob-like object.
    let body = row.data_gz;
    if (body && typeof body.arrayBuffer === "function") body = await body.arrayBuffer();
    if (body instanceof ArrayBuffer) body = new Uint8Array(body);
    else if (ArrayBuffer.isView(body)) body = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
    else if (Array.isArray(body)) body = new Uint8Array(body);
    return new Response(body, {
      headers: {
        "content-type": row.compressed ? "application/gzip" : "application/json",
        "content-disposition": 'attachment; filename="' + sid + (row.compressed ? ".json.gz" : ".json") + '"',
        "content-length": String((body && body.byteLength) || 0),
        "cache-control": "no-store"
      }
    });
  }

  if (!key.startsWith("gaze/")) return new Response("bad_key", { status: 400 });
  if (!env.GAZE) return new Response("r2_not_enabled", { status: 404 });
  const obj = await env.GAZE.get(key);
  if (!obj) return new Response("not_found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": (obj.httpMetadata && obj.httpMetadata.contentType) || "application/octet-stream",
      "content-disposition": 'attachment; filename="' + key.split("/").pop() + '"',
      "cache-control": "no-store"
    }
  });
}

async function persistSession(env, v, opts) {
  const summary = JSON.parse(JSON.stringify(v.summary));
  const identity = v.identity || {};
  const p = participantRows(summary, identity);
  if (!p.id_anonim) throw new Error("missing id_anonim");

  // Keep the name out of the analysis payload.
  const name = p.full_name || (summary.participant && summary.participant.emri_mbiemer) || null;
  if (summary.participant) delete summary.participant.emri_mbiemer;
  delete summary.gaze;

  const sid = String(v.submissionId || "").slice(0, 160);
  if (!sid) throw new Error("missing submission_id");
  const lang = p.language === "sq" ? "al" : p.language;
  const payloadJson = JSON.stringify(summary);

  await env.DB.prepare(
    `INSERT INTO participants (id_anonim, age, profession, expertise)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id_anonim) DO UPDATE SET
       age = excluded.age,
       profession = excluded.profession,
       expertise = excluded.expertise`
  ).bind(p.id_anonim, p.age, p.profession, p.expertise).run();

  if (name) {
    await env.DB.prepare(
      `INSERT INTO identity (id_anonim, full_name, updated_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
       ON CONFLICT(id_anonim) DO UPDATE SET full_name = excluded.full_name, updated_at = excluded.updated_at`
    ).bind(p.id_anonim, String(name).slice(0, 200)).run();
  }

  const ins = await env.DB.prepare(
    `INSERT OR IGNORE INTO sessions
      (submission_id, id_anonim, session_number, calibration_px, duration_min,
       language, method, browser, device, accuracy_pct, source, email_status,
       email_sent_at, gaze_status, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'none', ?)`
  ).bind(
    sid, p.id_anonim, p.session_number, p.calibration_px, p.duration_min,
    lang, p.method, p.browser, p.device, p.accuracy_pct, opts.source, opts.emailStatus,
    opts.emailStatus === "sent" ? new Date().toISOString() : null,
    payloadJson
  ).run();

  if (!ins.meta || ins.meta.changes === 0) {
    return { duplicate: true, submission_id: sid, summary, id_anonim: p.id_anonim };
  }

  try {
    const statements = [];
    const modules = Array.isArray(summary.modules) ? summary.modules : [];
    for (const m of modules) {
      const mIns = await env.DB.prepare(
        `INSERT INTO modules
          (session_id, module_id, profession, expertise, complexity, preference, order_index, first_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        sid, asText(m.module_id, 80), asText(m.fusha, 120), asText(m.ekspertiza, 120),
        asText(m.complexity, 80), asText(m.preference, 16), asInt(m["rendi_në_seson"]),
        asText(m.versioni_i_parë, 2)
      ).run();
      const moduleUid = mIns.meta && mIns.meta.last_row_id;
      if (!moduleUid) continue;

      const trials = Array.isArray(m.trials) ? m.trials : [];
      for (const t of trials) {
        const tIns = await env.DB.prepare(
          `INSERT INTO trials
            (session_id, module_uid, version, format, reading_s, task_s, ttff_ms,
             regressions, fixation_ms, fixation_count, accuracy_pct, stimulus_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sid, moduleUid, asText(t.versioni, 2) || "A", asText(t.format, 2),
          asFloat(t.koha_e_leximit_s), asFloat(t.koha_detyrës_s), asFloat(t.TTFF_ms),
          asInt(t.regresione), asFloat(t.fixation_duration_ms), asInt(t.fixation_count),
          asFloat(t.accuracy_score_pct), t.stimulus ? JSON.stringify(t.stimulus) : null
        ).run();
        const trialUid = tIns.meta && tIns.meta.last_row_id;
        if (!trialUid) continue;

        const responses = Array.isArray(t.response) ? t.response : [];
        const items = Array.isArray(t.quiz_item) ? t.quiz_item : [];
        for (let i = 0; i < responses.length; i++) {
          const r = responses[i] || {};
          const q = items[i] || {};
          statements.push(env.DB.prepare(
            `INSERT INTO responses (trial_uid, question_index, question, chosen, correct, time_s)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            trialUid, i, asText(q.pyetja || ("q" + i), 2000) || ("q" + i),
            asText(r.zgjedhja, 300), r["e_saktë"] ? 1 : 0, asFloat(r.koha_s)
          ));
        }
      }

      const tx = m.nasa_tlx;
      if (tx) {
        statements.push(env.DB.prepare(
          `INSERT INTO module_tlx
            (session_id, module_uid, mental, physical, temporal, performance, effort, frustration)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sid, moduleUid, asInt(tx.mental), asInt(tx.physical), asInt(tx.temporal),
          asInt(tx.performance), asInt(tx.effort), asInt(tx.frustration)
        ));
      }
    }
    if (statements.length) await env.DB.batch(statements);
  } catch (e) {
    await deleteSession(env, sid);
    throw e;
  }

  if (opts.source === "worker") {
    await storeGaze(env, sid, v.gaze);
  }

  return { duplicate: false, submission_id: sid, summary, id_anonim: p.id_anonim };
}

async function storeGaze(env, sid, gaze) {
  if (!Array.isArray(gaze) || !gaze.length) return;
  if (gaze.length > MAX_GAZE_SAMPLES) return;
  try {
    const meta = gazeMeta(gaze);
    const gz = await gzipJson(gaze);

    if (env.GAZE) {
      const key = "gaze/" + sid + (gz.compressed ? ".json.gz" : ".json");
      await env.GAZE.put(key, gz.body, {
        httpMetadata: { contentType: gz.compressed ? "application/gzip" : "application/json" }
      });
      await env.DB.batch([
        env.DB.prepare(
          `INSERT OR REPLACE INTO gaze_objects
            (submission_id, r2_key, sample_count, duration_ms, bytes, sha256, compressed, storage, data_gz)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'r2', NULL)`
        ).bind(sid, key, meta.count, meta.duration_ms, gz.bytes, gz.sha256, gz.compressed ? 1 : 0),
        env.DB.prepare("UPDATE sessions SET gaze_status='stored' WHERE submission_id=?").bind(sid)
      ]);
      return;
    }

    // No R2 binding: keep the compressed gaze in D1 (free tier, no card).
    if (gz.bytes > MAX_D1_GAZE_BYTES) {
      await env.DB.prepare("UPDATE sessions SET gaze_status='failed' WHERE submission_id=?").bind(sid).run();
      return;
    }
    const key = "d1:" + sid;
    await env.DB.batch([
      env.DB.prepare(
        `INSERT OR REPLACE INTO gaze_objects
          (submission_id, r2_key, sample_count, duration_ms, bytes, sha256, compressed, storage, data_gz)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'd1', ?)`
      ).bind(
        sid, key, meta.count, meta.duration_ms, gz.bytes, gz.sha256, gz.compressed ? 1 : 0,
        new Uint8Array(gz.body)
      ),
      env.DB.prepare("UPDATE sessions SET gaze_status='stored' WHERE submission_id=?").bind(sid)
    ]);
  } catch (e) {
    await env.DB.prepare("UPDATE sessions SET gaze_status='failed' WHERE submission_id=?").bind(sid).run();
  }
}

async function gzipJson(gaze) {
  const json = JSON.stringify(gaze);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
  const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  try {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
    const body = await new Response(stream).arrayBuffer();
    return { body, bytes: body.byteLength, sha256, compressed: true };
  } catch (e) {
    const body = new TextEncoder().encode(json);
    return { body, bytes: body.byteLength, sha256, compressed: false };
  }
}

async function sendEmail(env, summary, identity) {
  if (!env.APPS_SCRIPT_URL) return { ok: false, error: "missing_apps_script_url" };
  try {
    const payload = {
      token: env.APPS_SCRIPT_TOKEN || "",
      summary,
      identity: identity || null
    };
    const form = new URLSearchParams({ payload: JSON.stringify(payload) });
    const res = await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      redirect: "follow"
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: "http_" + res.status };
    return parseEmailResult(text);
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 300) };
  }
}

async function recordEmail(env, sid, result, attempts) {
  try {
    await env.DB.prepare(
      "INSERT INTO email_log (submission_id, ok, error) VALUES (?, ?, ?)"
    ).bind(sid, result.ok ? 1 : 0, result.error || null).run();
  } catch (e) { /* logging must never block */ }
}

async function updateEmailStatus(env, sid, result, attempts) {
  if (result.ok) {
    await env.DB.prepare(
      `UPDATE sessions SET email_status='sent', email_sent_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),
       email_last_error=NULL, email_next_attempt_at=NULL WHERE submission_id=?`
    ).bind(sid).run();
    return;
  }
  const nextAttempts = Number(attempts || 0) + 1;
  if (nextAttempts >= EMAIL_MAX_ATTEMPTS) {
    await env.DB.prepare(
      "UPDATE sessions SET email_status='failed', email_attempts=?, email_last_error=? WHERE submission_id=?"
    ).bind(nextAttempts, String(result.error || "unknown").slice(0, 300), sid).run();
  } else {
    await env.DB.prepare(
      `UPDATE sessions SET email_status='pending', email_attempts=?, email_last_error=?, email_next_attempt_at=?
       WHERE submission_id=?`
    ).bind(nextAttempts, String(result.error || "unknown").slice(0, 300), isoPlusMs(EMAIL_RETRY_MINUTES * 60 * 1000), sid).run();
  }
}

async function retryPendingEmails(env) {
  const rows = await env.DB.prepare(
    `SELECT s.submission_id, s.payload_json, s.email_attempts, i.full_name
     FROM sessions s LEFT JOIN identity i ON i.id_anonim = s.id_anonim
     WHERE s.email_status='pending'
       AND (s.email_next_attempt_at IS NULL OR s.email_next_attempt_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     LIMIT 20`
  ).all();

  for (const row of (rows.results || [])) {
    let summary;
    try { summary = JSON.parse(row.payload_json); } catch (e) { continue; }
    const identity = { emri_mbiemer: row.full_name || null };
    const result = await sendEmail(env, summary, identity);
    await recordEmail(env, row.submission_id, result, row.email_attempts || 0);
    await updateEmailStatus(env, row.submission_id, result, row.email_attempts || 0);
  }
}

async function deleteSession(env, sid) {
  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM responses WHERE trial_uid IN (SELECT trial_uid FROM trials WHERE session_id=?)").bind(sid),
      env.DB.prepare("DELETE FROM module_tlx WHERE session_id=?").bind(sid),
      env.DB.prepare("DELETE FROM trials WHERE session_id=?").bind(sid),
      env.DB.prepare("DELETE FROM modules WHERE session_id=?").bind(sid),
      env.DB.prepare("DELETE FROM gaze_objects WHERE submission_id=?").bind(sid),
      env.DB.prepare("DELETE FROM email_log WHERE submission_id=?").bind(sid),
      env.DB.prepare("DELETE FROM sessions WHERE submission_id=?").bind(sid)
    ]);
  } catch (e) { /* best effort */ }
}
