/*
 * Report: PDF (with node map + hashmap) and email delivery.
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */
import { CONFIG } from "./config.js";
import { loadScript } from "./utils.js";
import { flatten, layoutTree } from "./visualize.js";

async function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  await loadScript(CONFIG.cdn.jsPDF);
  return window.jspdf && window.jspdf.jsPDF;
}

/** Draw a metrics chart (accuracy vs fixation) and return a PNG data URL. */
export function chartDataURL(summary) {
  const mods = summary.modules || [];
  const labels = [], acc = [], fd = [];
  mods.forEach((m) => (m.trials || []).forEach((t) => {
    labels.push(`${m.niveli || ""} ${t.versioni || ""}`.trim());
    acc.push(t.accuracy_score_pct || 0);
    fd.push(t.fixation_duration_ms || 0);
  }));
  const W = 620, H = 240, pad = 44, n = Math.max(1, labels.length);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#c9c9c2"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(pad, 10); g.lineTo(pad, H - pad); g.lineTo(W - 10, H - pad); g.stroke();
  const bw = (W - pad - 20) / n;
  const maxFd = Math.max(1, ...fd);
  const plot = H - pad - 30;
  labels.forEach((l, i) => {
    const x = pad + i * bw;
    const hA = (acc[i] / 100) * plot;
    g.fillStyle = "#0E7FB0"; g.fillRect(x + bw * 0.14, H - pad - hA, bw * 0.32, hA);
    const hF = (fd[i] / maxFd) * plot;
    g.fillStyle = "#FF6E42"; g.fillRect(x + bw * 0.54, H - pad - hF, bw * 0.32, hF);
    g.fillStyle = "#333"; g.font = "9px sans-serif";
    g.fillText(String(l).slice(0, 12), x + 2, H - pad + 13);
  });
  g.fillStyle = "#0E7FB0"; g.fillRect(pad, H - 18, 10, 10);
  g.fillStyle = "#FF6E42"; g.fillRect(pad + 120, H - 18, 10, 10);
  g.fillStyle = "#333"; g.font = "10px sans-serif";
  g.fillText("Accuracy %", pad + 14, H - 9);
  g.fillText("Fixation (ms)", pad + 134, H - 9);
  g.fillStyle = "#111"; g.font = "bold 11px sans-serif";
  g.fillText("Metrics by level / version", pad, 14);
  return c.toDataURL("image/png");
}

export async function buildReportPDF(summary) {
  const JsPDF = await loadJsPDF();
  if (!JsPDF) throw new Error("jsPDF not available");
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const W = 595, M = 40;
  let y = M;

  const line = (t, size, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.text(String(t), M, y);
    y += size + 6;
  };

  line("Neuro-Cognitive Information Design", 18, true);
  line("Session report", 12);
  y += 6;
  const p = summary.participant || {};
  line(`ID: ${p.id_anonim || "-"}   Profession: ${p.profesioni || "-"}   Expertise: ${p["niveli_i_ekspertizës"] || "-"}`, 11);
  line(`Age: ${p.mosha || "-"}   Date: ${summary.exported_at || ""}`, 11);
  y += 8;

  // ---- Chart ----
  line("Metrics", 13, true);
  try {
    const chart = chartDataURL(summary);
    const cw = W - 2 * M;
    doc.addImage(chart, "PNG", M, y, cw, cw * 0.38);
    y += cw * 0.38 + 16;
  } catch (e) { /* chart optional */ }
  if (y > 700) { doc.addPage(); y = M; }

  // ---- Node map ----
  line("Node map", 13, true);
  const { nodes, edges } = layoutTree(summary);
  const XS = 120, YS = 26, ox = M, oy = y + 6;
  const pos = nodes.map((n, i) => ({ x: ox + n.depth * XS, y: oy + i * YS }));
  doc.setDrawColor(160); doc.setLineWidth(0.6);
  edges.forEach(([a, b]) => doc.line(pos[a].x + 92, pos[a].y + 6, pos[b].x, pos[b].y + 6));
  doc.setFontSize(8);
  nodes.forEach((n, i) => {
    if (pos[i].y > 790) return;
    doc.setDrawColor(180); doc.roundedRect(pos[i].x, pos[i].y, 92, 14, 3, 3);
    doc.setTextColor(30);
    doc.text(String(n.label).slice(0, 22), pos[i].x + 4, pos[i].y + 10);
  });
  doc.setTextColor(0);
  y = oy + nodes.length * YS + 16;
  if (y > 760) { doc.addPage(); y = M; }

  // ---- Hashmap ----
  line("Hashmap (key → value)", 13, true);
  doc.setFontSize(8.5);
  const rows = flatten(summary);
  for (const [k, v] of rows) {
    const text = `${k}: ${String(v)}`;
    if (y > 800) { doc.addPage(); y = M; }
    doc.text(text.slice(0, 110), M, y);
    y += 11;
  }
  return doc;
}

