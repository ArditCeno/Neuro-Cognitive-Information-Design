/*
 * NCID submission Edge Function.
 *
 * The only write path for the study. It:
 *   1. validates the request (anon key header, payload size, anonymous id),
 *   2. rate-limits by IP (check_rate_limit RPC),
 *   3. strips the optional name from the study payload,
 *   4. inserts the anonymous payload with the service role,
 *   5. stores the name in a separate, owner-only identity table,
 *   6. forwards the report to the researcher's email.
 *
 * Secrets (set with `supabase secrets set ...`):
 *   APPS_SCRIPT_URL    Google Apps Script Web App URL (ends with /exec)
 *   APPS_SCRIPT_TOKEN  shared token checked by Code.gs
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
 *
 * Deploy:
 *   supabase functions deploy submit --no-verify-jwt
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const MAX_BODY_BYTES = 1_500_000;
const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 3600;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  });
}

/** Deep copy of the payload with every participant name removed. */
function stripName(summary: Record<string, unknown>): Record<string, unknown> {
  const clean = JSON.parse(JSON.stringify(summary || {}));
  if (clean.participant && typeof clean.participant === "object") {
    delete clean.participant.emri_mbiemer;
    delete clean.participant["em\u00ebr_mbiem\u00ebr"];
  }
  return clean;
}

async function notify(summary: unknown, name: string, kind: string, id: string): Promise<void> {
  const url = Deno.env.get("APPS_SCRIPT_URL");
  const token = Deno.env.get("APPS_SCRIPT_TOKEN");
  if (!url || !token) {
    console.warn("email skipped: APPS_SCRIPT_URL / APPS_SCRIPT_TOKEN not set");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token, kind, summary, identity: { id_anonim: id, emri_mbiemer: name } }),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) {
    console.error("email failed:", String(e));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const expectedKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const givenKey = req.headers.get("apikey") || "";
  if (expectedKey && givenKey && givenKey !== expectedKey) {
    return json({ ok: false, error: "forbidden" }, 401);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "payload_too_large" }, 413);

  let body: Record<string, any>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const summary = body.summary || {};
  const id = String(body.id_anonim || summary?.participant?.id_anonim || "");
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return json({ ok: false, error: "bad_id" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "not_configured" }, 500);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const { data: allowed, error: rateErr } = await admin.rpc("check_rate_limit", {
    p_ip: ip,
    p_limit: RATE_LIMIT,
    p_window_seconds: RATE_WINDOW_SECONDS
  });
  if (rateErr) console.error("rate limit:", rateErr.message);
  else if (allowed === false) return json({ ok: false, error: "rate_limited" }, 429);

  const identity = body.identity || {};
  const name = String(identity.emri_mbiemer || identity["em\u00ebr_mbiem\u00ebr"] || body.emri_mbiemer || "").slice(0, 200);
  const submissionId = String(body.submission_id || summary.submission_id || "").slice(0, 80) || null;
  const cleanSummary = stripName(summary);
  if (submissionId) cleanSummary.submission_id = submissionId;

  const { error: insertErr } = await admin.from("sessions").insert({
    id_anonim: id,
    payload: cleanSummary,
    submission_id: submissionId
  });
  if (insertErr) {
    if (insertErr.code === "23505") return json({ ok: true, duplicate: true });
    console.error("insert:", insertErr.message);
    return json({ ok: false, error: "insert_failed" }, 500);
  }

  if (name) {
    const { error: idErr } = await admin.from("participant_identity").upsert(
      { id_anonim: id, emri_mbiemer: name, updated_at: new Date().toISOString() },
      { onConflict: "id_anonim" }
    );
    if (idErr) console.error("identity:", idErr.message);
  }

  await notify(cleanSummary, name, String(body.kind || cleanSummary.kind || "session"), id);
  return json({ ok: true });
});
