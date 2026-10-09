/*
 * Runner: presents the comprehension quiz and NASA-TLX questionnaire.
 * Primary path tries jsPsych v7 (CDN) when study.useJsPsych is true;
 * a fully-featured DOM engine is the default and automatic fallback.
 */

import { CONFIG } from "./config.js";
import { tr, t } from "./i18n.js";
import { el } from "./utils.js";

let jsPsychCtx = null;

async function loadJsPsych(displayEl) {
  const core = await import(CONFIG.cdn.jsPsych);
  const btnMod = await import(CONFIG.cdn.jsPsychHtmlButton);
  const likertMod = await import(CONFIG.cdn.jsPsychSurveyLikert);
  const jsPsych = core.initJsPsych({ display_element: displayEl });
  return { jsPsych, htmlButton: btnMod.default, surveyLikert: likertMod.default };
}

export const Runner = {
  async init(displayEl) {
    if (!CONFIG.study.useJsPsych) return false;
    try {
      jsPsychCtx = await loadJsPsych(displayEl);
      return true;
    } catch (e) {
      console.warn("jsPsych unavailable, using DOM runner:", e);
      jsPsychCtx = null;
      return false;
    }
  },

  /* -------------------- QUIZ -------------------- */
  async runQuiz(items, container) {
    if (jsPsychCtx) {
      try { return await this._quizJsPsych(items, container); }
      catch (e) { console.warn("jsPsych quiz failed, falling back:", e); }
    }
    return this._quizDom(items, container);
  },

  _quizJsPsych(items, container) {
    const { jsPsych, htmlButton } = jsPsychCtx;
    const lang = document.documentElement.lang;
    const timeline = items.map((it, idx) => ({
      type: htmlButton,
      stimulus: `<div class="qtext">${idx + 1}. ${tr(it.q)}</div>`,
      choices: it.options.map((o) => tr(o)),
      data: { itemId: idx },
      post_trial_gap: 100
    }));
    return new Promise((resolve) => {
      jsPsych.run(timeline).then((data) => {
        const results = items.map((it, idx) => {
          const row = data.find((d) => d.itemId === idx) || {};
          const response = typeof row.response === "number" ? row.response : null;
          return {
            index: idx,
            q: tr(it.q),
            chosen: response != null ? tr(it.options[response]) : null,
            correct: response === it.correct,
            critical: !!it.critical
          };
        });
        resolve(results);
      });
    });
  },

  _quizDom(items, container) {
    return new Promise((resolve) => {
      container.innerHTML = "";
      container.appendChild(el("h2", { "data-i18n": "quiz_title", text: t("quiz_title") }));
      container.appendChild(el("p", { class: "lead", text: t("quiz_instr") }));

      const answers = new Array(items.length).fill(null);

      items.forEach((it, idx) => {
        const box = el("div", { class: "quiz-item" });
        box.appendChild(el("div", { class: "qtext", text: (idx + 1) + ". " + tr(it.q) }));
        it.options.forEach((opt, oi) => {
          const id = `q${idx}_o${oi}`;
          const label = el("label", { class: "quiz-opt", for: id });
          const input = el("input", { type: "radio", name: `q${idx}`, id, value: oi });
          input.addEventListener("change", () => {
            answers[idx] = oi;
            box.querySelectorAll(".quiz-opt").forEach((n) => n.classList.remove("selected"));
            label.classList.add("selected");
          });
          label.appendChild(input);
          label.appendChild(document.createTextNode(tr(opt)));
          box.appendChild(label);
        });
        container.appendChild(box);
      });

      const err = el("p", { class: "err hidden", text: t("quiz_select") });
      const actions = el("div", { class: "actions" });
      const submit = el("button", { class: "btn btn-primary", text: t("quiz_submit") });
      submit.addEventListener("click", () => {
        if (answers.some((a) => a == null)) { err.classList.remove("hidden"); return; }
        resolve(items.map((it, idx) => ({
          index: idx,
          q: tr(it.q),
          chosen: tr(it.options[answers[idx]]),
          correct: answers[idx] === it.correct,
          critical: !!it.critical
        })));
      });
      actions.appendChild(submit);
      container.appendChild(err);
      container.appendChild(actions);
    });
  },

  /* -------------------- NASA-TLX -------------------- */
  async runNasaTlx(container) {
    if (jsPsychCtx) {
      try { return await this._tlxJsPsych(container); }
      catch (e) { console.warn("jsPsych TLX failed, falling back:", e); }
    }
    return this._tlxDom(container);
  },

  _tlxJsPsych(container) {
    const { jsPsych, surveyLikert } = jsPsychCtx;
    const labels = [];
    for (let v = 0; v <= 100; v += 5) labels.push(String(v));
    const questions = CONFIG.nasaTlx.map((s) => ({ prompt: tr(s), labels: labels }));
    const timeline = [{
      type: surveyLikert,
      questions,
      scale: labels,
      data: { block: "nasa_tlx" }
    }];
    return new Promise((resolve) => {
      jsPsych.run(timeline).then((data) => {
        const resp = (data[0] && data[0].response) || {};
        const out = {};
        CONFIG.nasaTlx.forEach((s, i) => {
          const v = resp["Q" + i];
          out[s.id] = typeof v === "number" ? v * 5 : (parseInt(v, 10) || 0);
        });
        resolve(out);
      });
    });
  },

  _tlxDom(container) {
    return new Promise((resolve) => {
      container.innerHTML = "";
      container.appendChild(el("h2", { text: t("tlx_title") }));
      container.appendChild(el("p", { class: "lead", text: t("tlx_instr") }));

      const values = {};
      CONFIG.nasaTlx.forEach((s) => {
        const box = el("div", { class: "tlx-item" });
        const head = el("div", { class: "tlx-head" });
        head.appendChild(el("span", { text: tr(s) }));
        const val = el("span", { text: "50" });
        head.appendChild(val);
        box.appendChild(head);

        const range = el("input", { type: "range", min: "0", max: "100", step: "5", value: "50" });
        range.addEventListener("input", () => { val.textContent = range.value; values[s.id] = parseInt(range.value, 10); });
        values[s.id] = 50;
        box.appendChild(range);

        const scale = el("div", { class: "tlx-scale" });
        scale.appendChild(el("span", { text: tr(s.low) }));
        scale.appendChild(el("span", { text: tr(s.high) }));
        box.appendChild(scale);
        container.appendChild(box);
      });

      const actions = el("div", { class: "actions" });
      const submit = el("button", { class: "btn btn-primary", text: t("tlx_submit") });
      submit.addEventListener("click", () => resolve({ ...values }));
      actions.appendChild(submit);
      container.appendChild(actions);
    });
  }
};
