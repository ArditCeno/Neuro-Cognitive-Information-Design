/**
 * NCID endpoint (Google Apps Script).
 *
 * 1) Receives study submissions and emails them to the researcher (doPost).
 * 2) Serves the researcher admin panel: email + password, then a 6-digit code
 *    sent by email, then (with the token) the sessions read from this mailbox
 *    (doGet, JSONP).
 *
 * ONE-TIME SETUP
 *  - Project Settings > Script properties, add:
 *        TOKEN = <the token the study expects>
 *  - Set the admin password: edit setupAdminPassword() below, run it once in the
 *    editor, then delete the plain password from the function.
 *  - Deploy: New deployment > Web app > Execute as: Me > Anyone.
 *
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */

var TO = "arditceno82@gmail.com";
var ADMIN_EMAIL = "arditceno82@gmail.com";

/* Expected submission token. The study sends this exact value. Override it by
   adding a Script property TOKEN if you want to change/rotate it. */
var EXPECTED_TOKEN = "ncid_k9f3Xq2Lm7Pz";

/* ===================================================================
   FJALEKALIMI I ADMINIT - ndrysho VETEM rreshtin poshte.
   Vendos fjalekalimin mes thonjezave, p.sh.  var ADMIN_PASSWORD = "Ardit2026!";
   (Nese e lesh "" bosh, perdoret property ADMIN_PASSWORD / ADMIN_PASSWORD_HASH.)
   =================================================================== */
var ADMIN_PASSWORD = "";

/* ============================ Submissions ============================ */

function token_() {
  return PropertiesService.getScriptProperties().getProperty("TOKEN") || EXPECTED_TOKEN;
}

function doPost(e) {
  var data = {};
  try {
    if (e && e.parameter && e.parameter.payload) data = JSON.parse(e.parameter.payload);
    else if (e && e.postData && e.postData.contents) data = JSON.parse(e.postData.contents);
  } catch (err) {}
  return htmlResult(submitAndEmail(data));
}

/** Stable id for one report (retries/resends reuse it). */
function submissionKey_(data, s) {
  var sid = (data && data.submission_id) || (s && s.submission_id) || "";
  return String(sid).slice(0, 120);
}

/** One email per participant: a sent marker blocks every retry. */
function alreadySent_(sid, id) {
  var props = PropertiesService.getScriptProperties();
  if (sid && props.getProperty("sent_" + sid)) return true;
  if (id && id !== "?") {
    var perId = props.getProperty("sent_id_" + id);
    if (perId) return true;
  }
  return false;
}

function markSent_(sid, id) {
  var props = PropertiesService.getScriptProperties();
  var at = String(new Date().getTime());
  if (sid) props.setProperty("sent_" + sid, at);
  if (id && id !== "?") props.setProperty("sent_id_" + id, at);
}

