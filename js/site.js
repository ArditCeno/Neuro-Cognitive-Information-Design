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
      '<span class="foot-links">' +
        '<a href="study.html" data-en="Join the study →" data-al="Bashkohu me studimin →">Join the study →</a>' +
        '<a class="foot-social" href="https://www.linkedin.com/in/ardit-ceno-a674b5307/" target="_blank" rel="noopener" aria-label="LinkedIn">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H9z"/></svg>' +
        '</a>' +
      '</span>' +
      '<span>© 2026 Ardit Ceno — All rights reserved.</span>';
  }

  function initBackground() {
    if (document.querySelector(".bg-orbs")) return;
    var orbs = document.createElement("div");
    orbs.className = "bg-orbs";
    orbs.setAttribute("aria-hidden", "true");
    orbs.innerHTML = '<span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>';
    document.body.appendChild(orbs);
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    var targets = document.querySelectorAll(".section, .page-head, .field-card, .card, .quote, .fields-strip, .steps li, .phase, .field-item, .hero2-left, .hero2-visual");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets.forEach(function (el) {
      el.classList.add("reveal");
      if (reduce) el.classList.add("in");
    });
    if (reduce) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) { io.observe(el); });
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
    initBackground();
    initReveal();
  }

  window.NCID_applyLang = apply;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
