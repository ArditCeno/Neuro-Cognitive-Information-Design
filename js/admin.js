/*
 * NCID Admin - researcher dashboard (email mode).
 * Login: email + password, then a 6-digit code sent by email. With the token,
 * the sessions are read from the researcher's mailbox through the Apps Script
 * endpoint. Groups sessions by profession, shows answers and a profession map.
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var rows = [];
  var fields = [];
  var allowed = "arditceno82@gmail.com";
  var TARGET = 10; // minimum completed tests per profession
  var TOKEN_KEY = "ncid_admin_token";
  var email = "";

  function cfg() { return window.__cfg || { fields: [], adminEmail: allowed, submission: null }; }
  function endpoint() { var s = cfg().submission || {}; return s.fallbackUrl || s.url || ""; }
  function note(t) { var e = $("panelMsg"); if (e) e.textContent = t; }
  function loginMsg(t) { var e = $("loginMsg"); if (e) e.textContent = t; }
  function h(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function parse(r) { var p = r.payload; if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) { p = {}; } } return p || {}; }
  function fieldName(id) { for (var i = 0; i < fields.length; i++) if (fields[i].id === id) return fields[i].name.en; return id || "unknown"; }
  function acc(r) {
    var p = parse(r); var m = (p.modules || []).map(function (x) { return x.trials || []; });
    var all = [].concat.apply([], m); if (!all.length) return null;
    var c = 0, n = 0;
    all.forEach(function (t) { if (t.accuracy_score_pct != null) { c += t.accuracy_score_pct; n++; } });
    return n ? Math.round(c / n) : null;
  }
  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }

  /* JSONP: Apps Script web apps cannot be read cross-origin with fetch, but a
     script callback works. */
  function jsonp(params) {
    return new Promise(function (resolve, reject) {
      var base = endpoint();
      if (!base) { reject(new Error("endpoint not configured")); return; }
      var cb = "ncidcb" + Math.random().toString(36).slice(2);
      var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); });
      qs.push("callback=" + cb);
      var s = document.createElement("script");
      var done = false;
      var timer = setTimeout(function () { finish(); reject(new Error("timeout")); }, 30000);
      function finish() { if (done) return; done = true; clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (data) { finish(); resolve(data); };
      s.onerror = function () { finish(); reject(new Error("network")); };
      s.src = base + (base.indexOf("?") >= 0 ? "&" : "?") + qs.join("&");
      document.body.appendChild(s);
    });
  }

  var ERR = {
    not_allowed: "This account is not allowed here.",
    bad_password: "Wrong password.",
    rate_limited: "Too many code requests. Try again in a few minutes.",
    expired: "The code expired. Send a new one.",
    bad_code: "Wrong code.",
    too_many: "Too many attempts. Send a new code.",
    unauthorized: "Session expired. Please sign in again."
  };
  function emsg(code) { return ERR[code] || ("Error: " + code); }

  function init() {
    fields = cfg().fields || [];
    allowed = cfg().adminEmail || allowed;
    email = allowed;

    on("btnLogin", "click", sendCode);
    on("btnVerify", "click", verify);
    on("btnResend", "click", sendCode);
    on("btnLogout", "click", logout);
    on("btnReload", "click", load);
    on("btnFind", "click", find);
    on("q", "input", renderRows);
    on("q", "keydown", function (e) { if (e.key === "Enter") find(); });
    on("btnCsv", "click", csv);
    on("btnCloseDetail", "click", function () { $("detail").classList.remove("open"); });
    on("detail", "click", function (e) { if (e.target.id === "detail") $("detail").classList.remove("open"); });
    on("password", "keydown", function (e) { if (e.key === "Enter") sendCode(); });
    on("code", "keydown", function (e) { if (e.key === "Enter") verify(); });

    var saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) { load(); } else { loginMsg("Enter email and password, then a code is emailed to you."); }
  }

  async function sendCode() {
    var pw = $("password").value;
    if (!pw) { loginMsg("Enter your password."); return; }
    loginMsg("Sending code…");
    try {
      var res = await jsonp({ action: "login", email: email, password: pw });
      if (!res || !res.ok) { loginMsg(emsg(res && res.error)); return; }
      $("codeStep").classList.remove("hidden");
      loginMsg("A 6-digit code was sent to " + email + ".");
      try { $("code").focus(); } catch (e) {}
    } catch (e) { loginMsg("Could not reach the server. Check the endpoint."); }
  }

  async function verify() {
    var code = ($("code").value || "").trim();
    if (!/^\d{6}$/.test(code)) { loginMsg("Enter the 6-digit code."); return; }
    loginMsg("Verifying…");
    try {
      var res = await jsonp({ action: "verify", email: email, code: code });
      if (!res || !res.ok) { loginMsg(emsg(res && res.error)); return; }
      sessionStorage.setItem(TOKEN_KEY, res.token);
      loginMsg("");
      enterPanel();
    } catch (e) { loginMsg("Could not reach the server."); }
  }

  function logout() { sessionStorage.removeItem(TOKEN_KEY); location.reload(); }

  function enterPanel() {
    var lc = $("loginCard"); if (lc) lc.classList.add("hidden");
    var panel = $("panel"); if (panel) panel.classList.remove("hidden");
    load();
    setInterval(function () { if (document.visibilityState === "visible") load(); }, 30000);
  }

  async function load() {
    var token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    note("Loading…");
    var res;
    try { res = await jsonp({ action: "data", token: token }); }
    catch (e) { note("Could not reach the server."); return; }
    if (!res || !res.ok) {
      if (res && res.error === "unauthorized") { sessionStorage.removeItem(TOKEN_KEY); location.reload(); return; }
      note(emsg(res && res.error)); return;
    }
    if ($("loginCard")) $("loginCard").classList.add("hidden");
    if ($("panel")) $("panel").classList.remove("hidden");
    rows = (res.sessions || []).map(function (r) { return { id: r.id || r.id_anonim, id_anonim: r.id_anonim || r.id, name: r.name || "", created_at: r.created_at, payload: parse(r) }; });
    note(rows.length + " records" + (res.cached ? " (cached)" : ""));
    renderStats(); renderProfs(); renderScatter(); renderRows();
  }

  function find() {
    var q = $("q").value.trim();
    if (!q) return;
    var n = filtered().length;
    renderRows();
    note(n + " match(es) for " + q);
    if (n === 1) showDetail(filtered()[0]);
  }

  function filtered() {
    var q = $("q").value.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(function (r) { return [r.id, r.id_anonim, r.name, JSON.stringify(r.payload)].join(" ").toLowerCase().indexOf(q) >= 0; });
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
    var g = grouped(); var parts = {}; var full = 0; var atTarget = 0;
    rows.forEach(function (r) { parts[r.id_anonim] = 1; var p = r.payload || {}; if (p.kind === "session" || (p.modules && p.modules.length)) full++; });
    Object.keys(g).forEach(function (fid) {
      var n = g[fid].filter(function (r) { var p = r.payload || {}; return p.kind === "session" || (p.modules && p.modules.length); }).length;
      if (n >= TARGET) atTarget++;
    });
    $("stats").classList.remove("hidden");
    $("stats").innerHTML =
      '<div class="stat"><div class="lbl">Records</div><div class="val">' + rows.length + '</div></div>' +
      '<div class="stat"><div class="lbl">Participants</div><div class="val">' + Object.keys(parts).length + '</div></div>' +
      '<div class="stat"><div class="lbl">Completed tests</div><div class="val">' + full + '</div></div>' +
      '<div class="stat"><div class="lbl">Target</div><div class="val">' + TARGET + ' / profession</div></div>' +
      '<div class="stat"><div class="lbl">At target</div><div class="val">' + atTarget + ' / ' + Object.keys(g).length + '</div></div>';
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
            if (chosen) ans.push((m.module_id ? m.module_id + " " : "") + t.versioni + ": " + chosen);
          });
        });
        return '<tr><td>' + h(r.id_anonim || "") + '</td><td>' + h(p.kind || "session") + '</td><td>' + (acc(r) == null ? "-" : acc(r)) + '</td><td class="ans">' + h(ans.join(" | ").slice(0, 140) || "-") + '</td></tr>';
      }).join("");
      card.innerHTML = '<h3>' + h(fieldName(fid)) + '</h3><div class="sub">' + sessions.length + ' / ' + TARGET + ' target | avg comprehension ' + avg + '%</div>' +
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
      tr.innerHTML = "<td>" + h(r.id || "") + "</td><td>" + h(r.id_anonim || "") + "</td><td>" + h(r.name || "-") + "</td><td>" + h(fieldName(fid)) + "</td><td>" + h(p.kind || "session") +
        "</td><td>" + h(r.created_at ? new Date(r.created_at).toLocaleString() : "-") + "</td><td>" + (acc(r) == null ? "-" : acc(r)) + "</td>";
      tr.addEventListener("click", function () { showDetail(r); });
      tbody.appendChild(tr);
    });
  }

  function showDetail(r) {
    var p = r.payload || {};
    $("detailTitle").textContent = "Session " + (r.id_anonim || r.id) + (r.name ? " - " + r.name : "");
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
    if (!gaze.length) { el.textContent = "No gaze samples in email mode (raw gaze is not emailed)."; return; }
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
    var cols = ["id_anonim", "name", "profession", "kind", "created_at", "accuracy_pct"];
    var out = filtered().map(function (r) { var p = r.payload || {}; return {
      id_anonim: r.id_anonim, name: r.name || "", profession: fieldName((p.participant && p.participant.fusha) || ""),
      kind: p.kind || "", created_at: r.created_at, accuracy_pct: (acc(r) == null ? "" : acc(r)) }; });
    var csv = [cols.join(",")].concat(out.map(function (o) { return cols.map(function (c) { return '"' + String(o[c] == null ? "" : o[c]).replace(/"/g, '""') + '"'; }).join(","); })).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "ncid_sessions.csv"; a.click();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
