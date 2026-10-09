/*
 * NCID Admin dashboard.
 * Talks to the Spring Boot backend (/api) with an X-Admin-Token.
 * The token lives only in sessionStorage for the current tab.
 *
 * Copyright (c) 2025 Ardit Ceno. All rights reserved.
 */

const $ = (id) => document.getElementById(id);
const PAGE = 50;

const state = { base: "", token: "", offset: 0, rows: [], total: null, lastPageFull: false };

function defaultBase() {
  const local = (typeof window !== "undefined" && window.NCID_LOCAL) || {};
  const b = local.storage && local.storage.backend;
  return (b && b.url) ? b.url : "";
}

function headers() {
  return { "Content-Type": "application/json", "X-Admin-Token": state.token };
}

async function api(path, opts = {}) {
  const res = await fetch(state.base.replace(/\/$/, "") + path, {
    ...opts,
    headers: { ...headers(), ...(opts.headers || {}) }
  });
  if (res.status === 401) throw new Error("401 — wrong or missing admin token");
  if (!res.ok) throw new Error(res.status + " " + res.statusText);
  return res.json();
}

function msg(text, ok = true) {
  const el = $("connMsg");
  el.textContent = text;
  el.style.color = ok ? "var(--accent2)" : "var(--danger)";
}

function parsePayload(row) {
  try { return typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload; }
  catch (e) { return {}; }
}

const num = (v) => (v == null ? "—" : v);

function rowCells(row) {
  const p = parsePayload(row);
  const session = p.session || {};
  const modules = p.modules || [];
  const fields = modules.map((m) => m.fusha).join(", ");
  const first = modules[0] ? modules[0].versioni_i_parë : "—";
  const calib = session.kalibrimi_px;
  const acc = (p.quiz_results || {}).accuracy_score_pct;
  const calibTag = calib == null
    ? `<span class="tag">${num(calib)}</span>`
    : (calib < 150 ? `<span class="tag ok">${calib}</span>` : `<span class="tag bad">${calib}</span>`);
  return {
    id: row.id,
    html: `<td>${row.id_anonim || "—"}</td>
           <td>${row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td>
           <td>${fields || "—"}</td>
           <td>${first}</td>
           <td>${calibTag}</td>
           <td>${num(acc)}</td>
           <td><div class="row-btns">
             <button class="btn btn-ghost btn-sm" data-view="${row.id}">View</button>
             <button class="btn btn-danger btn-sm" data-del="${row.id}">Delete</button>
           </div></td>`
  };
}

function renderRows() {
  const filter = $("filter").value.trim().toLowerCase();
  const tbody = $("rows");
  tbody.innerHTML = "";
  const filtered = state.rows.filter((r) => {
    if (!filter) return true;
    const p = parsePayload(r);
    const hay = [r.id_anonim, (p.session || {}).session_number,
      (p.modules || []).map((m) => m.fusha).join(" ")].join(" ").toLowerCase();
    return hay.includes(filter);
  });
  filtered.forEach((row) => {
    const cell = rowCells(row);
    const tr = document.createElement("tr");
    tr.innerHTML = cell.html;
    tr.addEventListener("click", (e) => {
      if (e.target.dataset.view) showDetail(e.target.dataset.view);
      else if (e.target.dataset.del) delSession(e.target.dataset.del);
    });
    tbody.appendChild(tr);
  });
  $("sessionsInfo").textContent = `${filtered.length} shown · page offset ${state.offset}`;
}

async function showDetail(id) {
  try {
    const row = await api("/api/sessions/" + id);
    const p = parsePayload(row);
    $("detailTitle").textContent = "Session " + (row.id_anonim || id);
    $("detailJson").textContent = JSON.stringify(p, null, 2);
    $("detail").classList.add("open");
  } catch (e) { alert("Could not load session: " + e.message); }
}

async function delSession(id) {
  if (!confirm("Delete this session permanently? (GDPR withdrawal)")) return;
  try {
    await api("/api/sessions/" + id, { method: "DELETE" });
    state.rows = state.rows.filter((r) => r.id !== id);
    renderRows();
  } catch (e) { alert("Delete failed: " + e.message); }
}

async function load() {
  state.base = $("backendUrl").value.trim();
  state.token = $("adminToken").value;
  if (!state.base) { msg("Enter the backend URL.", false); return; }
  sessionStorage.setItem("ncid_admin_token", state.token);
  sessionStorage.setItem("ncid_admin_base", state.base);
  msg("Loading…");
  try {
    const stats = await api("/api/stats");
    $("statsBox").classList.remove("hidden");
    $("statsBox").innerHTML = `
      <div class="stat"><div class="lbl">Sessions</div><div class="val">${num(stats.total_sessions)}</div></div>
      <div class="stat"><div class="lbl">Participants</div><div class="val">${num(stats.participants)}</div></div>
      <div class="stat"><div class="lbl">First</div><div class="val" style="font-size:15px">${stats.first_session ? new Date(stats.first_session).toLocaleString() : "—"}</div></div>
      <div class="stat"><div class="lbl">Last</div><div class="val" style="font-size:15px">${stats.last_session ? new Date(stats.last_session).toLocaleString() : "—"}</div></div>`;
    await loadPage(0);
    $("sessionsCard").classList.remove("hidden");
    msg("Connected. Healthy.", true);
  } catch (e) {
    msg("Error: " + e.message, false);
  }
}

async function loadPage(offset) {
  state.offset = Math.max(offset, 0);
  const rows = await api(`/api/sessions?limit=${PAGE}&offset=${state.offset}`);
  state.rows = rows;
  state.lastPageFull = rows.length === PAGE;
  $("pageInfo").textContent = `offset ${state.offset}`;
  renderRows();
}

function exportCsv() {
  const out = state.rows.map((r) => {
    const p = parsePayload(r);
    return {
      id: r.id, id_anonim: r.id_anonim, created_at: r.created_at,
      fields: (p.modules || []).map((m) => m.fusha).join(" "),
      calibration_px: (p.session || {}).kalibrimi_px,
      accuracy_pct: (p.quiz_results || {}).accuracy_score_pct
    };
  });
  const cols = ["id", "id_anonim", "created_at", "fields", "calibration_px", "accuracy_pct"];
  const csv = [cols.join(",")].concat(out.map((o) =>
    cols.map((c) => `"${String(o[c] == null ? "" : o[c]).replace(/"/g, '""')}"`).join(","))).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ncid_sessions.csv";
  a.click();
}

function bind() {
  $("backendUrl").value = sessionStorage.getItem("ncid_admin_base") || defaultBase();
  $("adminToken").value = sessionStorage.getItem("ncid_admin_token") || "";
  $("btnLoad").addEventListener("click", load);
  $("btnReload").addEventListener("click", () => loadPage(state.offset).catch((e) => msg(e.message, false)));
  $("btnPrev").addEventListener("click", () => loadPage(state.offset - PAGE).catch((e) => msg(e.message, false)));
  $("btnNext").addEventListener("click", () => {
    if (!state.lastPageFull) return;
    loadPage(state.offset + PAGE).catch((e) => msg(e.message, false));
  });
  $("filter").addEventListener("input", renderRows);
  $("btnCsv").addEventListener("click", exportCsv);
  $("btnCloseDetail").addEventListener("click", () => $("detail").classList.remove("open"));
  $("detail").addEventListener("click", (e) => { if (e.target.id === "detail") $("detail").classList.remove("open"); });
}

bind();