export async function downloadReport(summary) {
  const doc = await buildReportPDF(summary);
  doc.save(`NCID_${(summary.participant || {}).id_anonim || "session"}.pdf`);
}

/** Build an HTML table (rows) for the email, from a session/registration summary. */
export function emailTableHTML(summary) {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const p = summary.participant || {};
  const q = summary.quiz_results || {};
  const head = [
    ["ID", p.id_anonim || ""],
    ["Profession", p.profesioni || ""],
    ["Expertise", p["niveli_i_ekspertizës"] || ""],
    ["Age", p.mosha || ""],
    ["Type", summary.kind || "session"],
    ["Accuracy %", q.accuracy_score_pct != null ? q.accuracy_score_pct : ""],
    ["Date", summary.exported_at || ""]
  ];
  let html = '<h2>NCID ' + esc(summary.kind || "session") + '</h2>';
  html += '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">';
  head.forEach((r) => { html += '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td></tr>'; });
  html += '</table>';

  const mods = summary.modules || [];
  if (mods.length) {
    html += '<h3>Results by level and version</h3>';
    html += '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">';
    html += '<tr><th>Field</th><th>Level</th><th>Version</th><th>Accuracy %</th><th>Fixation ms</th><th>Regressions</th><th>TTFF ms</th><th>Reading s</th></tr>';
    mods.forEach((m) => (m.trials || []).forEach((t) => {
      html += '<tr><td>' + esc(m.fusha) + '</td><td>' + esc(m.niveli) + '</td><td>' + esc(t.versioni) +
        '</td><td>' + esc(t.accuracy_score_pct) + '</td><td>' + esc(t.fixation_duration_ms) +
        '</td><td>' + esc(t.regresione) + '</td><td>' + esc(t.TTFF_ms) + '</td><td>' + esc(t.koha_e_leximit_s) + '</td></tr>';
    }));
    html += '</table>';

    html += '<h3>Answers</h3>';
    html += '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">';
    html += '<tr><th>Level</th><th>Version</th><th>Question</th><th>Chosen</th><th>Correct</th></tr>';
    mods.forEach((m) => (m.trials || []).forEach((t) => {
      const qs = t.quiz_item || [];
      (t.response || []).forEach((r, i) => {
        const qq = qs[i] || {};
        html += '<tr><td>' + esc(m.niveli) + '</td><td>' + esc(t.versioni) + '</td><td>' + esc(qq.pyetja) +
          '</td><td>' + esc(r.zgjedhja) + '</td><td>' + (r["e_saktë"] ? "yes" : "no") + '</td></tr>';
      });
    }));
    html += '</table>';
  }
  return html;
}

/** Send the report to the researcher's email (EmailJS). Returns a status object. */
export async function emailReport(summary) {
  const e = CONFIG.email || {};
  const cfg = e.emailjs || {};
  if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) return { ok: false, skipped: true };
  try {
    if (!window.emailjs) await loadScript(CONFIG.cdn.emailjs);
    const emailjs = window.emailjs;
    if (!emailjs) return { ok: false, error: "emailjs not loaded" };
    const params = {
      to_email: e.to,
      subject: `NCID ${summary.kind || "session"} ${(summary.participant || {}).id_anonim || ""}`,
      message: `Profession: ${(summary.participant || {}).profesioni || ""} | Accuracy: ${(summary.quiz_results || {}).accuracy_score_pct || ""}%`,
      html: emailTableHTML(summary),
      summary_json: JSON.stringify(summary)
    };
    const res = await emailjs.send(cfg.serviceId, cfg.templateId, params, { publicKey: cfg.publicKey });
    return { ok: true, status: res && res.status };
  } catch (err) {
    return { ok: false, error: String((err && err.text) || err) };
  }
}

export function emailConfigured() {
  const c = (CONFIG.email || {}).emailjs || {};
  return !!(c.publicKey && c.serviceId && c.templateId);
}