/** Send the report email; return a real {ok} / {error} the page can read. */
function submitAndEmail(data) {
  var expected = token_();
  if (!expected || String(data.token || "") !== expected) return { ok: false, error: "forbidden" };
  var s = data.summary || data;
  var identity = data.identity || {};
  var id = (s.participant && s.participant.id_anonim) || data.id_anonim || identity.id_anonim || "?";
  var sid = submissionKey_(data, s);

  // Serialize duplicate requests and check the durable "already sent" markers.
  var lock = LockService.getScriptLock();
  var locked = false;
  try { locked = lock.tryLock(15000); } catch (e) { locked = false; }
  if (!locked) return { ok: false, error: "busy" };
  try {
    if (alreadySent_(sid, id)) return { ok: true, duplicate: true };
    MailApp.sendEmail({
      to: TO,
      subject: "NCID " + (data.kind || s.kind || "session") + " - " + id,
      htmlBody: tableHTML(s, identity) + dataBlock(s, identity),
      body: "New NCID submission (" + id + ")"
    });
    markSent_(sid, id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
  }
}

/** HTML reply that messages the result back to the study page (hidden iframe post). */
function htmlResult(obj) {
  var json = JSON.stringify(obj);
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
    '<script>(function(){try{var r=' + json + ';if(window.parent){window.parent.postMessage({ncid:true,result:r},"*");}}catch(e){}})();<\/script>' +
    'done</body></html>';
  return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
}

/* Hidden, machine-readable copy of the submission (base64, no raw gaze). */
function dataBlock(s, identity) {
  try {
    var lean = {
      kind: s.kind || "session",
      participant: s.participant || {},
      identity: identity || {},
      session: s.session || {},
      modules: s.modules || [],
      biometric_metrics: s.biometric_metrics || {},
      quiz_results: s.quiz_results || {},
      exported_at: s.exported_at || ""
    };
    var b64 = Utilities.base64Encode(JSON.stringify(lean), Utilities.Charset.UTF_8);
    return '<div id="ncid-data" data-b64="' + b64 + '" style="display:none"></div>';
  } catch (err) {
    return "";
  }
}

/* ============================ Admin API (JSONP) ============================ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    switch (p.action) {
      case "login": out = adminLogin(p.email, p.password); break;
      case "verify": out = adminVerify(p.email, p.code); break;
      case "data": out = adminData(p.token); break;
      default: out = { ok: true, service: "ncid" };
    }
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  var txt = JSON.stringify(out);
  if (p.callback) {
    return ContentService.createTextOutput(p.callback + "(" + txt + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json(out);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function hashPassword(pw) {
  var salt = PropertiesService.getScriptProperties().getProperty("ADMIN_SALT") || "";
  return sha256(salt + ":" + pw);
}

function sha256(text) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ("0" + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join("");
}

/* Run ONCE from the editor: paste your password below, run, then delete it. */
function setupAdminPassword() {
  var pw = "NDRYSHO_KETE_FJALEKALIM";
  var props = PropertiesService.getScriptProperties();
  props.setProperty("ADMIN_SALT", Utilities.getUuid());
  props.setProperty("ADMIN_PASSWORD_HASH", hashPassword(pw));
  Logger.log("Admin password set.");
}

/* Password check: uses a salted hash (ADMIN_PASSWORD_HASH) if set, otherwise a
   plain ADMIN_PASSWORD script property. Both live only in Script properties. */
function adminPasswordOk(password) {
  password = String(password || "");
  if (ADMIN_PASSWORD) return password === ADMIN_PASSWORD;   // set at the top of this file
  var props = PropertiesService.getScriptProperties();
  var hash = props.getProperty("ADMIN_PASSWORD_HASH");
  if (hash) return hashPassword(password) === hash;
  var plain = props.getProperty("ADMIN_PASSWORD");
  if (plain) return password === plain;
  return false;
}

function adminLogin(email, password) {
  email = String(email || "").toLowerCase();
  if (email !== ADMIN_EMAIL) return { ok: false, error: "not_allowed" };
  if (!adminPasswordOk(password)) return { ok: false, error: "bad_password" };
  var cache = CacheService.getScriptCache();
  var rk = "rl_" + email;
  var n = Number(cache.get(rk) || 0);
  if (n >= 6) return { ok: false, error: "rate_limited" };
  cache.put(rk, String(n + 1), 900);                 // 6 codes / 15 min

  var code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put("code_" + email, code, 300);             // valid 5 min
  cache.put("att_" + email, "0", 300);
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "NCID admin code: " + code,
    body: "Your admin login code is " + code + " (valid 5 minutes)."
  });
  return { ok: true };
}

function adminVerify(email, code) {
  email = String(email || "").toLowerCase();
  if (email !== ADMIN_EMAIL) return { ok: false, error: "not_allowed" };
  var cache = CacheService.getScriptCache();
  var stored = cache.get("code_" + email);
  if (!stored) return { ok: false, error: "expired" };
  var att = Number(cache.get("att_" + email) || 0);
  if (att >= 6) { cache.remove("code_" + email); return { ok: false, error: "too_many" }; }
  if (String(code || "") !== stored) {
    cache.put("att_" + email, String(att + 1), 300);
    return { ok: false, error: "bad_code" };
  }
  var token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  cache.put("tok_" + token, email, 21600);           // 6 hours
  cache.remove("code_" + email);
  return { ok: true, token: token };
}

function adminData(token) {
  var cache = CacheService.getScriptCache();
  var email = cache.get("tok_" + String(token || ""));
  if (!email) return { ok: false, error: "unauthorized" };
  var cached = cache.get("data_" + email);
  if (cached) return { ok: true, sessions: JSON.parse(cached), cached: true };
  var sessions = readMailbox(200);
  try { cache.put("data_" + email, JSON.stringify(sessions), 120); } catch (e) {}
  return { ok: true, sessions: sessions };
}

/* ============================ Mailbox -> records ============================ */

