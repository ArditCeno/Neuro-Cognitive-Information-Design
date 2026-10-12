/*
 * NCID Admin — researcher dashboard (no login for now).
 * Reads sessions directly from Supabase, groups them by profession,
 * shows answers, a profession map (tests vs comprehension), heatmaps.
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var sb = null;
  var rows = [];
  var fields = [];

  function cfg() { return window.__cfg || { supabase: null, fields: [] }; }
  function note(t) { var e = $("panelMsg"); if (e) e.textContent = t; }
  function parse(r) { var p = r.payload; if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) { p = {}; } } return p || {}; }
  function fieldName(id) { for (var i = 0; i < fields.length; i++) if (fields[i].id === id) return fields[i].name.en; return id || "unknown"; }
  function acc(r) { var p = parse(r); var m = (p.modules || []).map(function (x) { return x.trials || []; }); var all = [].concat.apply([], m); if (!all.length) return null; var c = 0, n = 0;
    all.forEach(function (t) { if (t.accuracy_score_pct != null) { c += t.accuracy_score_pct; n++; } }); return n ? Math.round(c / n) : null; }

  function init() {
    var c = cfg();
    fields = c.fields || [];
    if (!window.supabase) { note("supabase-js not loaded"); return; }
    if (!c.supabase || !c.supabase.url) { note("Supabase not configured."); return; }
    sb = window.supabase.createClient(c.supabase.url, c.supabase.anonKey);

    $("btnReload").addEventListener("click", load);
    $("btnFind").addEventListener("click", find);
    $("q").addEventListener("input", renderRows);
    $("q").addEventListener("keydown", function (e) { if (e.key === "Enter") find(); });
    $("btnCsv").addEventListener("click", csv);
    $("btnCloseDetail").addEventListener("click", function () { $("detail").classList.remove("open"); });
    $("detail").addEventListener("click", function (e) { if (e.target.id === "detail") $("detail").classList.remove("open"); });
    load();
  }

  async function load() {
    note("Loading…");
    var res = await sb.from("sessions").select("id,id_anonim,payload,created_at").order("created_at", { ascending: false }).limit(1000);
    if (res.error) { note("Error: " + res.error.message); return; }
    rows = (res.data || []).map(function (r) { return { id: r.id, id_anonim: r.id_anonim, created_at: r.created_at, payload: parse(r) }; });
    note(rows.length + " records");
    renderStats(); renderProfs(); renderScatter(); renderRows();
  }

  async function find() {
    var q = $("q").value.trim();
    if (!q) return;
    var isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    if (!isUuid) { renderRows(); return; }
    note("Searching by UUID…");
    var res = await sb.from("sessions").select("id,id_anonim,payload,created_at").eq("id", q).limit(1);
    if (res.error) { note("Error: " + res.error.message); return; }
    if (res.data && res.data[0]) { showDetail({ id: res.data[0].id, id_anonim: res.data[0].id_anonim, created_at: res.data[0].created_at, payload: parse(res.data[0]) }); note("Found 1"); }
    else note("Not found");
  }

  function filtered() {
    var q = $("q").value.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(function (r) { return [r.id, r.id_anonim, JSON.stringify(r.payload)].join(" ").toLowerCase().indexOf(q) >= 0; });
  }

  function grouped() {
    var g = {};
    rows.forEach(function (r) {
      var p = r.payload || {};
      var fid = (p.participant && p.participant.fusha) || (p.modules && p.modules[0] && p.modules[0].fusha) || "unknown";
      (g[fid] = g[fid] || []).push(r);
    });
    return g;
  }

  function renderStats() {
    var g = grouped();
    var parts = {}; var full = 0;
    rows.forEach(function (r) { parts[r.id_anonim] = 1; var p = r.payload || {}; if (p.kind === "session" || (p.modules && p.modules.length)) full++; });
    $("stats").classList.remove("hidden");
    $("stats").innerHTML =
      '<div class="stat"><div class="lbl">Records</div><div class="val">' + rows.length + '</div></div>' +
      '<div class="stat"><div class="lbl">Participants</div><div class="val">' + Object.keys(parts).length + '</div></div>' +
      '<div class="stat"><div class="lbl">Completed tests</div><div class="val">' + full + '</div></div>' +
      '<div class="stat"><div class="lbl">Professions</div><div class="val">' + Object.keys(g).length + '</div></div>';
  }

  function renderProfs() {
    var g = grouped();
    var box = $("profs"); box.innerHTML = "";
    Object.keys(g).forEach(function (fid) {
      var list = g[fid];
      var sessions = list.filter(function (r) { var p = r.payload || {}; return p.kind === "session" || (p.modules && p.modules.length); });
      var accs = sessions.map(acc).filter(function (a) { return a != null; });
      var avg = accs.length ? Math.round(accs.reduce(function (a, b) { return a + b; }, 0) / accs.length) : 0;
      var card = document.createElement("div");
      card.className = "prof";
      var rowsHtml = list.slice(0, 40).map(function (r) {
        var p = r.payload || {};
        var ans = [];
        (p.modules || []).forEach(function (m) {
          (m.trials || []).forEach(function (t) {
            var chosen = (t.response || []).map(function (x) { return x.zgjedhja; }).filter(Boolean).join(" / ");
            if (chosen) ans.push((m.niveli ? m.niveli + " " : "") + t.versioni + ": " + chosen);
          });
        });
        return '<tr><td>' + (r.id_anonim || "") + '</td><td>' + (p.kind || "session") + '</td><td>' + (acc(r) == null ? "-" : acc(r)) + '</td><td class="ans">' + (ans.join(" | ").slice(0, 140) || "-") + '</td></tr>';
      }).join("");
      card.innerHTML = '<h3>' + fieldName(fid) + '</h3><div class="sub">' + sessions.length + ' completed | avg comprehension ' + avg + '%</div>' +
        '<table><thead><tr><th>ID</th><th>kind</th><th>%</th><th>answers</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>';
      box.appendChild(card);
    });
  }

  function renderScatter() {
    var g = grouped();
    var points = Object.keys(g).map(function (fid) {
      var sessions = g[fid].filter(function (r) { var p = r.payload || {}; return p.kind === "session" || (p.modules && p.modules.length); });
      var accs = sessions.map(acc).filter(function (a) { return a != null; });
      var avg = accs.length ? Math.round(accs.reduce(function (a, b) { return a + b; }, 0) / accs.length) : 0;
      return { label: fieldName(fid), x: sessions.length, y: avg };
    }).filter(function (p) { return p.x > 0; });
    if (!points.length) { $("scatter").textContent = "No completed tests yet."; return; }
    if (window.__viz && window.__viz.renderScatter) window.__viz.renderScatter($("scatter"), points);
  }

  function renderRows() {
    var tbody = $("rows"); tbody.innerHTML = "";
    filtered().slice(0, 500).forEach(function (r) {
      var p = r.payload || {};
      var fid = (p.participant && p.participant.fusha) || (p.modules && p.modules[0] && p.modules[0].fusha) || "";
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + (r.id || "") + "</td><td>" + (r.id_anonim || "") + "</td><td>" + fieldName(fid) + "</td><td>" + (p.kind || "session") +
        "</td><td>" + (r.created_at ? new Date(r.created_at).toLocaleString() : "-") + "</td><td>" + (acc(r) == null ? "-" : acc(r)) + "</td>";
      tr.addEventListener("click", function () { showDetail(r); });
      tbody.appendChild(tr);
    });
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
    var cols = ["id", "id_anonim", "profession", "kind", "created_at", "accuracy_pct"];
    var out = filtered().map(function (r) { var p = r.payload || {}; return {
      id: r.id, id_anonim: r.id_anonim,
      profession: fieldName((p.participant && p.participant.fusha) || ""),
      kind: p.kind || "", created_at: r.created_at, accuracy_pct: (acc(r) == null ? "" : acc(r)) }; });
    var csv = [cols.join(",")].concat(out.map(function (o) { return cols.map(function (c) { return '"' + String(o[c] == null ? "" : o[c]).replace(/"/g, '""') + '"'; }).join(","); })).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "ncid_sessions.csv"; a.click();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
