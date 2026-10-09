/*
 * Shared site chrome: header (with logo), footer, and EN/AL language switch.
 * Every page includes <div id="site-header"></div> ... <div id="site-footer"></div>
 * and <script src="js/site.js"></script>.
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */
(function () {
  var KEY = "ncid_lang";
  var lang = localStorage.getItem(KEY) || "en";

  var PAGES = [
    { href: "index.html", en: "Home", al: "Kryefaqja" },
    { href: "about.html", en: "About", al: "Rreth" },
    { href: "methodology.html", en: "Methodology", al: "Metodologjia" },
    { href: "fields.html", en: "Fields", al: "Fushat" },
    { href: "contact.html", en: "Contact", al: "Kontakt" }
  ];

  function currentPage() {
    var p = location.pathname.split("/").pop();
    return (p && p.length) ? p : "index.html";
  }

  function headerHTML() {
    var cur = currentPage();
    var links = PAGES.map(function (p) {
      var active = (p.href === cur) ? " active" : "";
      return '<a class="' + active.trim() + '" href="' + p.href +
        '" data-en="' + p.en + '" data-al="' + p.al + '">' + p.en + "</a>";
    }).join("");

    return '' +
      '<a class="brand" href="index.html">' +
        '<span class="brand-mark">' +
          '<span class="mono" aria-hidden="true"></span>' +
          '<img class="logo-img" src="assets/logo.png" alt="NCID" ' +
               'onload="this.parentNode.classList.add(\'has-logo\')" ' +
               'onerror="this.parentNode.classList.add(\'no-logo\');this.remove()">' +
        '</span>' +
        '<span class="brand-text"><strong>Neuro-Cognitive</strong><small>Information Design</small></span>' +
      '</a>' +
      '<nav class="nav-links">' + links + '</nav>' +
      '<div class="nav-actions">' +
        '<div class="langswitch" role="group" aria-label="Language">' +
          '<button data-lang="en" class="langbtn">EN</button>' +
          '<button data-lang="al" class="langbtn">AL</button>' +
        '</div>' +
        '<a class="btn btn-primary pill" href="study.html">' +
          '<span data-en="Start Study" data-al="Fillo Studimin">Start Study</span> <em>→</em>' +
        '</a>' +
      '</div>';
  }

  function footerHTML() {
    return '' +
      '<span>Neuro-Cognitive Information Design</span>' +
      '<a href="study.html" style="color:var(--cyan);text-decoration:none;font-weight:700" ' +
         'data-en="Join the study →" data-al="Bashkohu me studimin →">Join the study →</a>' +
      '<span>© 2026 Ardit Ceno — All rights reserved.</span>';
  }

  function apply(next) {
    lang = (next === "al") ? "al" : "en";
    localStorage.setItem(KEY, lang);
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var v = el.getAttribute("data-" + lang) || el.getAttribute("data-en");
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll(".langbtn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
  }

  function render() {
    var h = document.getElementById("site-header");
    if (h) { h.className = "nav"; h.innerHTML = headerHTML(); }
    var f = document.getElementById("site-footer");
    if (f) { f.className = "foot"; f.innerHTML = footerHTML(); }

    document.querySelectorAll(".langbtn").forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-lang")); });
    });
    apply(lang);
  }

  window.NCID_applyLang = apply;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
