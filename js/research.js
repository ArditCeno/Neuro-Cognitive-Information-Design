/*
 * Researcher tools (Diagram 3): A/B content-parity check (length + readability),
 * AOI inspector/exporter, and a session-quality dashboard (Diagram components).
 */

import { CONFIG } from "./config.js";
import { getLang, tr, t } from "./i18n.js";
import { el, round } from "./utils.js";
import { stimulusMeta } from "./schema.js";
import { Stimuli } from "./stimuli.js";
import { Storage } from "./storage.js";

async function fetchText(path) {
  const res = await fetch(path, { cache: "no-store" });
  return res.ok ? res.text() : "";
}

export const Research = {
  async render(container, sessionState) {
    container.innerHTML = "";
    container.appendChild(el("h1", { text: t("panel_title") }));
    this._stats(container, sessionState);
    this._parity(container);
    this._aoi(container);
  },

  _stats(container, sessionState) {
    const card = el("div", { class: "card" });
    card.appendChild(el("h2", { text: getLang() === "en" ? "Session quality" : "Cilësia e sesionit" }));
    const s = sessionState && sessionState.session;
    if (!s) { card.appendChild(el("p", { class: "hint", text: getLang() === "en" ? "No active session." : "Nuk ka sesion aktiv." })); container.appendChild(card); return; }
    const rows = [
      ["kalibrimi_px", s.kalibrimi_px],
      ["kohëzgjatja_min", s.kohëzgjatja_min],
      ["session_number", s.session_number],
      [getLang() === "en" ? "gaze samples" : "kampione shikimi", (sessionState.gaze || []).length]
    ];
    const ul = el("ul");
    rows.forEach(([k, v]) => ul.appendChild(el("li", { text: k + ": " + (v == null ? "-" : v) })));
    card.appendChild(ul);
    const ok = s.kalibrimi_px != null && s.kalibrimi_px < CONFIG.study.calibrationThresholdPx;
    card.appendChild(el("p", { class: ok ? "msg" : "err", text: ok ? "✔" : "⚠ " + t("calib_poor") }));
    container.appendChild(card);
  },

  async _parity(container) {
    const card = el("div", { class: "card" });
    card.appendChild(el("h2", { text: getLang() === "en" ? "A/B content parity (length & readability)" : "Barazia e përmbajtjes A/B (gjatësia & lexueshmëria)" }));
    const note = el("p", { class: "hint", text: getLang() === "en"
      ? "Flesch Reading Ease is approximate. Goal: same facts, comparable length."
      : "Flesch Reading Ease është i përafërt. Synimi: të njëjtat fakte, gjatësi e krahasueshme." });
    card.appendChild(note);
    const table = el("table", { class: "parity-table" });
    const head = el("tr");
    ["Fusha", "A (fjalë / FRE)", "B (fjalë / FRE)", "Δ fjalë"].forEach((h) => head.appendChild(el("th", { text: h })));
    table.appendChild(el("thead", {}, [head]));
    const body = el("tbody");
    card.appendChild(table); table.appendChild(body);
    container.appendChild(card);

    const lang = getLang();
    for (const f of CONFIG.fields) {
      const [ha, hb] = await Promise.all([
        fetchText(f.materials.A[lang]), fetchText(f.materials.B[lang])
      ]);
      const ma = stimulusMeta(f, "A", ha);
      const mb = stimulusMeta(f, "B", hb);
      const row = el("tr");
      row.appendChild(el("td", { text: tr(f.name) }));
      row.appendChild(el("td", { text: ma.gjatësia + " / " + ma.lexueshmëria }));
      row.appendChild(el("td", { text: mb.gjatësia + " / " + mb.lexueshmëria }));
      row.appendChild(el("td", { text: round(mb.gjatësia - ma.gjatësia, 0) }));
      body.appendChild(row);
    }
  },

  _aoi(container) {
    const card = el("div", { class: "card" });
    card.appendChild(el("h2", { text: getLang() === "en" ? "AOI inspector" : "Inspektori i AOI" }));
    const sel = el("select");
    CONFIG.fields.forEach((f) => {
      ["A", "B"].forEach((v) => {
        const o = el("option", { value: f.id + ":" + v, text: tr(f.name) + " — " + v });
        sel.appendChild(o);
      });
    });
    const out = el("div", { class: "aoi-out" });
    const exportBtn = el("button", { class: "btn btn-ghost", text: getLang() === "en" ? "Export AOI JSON" : "Eksporto AOI JSON" });
    let current = null;

    const inspect = async () => {
      const [fid, ver] = sel.value.split(":");
      const field = CONFIG.fields.find((f) => f.id === fid);
      const lang = getLang();
      const html = await fetchText(field.materials[ver][lang]);
      const host = el("div", { class: "doc", id: "aoiHost" });
      host.style.cssText = "position:fixed;left:-10000px;top:0;width:900px;height:auto;visibility:hidden;";
      document.body.appendChild(host);
      host.innerHTML = html;
      const aois = Stimuli.computeAois(host);
      host.remove();
      current = { fusha: fid, versioni: ver, aoi: aois.map((a) => ({ emri: a.name, x: Math.round(a.x), y: Math.round(a.y), w: Math.round(a.width), h: Math.round(a.height), kritike: a.critical })) };
      out.innerHTML = "";
      const ul = el("ul");
      current.aoi.forEach((a) => ul.appendChild(el("li", { text: `${a.emri} (${a.x},${a.y},${a.w}×${a.h})${a.kritike ? " ★" : ""}` })));
      out.appendChild(ul);
    };
    sel.addEventListener("change", inspect);
    exportBtn.addEventListener("click", () => {
      if (!current) return;
      const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u; a.download = `aoi_${current.fusha}_${current.versioni}.json`;
      a.click(); setTimeout(() => URL.revokeObjectURL(u), 800);
    });

    card.appendChild(sel);
    card.appendChild(out);
    card.appendChild(exportBtn);
    container.appendChild(card);
    inspect();
  }
};
