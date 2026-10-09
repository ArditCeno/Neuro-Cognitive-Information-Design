/*
 * Landing page language switch (EN / AL), sharing the preference used by the
 * participant app (localStorage key: ncid_lang).
 *
 * Copyright (c) 2025 Ardit Ceno. All rights reserved.
 */

(function () {
  var KEY = "ncid_lang";
  var lang = localStorage.getItem(KEY) || "en";

  function apply(next) {
    lang = next === "al" ? "al" : "en";
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

  document.querySelectorAll(".langbtn").forEach(function (b) {
    b.addEventListener("click", function () { apply(b.getAttribute("data-lang")); });
  });

  apply(lang);
})();
