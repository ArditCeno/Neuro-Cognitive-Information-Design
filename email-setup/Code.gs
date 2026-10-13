/**
 * NCID email endpoint (Google Apps Script).
 *
 * Sends every submission to the researcher as an HTML table.
 *
 * HOW TO USE
 * 1. Go to https://script.google.com and create a NEW project.
 * 2. Delete the sample code and paste this whole file.
 * 3. Deploy: "Deploy" > "New deployment" > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the "Web app URL" (it ends with /exec).
 * 5. Add it as a GitHub secret named SUBMISSION_URL
 *    (Settings > Secrets and variables > Actions), or put it in js/config.local.js.
 *
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */

var TO = "arditceno82@gmail.com";
var TOKEN = "ncid_k9f3Xq2Lm7Pz";   // must match CONFIG.storage.token in the website

function doPost(e) {
  var data = {};
  try { data = JSON.parse(e.postData.contents); } catch (err) {}
  if (data.token !== TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "forbidden" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var s = data.summary || data;
  var id = (s.participant && s.participant.id_anonim) || data.id_anonim || "?";
  MailApp.sendEmail({
    to: TO,
    subject: "NCID " + (s.kind || "session") + " - " + id,
    htmlBody: tableHTML(s),
    body: "New NCID submission (" + id + ")"
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput("NCID email endpoint is running.");
}

function esc(x) {
  return String(x == null ? "" : x)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tableHTML(s) {
  var p = s.participant || {};
  var q = s.quiz_results || {};
  var h = "<h2>NCID " + esc(s.kind || "session") + "</h2>";

  h += "<table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px'>";
  var ident = [
    ["Name and surname", p.emri_mbiemer || p["em\u00ebr_mbiem\u00ebr"]],
    ["ID", p.id_anonim],
    ["Profession", p.profesioni],
    ["Expertise", p["niveli_i_ekspertiz\u00ebs"]],
    ["Age", p.mosha],
    ["Type", s.kind],
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
        h += "<tr><td>" + esc(m.niveli) + "</td><td>" + esc(t.versioni) + "</td><td>" + esc(t.accuracy_score_pct) +
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
          h += "<tr><td>" + esc(m.niveli) + "</td><td>" + esc(t.versioni) + "</td><td>" + esc(qq.pyetja) +
            "</td><td>" + esc(r.zgjedhja) + "</td><td>" + (r["e_sakt\u00eb"] ? "yes" : "no") + "</td></tr>";
        });
      });
    });
    h += "</table>";
  }
  return h;
}