function readMailbox(limit) {
  var out = [];
  var threads = GmailApp.search('subject:"NCID"', 0, limit || 200);
  for (var i = 0; i < threads.length; i++) {
    var msgs = threads[i].getMessages();
    for (var j = 0; j < msgs.length; j++) {
      var m = msgs[j];
      var subject = m.getSubject() || "";
      if (subject.indexOf("NCID admin") >= 0) continue;
      var body = m.getBody() || "";
      var rec = parseEmbedded(body, subject) || parseTables(body, subject);
      if (rec && rec.id) {
        rec.created_at = rec.created_at || (m.getDate ? m.getDate().toISOString() : "");
        out.push(rec);
      }
    }
  }
  out.sort(function (a, b) { return String(b.created_at || "").localeCompare(String(a.created_at || "")); });
  return out;
}

function parseEmbedded(body, subject) {
  var m = body.match(/id="ncid-data"[^>]*data-b64="([A-Za-z0-9+/=]+)"/);
  if (!m) return null;
  var data;
  try { data = JSON.parse(Utilities.newBlob(Utilities.base64Decode(m[1])).getDataAsString()); }
  catch (e) { return null; }
  var p = data.participant || {}, id = data.identity || {}, s = data.session || {}, q = data.quiz_results || {};
  return {
    id: p.id_anonim || "",
    id_anonim: p.id_anonim || "",
    name: id.emri_mbiemer || p.emri_mbiemer || "",
    created_at: data.exported_at || "",
    payload: data
  };
}

