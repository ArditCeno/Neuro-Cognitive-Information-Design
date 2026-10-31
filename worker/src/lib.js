/*
 * Pure helpers for the NCID Cloudflare Worker.
 * Kept free of D1/R2 so they can be unit-tested with Node.
 */

export const WORKER_VERSION = "1.0.0";
export const MAX_GAZE_SAMPLES = 250000;
export const MAX_BODY_BYTES = 25 * 1024 * 1024;
export const MAX_NAME_CHARS = 200;

export function jsonResponse(obj, status = 200, origin = "*") {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, GET, OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
      "cache-control": "no-store"
    }
  });
}

export function corsOrigin(request, env) {
  const allowed = String(env.ALLOWED_ORIGIN || "https://arditceno.github.io")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get("Origin") || "";
  if (allowed.includes(origin)) return origin;
  // Local development on the usual static-server port.
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return allowed[0] || "https://arditceno.github.io";
}

export function validateSubmission(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const sid = body.submission_id;
  if (typeof sid !== "string" || !sid || sid.length > 160) return { ok: false, error: "invalid_submission_id" };

  const summary = body.summary;
  if (!summary || typeof summary !== "object") return { ok: false, error: "missing_summary" };

  const participant = summary.participant;
  if (!participant || typeof participant !== "object") return { ok: false, error: "missing_participant" };
  const id = participant.id_anonim;
  if (typeof id !== "string" || !id || id.length > 120) return { ok: false, error: "invalid_participant_id" };

  if (summary.modules != null && !Array.isArray(summary.modules)) return { ok: false, error: "invalid_modules" };

  const identity = body.identity || {};
  if (identity.emri_mbiemer != null && String(identity.emri_mbiemer).length > MAX_NAME_CHARS) {
    return { ok: false, error: "name_too_long" };
  }

  const gaze = Array.isArray(body.gaze) ? body.gaze : [];
  if (gaze.length > MAX_GAZE_SAMPLES) return { ok: false, error: "too_many_gaze_samples" };

  return { ok: true, submissionId: sid, summary, identity, gaze };
}

export function gazeMeta(gaze) {
  if (!Array.isArray(gaze) || !gaze.length) return { count: 0, duration_ms: 0 };
  const first = gaze[0] && Number(gaze[0].t_ms);
  const last = gaze[gaze.length - 1] && Number(gaze[gaze.length - 1].t_ms);
  const duration = Number.isFinite(first) && Number.isFinite(last) ? Math.max(0, last - first) : 0;
  return { count: gaze.length, duration_ms: Math.round(duration) };
}

export function parseEmailResult(html) {
  const m = String(html || "").match(/var r=(\{[\s\S]*?\});/);
  if (!m) return { ok: true, raw: true };
  try {
    const r = JSON.parse(m[1]);
    return { ok: r.ok !== false, duplicate: !!r.duplicate, error: r.error || null };
  } catch (e) {
    return { ok: true, raw: true };
  }
}

export function isoPlusMs(ms) {
  return new Date(Date.now() + ms).toISOString();
}

export function asText(v, max = 500) {
  if (v == null) return null;
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

export function asInt(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function asFloat(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function asBoolInt(v) {
  return v ? 1 : 0;
}

export function participantRows(summary, identity) {
  const p = summary.participant || {};
  const s = summary.session || {};
  return {
    id_anonim: String(p.id_anonim || ""),
    age: asInt(p.mosha),
    profession: asText(p.profesioni || p.profession, 200) || "unknown",
    expertise: asText(p["niveli_i_ekspertizës"] || p.expertise, 200) || "unknown",
    session_number: asInt(s.session_number),
    calibration_px: asFloat(s.kalibrimi_px),
    duration_min: asFloat(s["kohëzgjatja_min"]),
    language: asText(s.gjuha, 8),
    method: asText(s.metoda, 32),
    browser: asText(s.shfletuesi, 200),
    device: asText(s.pajisja, 200),
    accuracy_pct: asFloat((summary.quiz_results || {}).accuracy_score_pct),
    full_name: identity && identity.emri_mbiemer ? String(identity.emri_mbiemer) : null
  };
}
