/*
 * NCID Admin — researcher dashboard.
 * Login restricted to the owner's email (Supabase Auth), search by UUID,
 * full session info + node map + hashmap + gaze heatmap.
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var sb = null;
  var rows = [];
  var allowed = "arditceno82@gmail.com";

  function cfg() { return window.__cfg || { supabase: null, email: allowed }; }
  function note(el, t) { var e = $(el); if (e) e.textContent = t; }
  function parse(r) { var p = r.payload; if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) { p = {}; } } return p || {}; }

  function init() {
    var c = cfg();
    allowed = (c.email || allowed);
    $("email").value = allowed;
    if (!window.supabase) { note("loginMsg", "supabase-js not loaded"); return; }
    if (!c.supabase || !c.supabase.url) { note("loginMsg", "Supabase not configured."); return; }
    sb = window.supabase.createClient(c.supabase.url, c.supabase.anonKey);

    sb.auth.getSession().then(function (res) {
      if (res && res.data && res.data.session) enterPanel();
    });

    $("btnLogin").addEventListener("click", login);
    $("btnLogout").addEventListener("click", logout);
    $("btnReload").addEventListener("click", load);
    $("btnFind").addEventListener("click", find);
    $("q").addEventListener("input", render);
    $("q").addEventListener("keydown", function (e) { if (e.key === "Enter") find(); });
    $("btnCsv").addEventListener("click", csv);
    $("btnCloseDetail").addEventListener("click", function () { $("detail").classList.remove("open"); });
    $("detail").addEventListener("click", function (e) { if (e.target.id === "detail") $("detail").classList.remove("open"); });
  }

  async function login() {
    var email = $("email").value.trim().toLowerCase();
    var password = $("password").value;
    if (email !== allowed.toLowerCase()) { note("loginMsg", "This account is not allowed here."); return; }
    note("loginMsg", "Signing in…");
    var res = await sb.auth.signInWithPassword({ email: email, password: password });
    if (res.error) { note("loginMsg", "Error: " + res.error.message); return; }
    enterPanel();
  }
  async function logout() { try { await sb.auth.signOut(); } catch (e) {} location.reload(); }

  function enterPanel() { $("loginCard").classList.add("hidden"); $("panel").classList.remove("hidden"); load(); }

  async function load() {
    note("panelMsg", "Loading…");
    var res = await sb.from("sessions").select("id,id_anonim,payload,created_at").order("created_at", { ascending: false }).limit(500);
    if (res.error) { note("panelMsg", "Error: " + res.error.message); return; }
    rows = (res.data || []).map(function (r) { return { id: r.id, id_anonim: r.id_anonim, created_at: r.created_at, payload: parse(r) }; });
    render(); stats();
    note("panelMsg", rows.length + " records");
  }

  async function find() {
    var q = $("q").value.trim();
    if (!q) return;
    var isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    if (!isUuid) { render(); return; }
    note("panelMsg", "Searching by UUID…");
    var res = await sb.from("sessions").select("id,id_anonim,payload,created_at").eq("id", q).limit(1);
    if (res.error) { note("panelMsg", "Error: " + res.error.message); return; }
    if (res.data && res.data[0]) { showDetail({ id: res.data[0].id, id_anonim: res.data[0].id_anonim, created_at: res.data[0].created_at, payload: parse(res.data[0]) }); note("panelMsg", "Found 1"); }
    else note("panelMsg", "Not found");
  }

  function filtered() {
    var q = $("q").value.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(function (r) {
      return [r.id, r.id_anonim, JSON.stringify(r.payload)].join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }

  function render() {
    var tbody = $("rows"); tbody.innerHTML = "";
    filtered().slice(0, 300).forEach(function (r) {
      var p = r.payload || {};
      var kind = p.kind || ((p.modules && p.modules.length) ? "session" : "");
      var field = (p.participant && p.participant.fusha) || (p.modules && p.modules[0] && p.modules[0].fusha) || "";
      var calib = p.session && p.session.kalibrimi_px;
      var acc = p.quiz_results && p.quiz_results.accuracy_score_pct;
      var calTag = (calib == null) ? '<span class="tag">—</span>' : (calib < 150 ? '<span class="tag ok">' + calib + '</span>' : '<span class="tag bad">' + calib + '</span>');
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + (r.id || "") + "</td><td>" + (r.id_anonim || "") + "</td><td>" + kind + "</td><td>" + field +
        "</td><td>" + (r.created_at ? new Date(r.created_at).toLocaleString() : "—") + "</td><td>" + calTag + "</td><td>" + (acc == null ? "—" : acc) + "</td>";
      tr.addEventListener("click", function () { showDetail(r); });
      tbody.appendChild(tr);
    });
  }

  function stats() {
    var total = rows.length;
    var parts = {}; var full = 0; var bad = 0;
    rows.forEach(function (r) {
      parts[r.id_anonim] = 1;
      var p = r.payload || {};
      if (p.kind === "session" || (p.modules && p.modules.length)) full++;
      if (p.session && p.session.kalibrimi_px >= 150) bad++;
    });
    $("stats").classList.remove("hidden");
    $("stats").innerHTML =
      '<div class="stat"><div class="lbl">Records</div><div class="val">' + total + '</div></div>' +
      '<div class="stat"><div class="lbl">Participants</div><div class="val">' + Object.keys(parts).length + '</div></div>' +
      '<div class="stat"><div class="lbl">Full sessions</div><div class="val">' + full + '</div></div>' +
      '<div class="stat"><div class="lbl">Weak calibration</div><div class="val">' + bad + '</div></div>';
  }

  function showDetail(r) {
    var p = r.payload || {};
    $("detailTitle").textContent = "Session " + (r.id_anonim || r.id);
    $("detailJson").textContent = JSON.stringify(p, null, 2);
    if (window.__viz) {
      try { window.__viz.renderNodeMap($("detailNodeMap"), p); } catch (e) {}
      try { window.__viz.renderHashmap($("detailHashmap"), p); } catch (e) {}
    }
    renderHeat(p);
    $("detail").classList.add("open");
  }

  function renderHeat(p) {
    var el = $("detailHeat"); el.innerHTML = "";
    var gaze = (p.gaze || []).filter(function (s) { return s && (s.dx != null || s.x != null); });
    if (!gaze.length) { el.textContent = "No gaze samples for this record."; return; }
    if (!window.h337) { el.textContent = "Heatmap.js not loaded."; return; }
    var useDoc = gaze.some(function (s) { return s.dx != null; });
    var xs = gaze.map(function (s) { return useDoc ? (s.dx || 0) : (s.x || 0); });
    var ys = gaze.map(function (s) { return useDoc ? (s.dy || 0) : (s.y || 0); });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var W = el.clientWidth || 800, H = el.clientHeight || 320;
    var hm = window.h337.create({ container: el, radius: 24, maxOpacity: .7, blur: .85 });
    var data = gaze.slice(0, 8000).map(function (s) {
      var x = useDoc ? (s.dx || 0) : (s.x || 0), y = useDoc ? (s.dy || 0) : (s.y || 0);
      return { x: Math.round(((x - minX) / ((maxX - minX) || 1)) * (W - 20) + 10), y: Math.round(((y - minY) / ((maxY - minY) || 1)) * (H - 20) + 10), value: 1 };
    });
    hm.setData({ max: 3, data: data });
    el.style.position = "relative";
    el.insertAdjacentHTML("afterbegin", '<div style="position:absolute;z-index:2;padding:6px 10px;color:#fff;font-size:12px">' + (useDoc ? "reading-space (dx/dy)" : "screen-space (x/y)") + " · " + gaze.length + " samples</div>");
  }

  function csv() {
    var cols = ["id", "id_anonim", "created_at", "kind", "field", "calibration_px", "accuracy_pct"];
    var out = filtered().map(function (r) {
      var p = r.payload || {};
      return {
        id: r.id, id_anonim: r.id_anonim, created_at: r.created_at,
        kind: p.kind || "", field: (p.participant && p.participant.fusha) || "",
        calibration_px: (p.session && p.session.kalibrimi_px) || "",
        accuracy_pct: (p.quiz_results && p.quiz_results.accuracy_score_pct) || ""
      };
    });
    var csv = [cols.join(",")].concat(out.map(function (o) {
      return cols.map(function (c) { return '"' + String(o[c] == null ? "" : o[c]).replace(/"/g, '""') + '"'; }).join(",");
    })).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "ncid_sessions.csv"; a.click();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