function stripTags_(frag) {
  return String(frag).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function parseTables(body, subject) {
  var labels = { "Name and surname": 1, "ID": 1, "Profession": 1, "Expertise": 1, "Age": 1, "Type": 1, "Session no": 1, "Calibration px": 1, "Duration min": 1, "Browser": 1, "Device": 1, "Language": 1, "Method": 1, "Accuracy %": 1, "Date": 1 };
  var ident = {}, answers = [], tlx = [], bio = {};
  var rows = body.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (var i = 0; i < rows.length; i++) {
    var cells = [];
    var tds = rows[i].match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
    for (var k = 0; k < tds.length; k++) cells.push(stripTags_(tds[k]));
    if (cells.length === 2 && labels[cells[0]]) ident[cells[0]] = cells[1];
    else if (cells.length === 5 && cells[0] !== "Level") answers.push({ level: cells[0], version: cells[1], question: cells[2], chosen: cells[3], correct: cells[4] });
    else if (cells.length === 8 && cells[0] !== "Module") tlx.push({ module: cells[0], mental: cells[1], physical: cells[2], temporal: cells[3], performance: cells[4], effort: cells[5], frustration: cells[6], preference: cells[7] });
    else if (cells.length === 2 && /(mean|duration|regression|blink|fixation|completion|reading|head)/i.test(cells[0])) bio[cells[0]] = cells[1];
  }
  if (!ident["ID"]) return null;
  var byLV = {};
  answers.forEach(function (a) { var k = a.level + "|" + a.version; (byLV[k] = byLV[k] || []).push(a); });
  var modules = Object.keys(byLV).map(function (k) {
    var arr = byLV[k];
    var resp = arr.map(function (r) { return { zgjedhja: r.chosen, "e_saktë": /yes/i.test(r.correct) }; });
    var qitem = arr.map(function (r) { return { pyetja: r.question }; });
    var c = resp.filter(function (r) { return r["e_saktë"]; }).length;
    return { module_id: arr[0].level, fusha: ident["Profession"], nasa_tlx: null,
      trials: [{ versioni: arr[0].version, module_id: arr[0].level, quiz_item: qitem, response: resp, accuracy_score_pct: resp.length ? Math.round(c / resp.length * 1000) / 10 : 0 }] };
  });
  var payload = {
    kind: ident["Type"] || "session",
    participant: { id_anonim: ident["ID"] || "", emri_mbiemer: ident["Name and surname"] || "", profesioni: ident["Profession"] || "", "niveli_i_ekspertizës": ident["Expertise"] || "", mosha: ident["Age"] || "" },
    session: { session_number: ident["Session no"], kalibrimi_px: ident["Calibration px"], "kohëzgjatja_min": ident["Duration min"], shfletuesi: ident["Browser"], pajisja: ident["Device"], gjuha: ident["Language"], metoda: ident["Method"] },
    modules: modules, nasa_tlx: tlx, biometric_metrics: bio,
    quiz_results: { accuracy_score_pct: ident["Accuracy %"] },
    exported_at: ident["Date"] || ""
  };
  return { id: ident["ID"], id_anonim: ident["ID"], name: ident["Name and surname"] || "", created_at: ident["Date"] || "", payload: payload };
}

/* ============================ Email body ============================ */

function esc(x) {
  return String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tableHTML(s, identity) {
  var p = s.participant || {};
  var id = identity || {};
  var q = s.quiz_results || {};
  var meta = s.session || {};
  var bio = s.biometric_metrics || {};
  var h = "<h2>NCID " + esc(s.kind || "session") + "</h2>";

  h += "<table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px'>";
  var ident = [
    ["Name and surname", id.emri_mbiemer || p.emri_mbiemer || p["em\u00ebr_mbiem\u00ebr"]],
    ["ID", p.id_anonim],
    ["Profession", p.profesioni],
    ["Expertise", p["niveli_i_ekspertiz\u00ebs"]],
    ["Age", p.mosha],
    ["Type", s.kind],
    ["Session no", meta.session_number],
    ["Calibration px", meta["kalibrimi_px"]],
    ["Duration min", meta["koh\u00ebzgjatja_min"]],
    ["Browser", meta.shfletuesi],
    ["Device", meta.pajisja],
    ["Language", meta.gjuha],
    ["Method", meta.metoda],
    ["Accuracy %", q.accuracy_score_pct],
    ["Date", s.exported_at]
  ];
  ident.forEach(function (r) {
    h += "<tr><td><b>" + esc(r[0]) + "</b></td><td>" + esc(r[1]) + "</td></tr>";
  });
  h += "</table>";

  var mods = s.modules || [];
  if (mods.length) {
    h += "<h3>Results by level and version</h3>";
    h += "<table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px'>";
    h += "<tr><th>Level</th><th>Version</th><th>Accuracy %</th><th>Fixation ms</th><th>Regressions</th><th>TTFF ms</th><th>Reading s</th></tr>";
    mods.forEach(function (m) {
      (m.trials || []).forEach(function (t) {
        h += "<tr><td>" + esc(m.module_id) + "</td><td>" + esc(t.versioni) + "</td><td>" + esc(t.accuracy_score_pct) +
          "</td><td>" + esc(t.fixation_duration_ms) + "</td><td>" + esc(t.regresione) +
          "</td><td>" + esc(t.TTFF_ms) + "</td><td>" + esc(t.koha_e_leximit_s) + "</td></tr>";
      });
    });
    h += "</table>";

    h += "<h3>Answers</h3>";
    h += "<table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px'>";
    h += "<tr><th>Level</th><th>Version</th><th>Question</th><th>Chosen</th><th>Correct</th></tr>";
    mods.forEach(function (m) {
      (m.trials || []).forEach(function (t) {
        var qs = t.quiz_item || [];
        (t.response || []).forEach(function (r, i) {
          var qq = qs[i] || {};
          h += "<tr><td>" + esc(m.module_id) + "</td><td>" + esc(t.versioni) + "</td><td>" + esc(qq.pyetja) +
            "</td><td>" + esc(r.zgjedhja) + "</td><td>" + (r["e_sakt\u00eb"] ? "yes" : "no") + "</td></tr>";
        });
      });
    });
    h += "</table>";
  }

  if (mods.length) {
    h += "<h3>NASA-TLX and preference</h3><table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px'>";
    h += "<tr><th>Module</th><th>Mental</th><th>Physical</th><th>Temporal</th><th>Performance</th><th>Effort</th><th>Frustration</th><th>Preference</th></tr>";
    mods.forEach(function (m) {
      var t = m.nasa_tlx || {};
      h += "<tr><td>" + esc(m.module_id) + "</td><td>" + esc(t.mental) + "</td><td>" + esc(t.physical) +
        "</td><td>" + esc(t.temporal) + "</td><td>" + esc(t.performance) + "</td><td>" + esc(t.effort) +
        "</td><td>" + esc(t.frustration) + "</td><td>" + esc(m.preference || "") + "</td></tr>";
    });
    h += "</table>";
  }

  h += "<h3>Biometrics and timing</h3><table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px'>";
  [["Fixation duration (ms)", bio.fixation_duration_ms],
   ["Saccadic regressions", bio.saccadic_regressions],
   ["Time to first fixation (ms)", bio.time_to_first_fixation_ms],
   ["Task completion time (s)", bio.task_completion_time_s],
   ["Reading time (s)", bio.reading_time_s],
   ["Blink rate / min", bio.blink_rate_per_min],
   ["Head yaw (mean)", (bio.head_pose || {}).yaw_mean],
   ["Head pitch (mean)", (bio.head_pose || {}).pitch_mean],
   ["Head roll (mean)", (bio.head_pose || {}).roll_mean]
  ].forEach(function (r) { h += "<tr><td><b>" + esc(r[0]) + "</b></td><td>" + esc(r[1]) + "</td></tr>"; });
  h += "</table>";

  return h;
}
