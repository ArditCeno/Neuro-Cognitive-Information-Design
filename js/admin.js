/*
 * NCID Admin dashboard.
 * Login: email + password + 6-digit code (Apps Script JSONP).
 * Data: sessions read from the researcher's mailbox (same emails as the study).
 * UI: stat cards + 12 profession cards (2 columns) with progress rings and a
 * mini A-vs-B chart; click a card to open the profession drawer.
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };

  var fields = [];
  var rows = [];
  var realRows = [];
  var demoOn = false;
  var allowed = "arditceno82@gmail.com";
  var TARGET = 10;
  var TOKEN_KEY = "ncid_admin_token";
  var email = "";
  var lastFocus = null;
  var LOW_ACCURACY_PX = 150;
  var COLORS = ["#0E7FB0", "#FF6E42", "#2F7FA0", "#004E72"];

  function cfg() { return window.__cfg || { fields: [], adminEmail: allowed, submission: null }; }
  function endpoint() { var s = cfg().submission || {}; return s.fallbackUrl || s.url || ""; }
  function note(t) { var e = $("panelMsg"); if (e) e.textContent = t; }
  function loginMsg(t) { var e = $("loginMsg"); if (e) e.textContent = t; }
  function h(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }

  function parse(r) { var p = r && r.payload; if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) { p = {}; } } return p || {}; }
  function profId(p) { return (p.participant && p.participant.fusha) || (p.modules && p.modules[0] && p.modules[0].fusha) || "unknown"; }
  function isSession(p) { return p.kind === "session" || p.kind === "demo" || (p.modules && p.modules.length); }
  function acc(r) {
    var p = parse(r), all = [];
    (p.modules || []).forEach(function (m) { all = all.concat(m.trials || []); });
    var c = 0, n = 0;
    all.forEach(function (t) { if (t.accuracy_score_pct != null) { c += Number(t.accuracy_score_pct); n++; } });
    return n ? Math.round(c / n) : null;
  }
  function calib(r) { var s = parse(r).session || {}; var v = s.kalibrimi_px; return (v == null || v === "" || isNaN(v)) ? null : Math.round(Number(v)); }
  function method(r) { return (parse(r).session || {}).metoda || "-"; }
  function device(r) { return (parse(r).session || {}).pajisja || "-"; }
  function dateOf(r) { return r.created_at ? new Date(r.created_at) : null; }
  function profName(id) { for (var i = 0; i < fields.length; i++) if (fields[i].id === id) return fields[i].name.en; return id; }
  function profColor(id) { var i = 0; for (var k = 0; k < fields.length; k++) if (fields[k].id === id) { i = k; break; } return COLORS[i % COLORS.length]; }
  function avg(a) { if (!a.length) return 0; return Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length); }

  function moduleAvgs(p) {
    var by = {};
    (p.modules || []).forEach(function (m) {
      var mid = String(m.module_id || "?").toUpperCase();
      (m.trials || []).forEach(function (t) {
        by[mid] = by[mid] || { A: [], B: [] };
        if (t.accuracy_score_pct != null) by[mid][t.versioni === "B" ? "B" : "A"].push(Number(t.accuracy_score_pct));
      });
    });
    return by;
  }

  /* ============================ Admin API ============================ */
  function apiBase() {
    var s = cfg().submission || {};
    var u = s.url || "";
    return u.replace(/\/submit\/?$/, "");
  }

  /* Prefer the Worker proxy: the password travels in a POST body, never a
     JSONP URL. Fall back to the legacy JSONP path only if no Worker is set. */
  async function postAdmin(action, params) {
    var base = apiBase();
    if (!base) return jsonp(Object.assign({ action: action }, params));
    var res = await fetch(base + "/admin/" + action, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params || {})
    });
    var data = {};
    try { data = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok) throw new Error(data.error || ("http_" + res.status));
    return data;
  }

  /* Legacy JSONP (only when no Worker URL is configured). */
  function jsonp(params) {
    return new Promise(function (resolve, reject) {
      var base = endpoint();
      if (!base) { reject(new Error("endpoint not configured")); return; }
      var cb = "ncidcb" + Math.random().toString(36).slice(2);
      var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); });
      qs.push("callback=" + cb);
      var s = document.createElement("script");
      var done = false;
      var timer = setTimeout(function () { finish(); reject(new Error("timeout")); }, 35000);
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

  /* ============================ Boot ============================ */
  function init() {
    fields = cfg().fields || [];
    allowed = cfg().adminEmail || allowed;
    email = allowed;

    on("btnLogin", "click", sendCode);
    on("btnVerify", "click", verify);
    on("btnResend", "click", sendCode);
    on("btnLogout", "click", logout);
    on("btnReload", "click", function () { load(); });
    on("btnCsv", "click", csv);
    on("btnSync", "click", syncToD1);
    on("btnDemo", "click", toggleDemo);
    on("q", "input", renderDash);
    on("btnCloseDetail", "click", closeDetail);
    on("detail", "click", function (e) { if (e.target.id === "detail") closeDetail(); });
    on("password", "keydown", function (e) { if (e.key === "Enter") sendCode(); });
    on("code", "keydown", function (e) { if (e.key === "Enter") verify(); });
    document.addEventListener("click", function (e) {
      var card = e.target.closest && e.target.closest(".prof-card");
      if (card) openProfession(card.getAttribute("data-fid"));
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDetail(); });
    document.addEventListener("keydown", function (e) {
      var d = $("detail");
      if (!d || !d.classList.contains("open")) return;
      if (e.key === "Escape") { closeDetail(); return; }
      if (e.key !== "Tab") return;
      var f = d.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    var saved = sessionStorage.getItem(TOKEN_KEY);

    // Demo preview for screenshots/preview only (no login, no real data).
    if (new URLSearchParams(location.search).get("demo") === "1") {
      if ($("loginCard")) $("loginCard").classList.add("hidden");
      if ($("panel")) $("panel").classList.remove("hidden");
      rows = demoRows();
      demoOn = true;
      note("Demo preview — sample data only, not real participants.");
      renderDash();
      return;
    }

    if (saved) load();
    else loginMsg("Enter email and password, then a code is emailed to you.");
  }

  async function sendCode() {
    var pw = $("password").value;
    if (!pw) { loginMsg("Enter your password."); return; }
    loginMsg("Sending code…");
    try {
      var res = await postAdmin("login", { email: email, password: pw });
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
      var res = await postAdmin("verify", { email: email, code: code });
      if (!res || !res.ok) { loginMsg(emsg(res && res.error)); return; }
      sessionStorage.setItem(TOKEN_KEY, res.token);
      loginMsg("");
      enterPanel();
    } catch (e) { loginMsg("Could not reach the server."); }
  }

  function logout() { sessionStorage.removeItem(TOKEN_KEY); location.reload(); }

  async function syncToD1() {
    var token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    if (!window.confirm("Import all mailbox sessions into the D1 database? This is safe to run more than once.")) return;
    note("Syncing to D1…");
    try {
      var res = await postAdmin("sync", { token: token });
      if (!res || !res.ok) { note(emsg(res && res.error)); return; }
      note("D1 sync: " + (res.inserted || 0) + " new, " + (res.duplicate || 0) +
        " skipped" + (res.failed ? ", " + res.failed + " failed" : "") + ".");
      if ((res.total || 0) >= 300) note("Synced the first 300; run again for the rest.");
    } catch (e) {
      note("Sync failed. Try again.");
    }
  }

  function enterPanel() {
    if ($("loginCard")) $("loginCard").classList.add("hidden");
    if ($("panel")) $("panel").classList.remove("hidden");
    load();
    setInterval(function () { if (document.visibilityState === "visible") load(true); }, 60000);
  }

  async function load(silent) {
    var token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    if (!silent) note("Loading…");
    var res;
    try { res = await postAdmin("data", { token: token }); }
    catch (e) { note("Could not reach the server."); return; }
    if (!res || !res.ok) {
      if (res && res.error === "unauthorized") { sessionStorage.removeItem(TOKEN_KEY); location.reload(); return; }
      note(emsg(res && res.error)); return;
    }
    if ($("loginCard")) $("loginCard").classList.add("hidden");
    if ($("panel")) $("panel").classList.remove("hidden");
    realRows = (res.sessions || []).map(function (r) {
      return { id: r.id || r.id_anonim, id_anonim: r.id_anonim || r.id, name: r.name || "", created_at: r.created_at, payload: parse(r) };
    });
    if (!demoOn) rows = realRows;
    note(realRows.length + " records from the mailbox" + (res.cached ? " (cached)" : ""));
    renderDash();
  }

  function toggleDemo() {
    if (!demoOn) { rows = demoRows(); demoOn = true; note("Demo mode — sample data for preview, not real participants."); }
    else { rows = realRows; demoOn = false; note(realRows.length + " records from the mailbox"); }
    renderDash();
  }

  /* ============================ Dashboard ============================ */
  function renderDash() {
    if (!rows.length && !realRows.length) {
      rows = demoRows();
      demoOn = true;
      note("Demo mode — no real sessions yet. Sample data shown for preview.");
    }
    var visible = filteredRows();
    renderStats(visible);
    renderCards(visible);
  }

  function filteredRows() {
    var q = (($("q") && $("q").value) || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(function (r) {
      return [r.id, r.id_anonim, r.name, profName(profId(parse(r))), JSON.stringify(parse(r))].join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderStats(list) {
    var participants = {}, completed = 0, accs = [], atTarget = 0, byProf = {};
    list.forEach(function (r) {
      var p = parse(r);
      participants[r.id_anonim] = 1;
      if (isSession(p)) completed++;
      var a = acc(r); if (a != null) accs.push(a);
      var f = profId(p); byProf[f] = (byProf[f] || 0) + (isSession(p) ? 1 : 0);
    });
    Object.keys(byProf).forEach(function (f) { if (byProf[f] >= TARGET) atTarget++; });
    var avgComp = accs.length ? Math.round(accs.reduce(function (a, b) { return a + b; }, 0) / accs.length) : 0;

    var cards = [
      ["Records", list.length, "all submissions"],
      ["Participants", Object.keys(participants).length, "unique IDs"],
      ["Completed tests", completed, "finished sessions"],
      ["Avg comprehension", avgComp + "%", "across formats"],
      ["At target", atTarget + " / " + (fields.length || 12), "≥ " + TARGET + " per profession"]
    ];
    var el = $("stats");
    if (!el) return;
    el.innerHTML = cards.map(function (c, i) {
      return '<div class="stat-card"><span class="dot" style="background:' + COLORS[i % COLORS.length] + '"></span>' +
        '<div class="lbl">' + h(c[0]) + '</div><div class="val">' + h(c[1]) + '</div><div class="sub">' + h(c[2]) + '</div></div>';
    }).join("");
  }

  function professionStats(fid, list) {
    var sessions = list.filter(function (r) { var p = parse(r); return profId(p) === fid && isSession(p); });
    var parts = {}, accs = [], calibs = [], byMod = {};
    sessions.forEach(function (r) {
      var p = parse(r);
      parts[r.id_anonim] = 1;
      var a = acc(r); if (a != null) accs.push(a);
      var c = calib(r); if (c != null) calibs.push(c);
      var ma = moduleAvgs(p);
      Object.keys(ma).forEach(function (mid) {
        byMod[mid] = byMod[mid] || { A: [], B: [] };
        byMod[mid].A = byMod[mid].A.concat(ma[mid].A);
        byMod[mid].B = byMod[mid].B.concat(ma[mid].B);
      });
    });
    return {
      sessions: sessions, completed: sessions.length, participants: Object.keys(parts).length,
      avgComp: accs.length ? Math.round(accs.reduce(function (a, b) { return a + b; }, 0) / accs.length) : 0,
      avgCalib: calibs.length ? Math.round(calibs.reduce(function (a, b) { return a + b; }, 0) / calibs.length) : null,
      byMod: byMod
    };
  }

  function renderCards(list) {
    var el = $("profs");
    if (!el) return;
    var q = (($("q") && $("q").value) || "").trim().toLowerCase();
    var html = fields.map(function (f) {
      var st = professionStats(f.id, list);
      var match = !q || profName(f.id).toLowerCase().indexOf(q) >= 0 ||
        st.sessions.some(function (r) { return [r.id_anonim, r.name].join(" ").toLowerCase().indexOf(q) >= 0; });
      if (!match) return "";
      return cardHTML(f.id, st);
    }).join("");
    el.innerHTML = html || '<p class="empty">No matching professions.</p>';
  }

  function cardHTML(fid, st) {
    var pct = Math.min(1, st.completed / TARGET);
    var calibTxt = st.avgCalib == null ? "—" : st.avgCalib + " px";
    var low = st.avgCalib != null && st.avgCalib > LOW_ACCURACY_PX;
    var mini = ["M1", "M2", "M3"].map(function (mid) {
      var d = st.byMod[mid] || { A: [], B: [] };
      var a = avg(d.A), b = avg(d.B);
      return '<div class="mini-mod"><div class="t">' + mid + '</div>' +
        '<div class="mini-bars"><span class="a" style="height:' + Math.max(3, a) + '%"></span><span class="b" style="height:' + Math.max(3, b) + '%"></span></div>' +
        '<div class="mini-legend"><i class="a">' + a + '</i><i class="b">' + b + '</i></div></div>';
    }).join("");

    return '<article class="prof-card" data-fid="' + h(fid) + '">' +
      '<div class="prof-head" style="background:linear-gradient(90deg,' + profColor(fid) + '33,transparent)">' +
        '<div class="icon" style="color:' + profColor(fid) + '">' + h(profName(fid).slice(0, 2).toUpperCase()) + '</div>' +
        '<div class="ring">' + ringSVG(pct) + '</div>' +
      '</div>' +
      '<div class="prof-body">' +
        '<h3 class="prof-name">' + h(profName(fid)) + '</h3>' +
        '<div class="prof-meta"><span><b>' + st.completed + '</b> / ' + TARGET + ' completed</span>' +
          '<span><b>' + st.participants + '</b> participants</span>' +
          '<span>avg <b>' + st.avgComp + '%</b></span></div>' +
        '<div class="prof-meta">' +
          '<span class="badge' + (low ? " warn" : "") + '">calib ' + h(calibTxt) + '</span>' +
          '<span class="badge">eye-tracking</span>' +
          (demoOn ? '<span class="badge warn">DEMO</span>' : "") +
        '</div>' +
        '<div class="mini">' + mini + '</div>' +
      '</div>' +
      '<div class="prof-foot"><span class="hint">A vs B per module</span><button class="btn btn-primary btn-sm" type="button">View</button></div>' +
    '</article>';
  }

  function ringSVG(pct) {
    var r = 21, c = 2 * Math.PI * r, off = c * (1 - pct);
    return '<svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label="' + Math.round(pct * 100) + ' percent complete">' +
      '<circle cx="28" cy="28" r="' + r + '" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5"/>' +
      '<circle cx="28" cy="28" r="' + r + '" fill="none" stroke="#FF6E42" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 28 28)"/>' +
      '<text x="28" y="32" text-anchor="middle" font-size="12" font-weight="700" fill="#F9F9F9">' + Math.round(pct * 100) + '%</text></svg>';
  }

  /* ============================ Drawer ============================ */
  function openProfession(fid) {
    var st = professionStats(fid, rows);
    $("detailTitle").textContent = profName(fid);
    var stats = '<div class="detail-stats">' +
      stat("Completed", st.completed + " / " + TARGET, "sessions") +
      stat("Participants", st.participants, "unique") +
      stat("Avg comprehension", st.avgComp + "%", "A and B") +
      stat("Avg calibration", st.avgCalib == null ? "—" : st.avgCalib + " px", "lower is better") +
      '</div>';

    var mods = Object.keys(st.byMod).sort();
    var chart = mods.length ? barChart(mods.map(function (mid) {
      return { label: mid, a: avg(st.byMod[mid].A), b: avg(st.byMod[mid].B) };
    })) : '<p class="empty">No completed tests yet.</p>';

    var sessions = st.sessions.slice().sort(function (a, b) {
      var da = dateOf(a), db = dateOf(b); return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
    });

    var table = '<table class="sessions"><thead><tr><th>ID</th><th>Name</th><th>Date</th><th>Method</th><th>Device</th><th>Calib</th><th>Comp.</th></tr></thead><tbody>' +
      sessions.map(function (r) {
        var c = calib(r);
        return '<tr><td>' + h(r.id_anonim) + '</td><td>' + h(r.name || "-") + '</td>' +
          '<td>' + h(dateOf(r) ? dateOf(r).toLocaleString() : "-") + '</td><td>' + h(method(r)) + '</td><td>' + h(device(r)) + '</td>' +
          '<td>' + (c == null ? "-" : c + " px") + '</td><td>' + (acc(r) == null ? "-" : acc(r) + "%") + '</td></tr>';
      }).join("") + '</tbody></table>';

    var details = sessions.map(function (r) {
      var p = parse(r);
      return '<details class="sess"><summary>' + h(r.id_anonim) + ' · ' + h(r.name || "no name") + ' · ' + (acc(r) == null ? "-" : acc(r) + "%") + '</summary>' +
        answersHTML(p) + tlxHTML(p) + bioHTML(p) + '</details>';
    }).join("");

    $("detailBody").innerHTML =
      stats +
      '<div class="panel"><h3>Comprehension — A vs B</h3>' + chart +
      '<div class="mini-legend" style="margin-top:8px"><i class="a">A structured</i><i class="b">B compressed</i></div></div>' +
      '<div class="panel"><h3>Sessions</h3>' + (sessions.length ? table : '<p class="empty">No sessions yet.</p>') + '</div>' +
      (details ? '<div class="panel"><h3>Answers, NASA-TLX and biometrics</h3>' + details + '</div>' : "");

    var drawer = $("detail");
    lastFocus = document.activeElement;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    var close = $("btnCloseDetail");
    if (close) { try { close.focus(); } catch (e) { /* ignore */ } }
  }

  function stat(lbl, val, sub) {
    return '<div class="stat-card"><div class="lbl">' + h(lbl) + '</div><div class="val">' + h(val) + '</div><div class="sub">' + h(sub) + '</div></div>';
  }

  function answersHTML(p) {
    var out = [];
    (p.modules || []).forEach(function (m) {
      (m.trials || []).forEach(function (t) {
        var qs = t.quiz_item || [];
        (t.response || []).forEach(function (r, i) {
          var q = qs[i] || {};
          out.push('<tr><td>' + h(m.module_id) + '</td><td>' + h(t.versioni) + '</td><td>' + h(q.pyetja || "") + '</td><td>' + h(r.zgjedhja || "") + '</td><td>' + (r["e_saktë"] ? "yes" : "no") + '</td></tr>');
        });
      });
    });
    if (!out.length) return "";
    return '<h4 style="margin:10px 0 6px;font-size:12.5px;color:var(--muted)">Answers</h4><table class="sessions"><thead><tr><th>Level</th><th>Version</th><th>Question</th><th>Chosen</th><th>Correct</th></tr></thead><tbody>' + out.join("") + '</tbody></table>';
  }

  function tlxHTML(p) {
    var out = (p.modules || []).map(function (m) {
      var t = m.nasa_tlx || {};
      return '<tr><td>' + h(m.module_id) + '</td><td>' + h(t.mental) + '</td><td>' + h(t.physical) + '</td><td>' + h(t.temporal) + '</td><td>' + h(t.performance) + '</td><td>' + h(t.effort) + '</td><td>' + h(t.frustration) + '</td><td>' + h(m.preference || "") + '</td></tr>';
    }).join("");
    if (!out) return "";
    return '<h4 style="margin:10px 0 6px;font-size:12.5px;color:var(--muted)">NASA-TLX</h4><table class="sessions"><thead><tr><th>Module</th><th>Mental</th><th>Physical</th><th>Temporal</th><th>Perf.</th><th>Effort</th><th>Frustr.</th><th>Pref.</th></tr></thead><tbody>' + out + '</tbody></table>';
  }

  function bioHTML(p) {
    var b = p.biometric_metrics || {}, head = b.head_pose || {};
    var items = [
      ["Fixation (ms)", b.fixation_duration_ms], ["Regressions", b.saccadic_regressions],
      ["TTFF (ms)", b.time_to_first_fixation_ms], ["Reading (s)", b.reading_time_s],
      ["Blink / min", b.blink_rate_per_min], ["Head yaw", head.yaw_mean],
      ["Head pitch", head.pitch_mean], ["Head roll", head.roll_mean]
    ];
    return '<h4 style="margin:10px 0 6px;font-size:12.5px;color:var(--muted)">Biometrics</h4><div class="prof-meta">' +
      items.map(function (it) { return '<span>' + h(it[0]) + ': <b>' + (it[1] == null ? "-" : h(it[1])) + '</b></span>'; }).join("") + '</div>';
  }

  function closeDetail() {
    var d = $("detail");
    if (d) {
      d.classList.remove("open");
      d.setAttribute("aria-hidden", "true");
      d.removeAttribute("aria-modal");
    }
    if (lastFocus && document.contains(lastFocus)) {
      try { lastFocus.focus(); } catch (e) { /* ignore */ }
    }
  }

  function barChart(data) {
    var W = 640, H = 250, padL = 40, padR = 20, top = 24, baseY = H - 38;
    var n = Math.max(1, data.length), gw = (W - padL - padR) / n;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" font-family="Outfit,Arial" role="img" aria-label="comprehension A vs B">';
    [0, 25, 50, 75, 100].forEach(function (v) {
      var y = baseY - (v / 100) * (baseY - top);
      s += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,.10)"/>' +
        '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" fill="#9fb8c6" font-size="10" text-anchor="end">' + v + '%</text>';
    });
    s += '<line x1="' + padL + '" y1="' + baseY + '" x2="' + (W - padR) + '" y2="' + baseY + '" stroke="rgba(255,255,255,.3)"/>';
    data.forEach(function (d, i) {
      var x0 = padL + i * gw, bw = Math.min(46, gw * 0.30);
      var ax = x0 + gw / 2 - bw - 3, bx = x0 + gw / 2 + 3;
      var ah = (d.a / 100) * (baseY - top), bh = (d.b / 100) * (baseY - top);
      s += '<rect x="' + ax + '" y="' + (baseY - ah) + '" width="' + bw + '" height="' + ah + '" rx="4" fill="#0E7FB0"/>';
      s += '<rect x="' + bx + '" y="' + (baseY - bh) + '" width="' + bw + '" height="' + bh + '" rx="4" fill="#FF6E42"/>';
      s += '<text x="' + (ax + bw / 2) + '" y="' + (baseY - ah - 5) + '" fill="#9fb8c6" font-size="10" text-anchor="middle">' + d.a + '</text>';
      s += '<text x="' + (bx + bw / 2) + '" y="' + (baseY - bh - 5) + '" fill="#FF6E42" font-size="10" text-anchor="middle">' + d.b + '</text>';
      s += '<text x="' + (x0 + gw / 2) + '" y="' + (baseY + 17) + '" fill="#F9F9F9" font-size="12" text-anchor="middle">' + h(d.label) + '</text>';
    });
    s += '</svg>';
    return s;
  }

  function csv() {
    var cols = ["id_anonim", "name", "profession", "date", "method", "device", "calibration_px", "comprehension_pct"];
    var out = filteredRows().map(function (r) {
      return {
        id_anonim: r.id_anonim, name: r.name || "", profession: profName(profId(parse(r))),
        date: r.created_at || "", method: method(r), device: device(r),
        calibration_px: calib(r) == null ? "" : calib(r), comprehension_pct: acc(r) == null ? "" : acc(r)
      };
    });
    var text = [cols.join(",")].concat(out.map(function (o) {
      return cols.map(function (c) { return '"' + String(o[c] == null ? "" : o[c]).replace(/"/g, '""') + '"'; }).join(",");
    })).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.download = "ncid_sessions.csv";
    a.click();
  }

  /* ============================ Demo data ============================ */
  function demoRows() {
    var out = [];
    var names = ["Ardit Ceno", "Elira Hoxha", "Marko Petrov", "Sara Kelmendi", "Luan Berisha", "Nora Meta", "Endrit Gashi", "Alma Rexha", "Jonida Kola", "Dritan Shehu", "Vesa Lika", "Arben Zeka"];
    var i = 0;
    (fields.length ? fields : []).forEach(function (f) {
      var n = 4 + Math.floor(Math.random() * 6);
      for (var k = 0; k < n; k++) {
        var nm = names[(i + k) % names.length];
        var id = "DEMO_" + f.id.toUpperCase() + "_" + String(k + 1).padStart(2, "0");
        var modules = ["m1", "m2", "m3"].map(function (mid) {
          return {
            module_id: mid, fusha: f.id, "versioni_i_parë": Math.random() > .5 ? "A" : "B", preference: Math.random() > .5 ? "A" : "B",
            nasa_tlx: { mental: 6 + Math.round(Math.random() * 10), physical: 1 + Math.round(Math.random() * 6), temporal: 3 + Math.round(Math.random() * 9), performance: 2 + Math.round(Math.random() * 8), effort: 5 + Math.round(Math.random() * 9), frustration: 2 + Math.round(Math.random() * 8) },
            trials: ["A", "B"].map(function (v) {
              var base = v === "A" ? 66 + Math.random() * 24 : 58 + Math.random() * 26;
              return {
                versioni: v, module_id: mid, accuracy_score_pct: Math.min(100, Math.round(base)),
                quiz_item: [0, 1, 2].map(function (q) { return { pyetja: f.id + " " + mid + " " + v + " question " + (q + 1) }; }),
                response: [0, 1, 2].map(function () { return { zgjedhja: "Option " + String.fromCharCode(65 + Math.floor(Math.random() * 4)), "e_saktë": Math.random() > .32 }; }),
                fixation_duration_ms: Math.round(190 + Math.random() * 70), regresione: Math.round(5 + Math.random() * 16),
                TTFF_ms: Math.round(300 + Math.random() * 280), koha_e_leximit_s: Math.round(24 + Math.random() * 30)
              };
            })
          };
        });
        var accs = [];
        modules.forEach(function (m) { m.trials.forEach(function (t) { accs.push(t.accuracy_score_pct); }); });
        out.push({
          id: id, id_anonim: id, name: nm,
          created_at: new Date(Date.now() - (i + k) * 3600 * 1000).toISOString(),
          payload: {
            kind: "demo",
            participant: { id_anonim: id, emri_mbiemer: nm, profesioni: f.name.en, fusha: f.id, "niveli_i_ekspertizës": ["Beginner", "Intermediate", "Senior"][k % 3], mosha: 20 + (k % 12) },
            session: { session_number: 1, gjuha: "en", metoda: "eyetracking", kalibrimi_px: Math.round(70 + Math.random() * 70), "kohëzgjatja_min": Math.round(8 + Math.random() * 8), shfletuesi: "Chrome", pajisja: k % 2 ? "Desktop" : "Mobile" },
            modules: modules,
            biometric_metrics: { fixation_duration_ms: Math.round(195 + Math.random() * 50), saccadic_regressions: Math.round(6 + Math.random() * 14), time_to_first_fixation_ms: Math.round(320 + Math.random() * 250), task_completion_time_s: Math.round(70 + Math.random() * 50), reading_time_s: Math.round(60 + Math.random() * 50), blink_rate_per_min: Math.round(10 + Math.random() * 10), head_pose: { yaw_mean: (Math.random() * 6 - 3).toFixed(1), pitch_mean: (Math.random() * 6 - 3).toFixed(1), roll_mean: (Math.random() * 4 - 2).toFixed(1) } },
            quiz_results: { total_questions: 18, correct_answers: Math.round(accs.reduce(function (a, b) { return a + b; }, 0) / 100 * 18), accuracy_score_pct: Math.round(accs.reduce(function (a, b) { return a + b; }, 0) / accs.length) },
            exported_at: new Date().toISOString()
          }
        });
        i++;
      }
    });
    return out;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
