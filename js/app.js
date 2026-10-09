/*
 * App controller: drives the full session flow.
 *   welcome/consent -> registration -> setup -> calibration -> task -> done
 * Design: within-subjects (each participant reads both A and B), 3 of 5
 * modules, NASA-TLX after each module, MouseView.js plan B on calibration fail.
 */

import { CONFIG } from "./config.js";
import { t, tr, getLang, setLang, applyI18n } from "./i18n.js";
import { anonId, now, round, detectBrowser, sleep, mean, el } from "./utils.js";
import { Storage, exportSummary, exportGaze, submitSession } from "./storage.js";
import { EyeTracking } from "./eyetracking.js";
import { Calibration } from "./calibration.js";
import { Stimuli } from "./stimuli.js";
import { computeMetrics, summarizeSessionMetrics } from "./aoi.js";
import { Runner } from "./runner.js";
import { Heatmap } from "./heatmap.js";
import { Biometrics } from "./biometrics.js";
import { Research } from "./research.js";
import { stimulusMeta, alignGazeSamples, buildTrial, buildModule, assembleSession } from "./schema.js";

const STAGES = ["welcome", "registration", "setup", "calibration", "task", "done"];

const state = {
  mock: new URLSearchParams(location.search).get("mock") === "1",
  participant: null,
  sessionNumber: null,
  startedAt: null,
  modulePlan: [],
  moduleIndex: 0,
  blockIndex: 0,
  currentAois: [],
  moduleTrials: [],
  moduleResults: [],
  moduleNasaTlx: null,
  readStart: 0,
  readingSec: 0,
  gazeSamples: [],
  heatPoints: []
};

const $ = (id) => document.getElementById(id);

function showStage(name) {
  STAGES.forEach((s) => $(`stage-${s}`).classList.toggle("hidden", s !== name));
  $("stage-research").classList.add("hidden");
  const idx = STAGES.indexOf(name);
  $("progressFill").style.width = (idx / (STAGES.length - 1)) * 100 + "%";
  $("progressText").textContent = `${t("step")} ${idx + 1} ${t("of")} ${STAGES.length}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------------------- Boot ---------------------------- */
function boot() {
  if (state.mock) $("mockBadge").classList.remove("hidden");
  document.querySelectorAll(".langbtn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-lang") === getLang());
    b.addEventListener("click", () => setLang(b.getAttribute("data-lang")));
  });
  window.addEventListener("ncid:lang", onLangChange);
  buildSelects();
  applyI18n();
  showStage("welcome");

  $("btnConsent").addEventListener("click", () => { buildSelects(); showStage("registration"); });
  $("btnDecline").addEventListener("click", () => { alert(t("consent_decline")); window.location.reload(); });
  $("regForm").addEventListener("submit", onRegister);
  $("btnCamera").addEventListener("click", onEnableCamera);
  $("btnSetupNext").addEventListener("click", startCalibration);
  $("btnRecalib").addEventListener("click", startCalibration);
  $("btnCalibNext").addEventListener("click", startModules);
  $("btnStartReading").addEventListener("click", startReading);
  $("btnReadDone").addEventListener("click", onReadDone);
  $("btnDownload").addEventListener("click", () => exportSummary(buildExport()));
  $("btnDownloadGaze").addEventListener("click", () => exportGaze(buildExport()));
  $("btnWithdraw").addEventListener("click", withdraw);
  $("btnResearcher").addEventListener("click", () => {
    STAGES.forEach((s) => $(`stage-${s}`).classList.add("hidden"));
    $("stage-research").classList.remove("hidden");
    Research.render($("stage-research"), Storage.read());
  });
}

function onLangChange() {
  document.querySelectorAll(".langbtn").forEach((b) =>
    b.classList.toggle("active", b.getAttribute("data-lang") === getLang()));
  buildSelects();
  applyI18n();
  const idx = STAGES.findIndex((s) => !$(`stage-${s}`).classList.contains("hidden"));
  if (idx >= 0) $("progressText").textContent = `${t("step")} ${idx + 1} ${t("of")} ${STAGES.length}`;
  if (!$("stage-task").classList.contains("hidden")) refreshTaskLabels();
}

function buildSelects() {
  const prof = $("regProfession");
  if (!prof) return;
  const cur = prof.value;
  prof.innerHTML = `<option value="">${t("reg_choose")}</option>`;
  CONFIG.fields.forEach((f) => prof.appendChild(el("option", { value: f.id, text: tr(f.name) })));
  prof.appendChild(el("option", { value: "other", text: getLang() === "en" ? "Other" : "Tjetër" }));
  prof.value = cur;
  const exp = $("regExpertise");
  const curE = exp.value;
  exp.innerHTML = `<option value="">${t("reg_choose")}</option>`;
  CONFIG.expertiseLevels.forEach((l) => exp.appendChild(el("option", { value: l.id, text: tr(l) })));
  exp.value = curE;
}

/* ---------------------------- Registration ---------------------------- */
function onRegister(e) {
  e.preventDefault();
  const age = parseInt($("regAge").value, 10);
  const profession = $("regProfession").value;
  const expertise = $("regExpertise").value;
  if (!age || !profession || !expertise) { $("regErr").classList.remove("hidden"); return; }
  $("regErr").classList.add("hidden");

  const professionName = profession === "other"
    ? (getLang() === "en" ? "Other" : "Tjetër")
    : tr((CONFIG.fields.find((f) => f.id === profession) || {}).name);

  const id = anonId();
  state.participant = {
    id_anonim: id,
    profesioni: professionName,
    niveli_i_ekspertizës: tr(CONFIG.expertiseLevels.find((l) => l.id === expertise)),
    mosha: age
  };
  state.startedAt = now();
  state.sessionNumber = Storage.nextSessionCounter();
  Storage.init(id);
  Storage.patch((s) => {
    s.participant = state.participant;
    s.session = { session_number: state.sessionNumber, gjuha: getLang(), metoda: state.mock ? "mock" : "eyetracking" };
  });
  Storage.addEvent("registration", { id });
  showStage("setup");
}

/* ---------------------------- Camera & calibration ---------------------------- */
async function onEnableCamera() {
  const msg = $("setupMsg");
  const preview = $("cameraPreview");
  msg.textContent = t("loading");
  try {
    await EyeTracking.init({ mock: state.mock });
    if (!state.mock) await EyeTracking.startCamera();
    msg.textContent = t("setup_camera_ok");
    if (preview) preview.classList.add("ready");
    $("btnCamera").classList.add("hidden");
    $("btnSetupNext").classList.remove("hidden");
    if (!state.mock) setTimeout(async () => { await Biometrics.init(); Biometrics.start(); }, 800);
  } catch (err) {
    console.warn("Camera error:", err);
    msg.textContent = t("setup_camera_denied");
  }
}

async function startCalibration() {
  if (state.mock) { startModules(); return; }
  showStage("calibration");
  const status = $("calibStatus");
  $("btnCalibNext").classList.add("hidden");
  $("btnRecalib").classList.add("hidden");

  const max = CONFIG.study.calibrationMaxAttempts;
  let acc = null;
  for (let attempt = 1; attempt <= max; attempt++) {
    $("calibArea").innerHTML = "";
    status.textContent = `${t("calib_point")} — ${attempt}/${max}`;
    acc = await Calibration.run($("calibArea"), status);
    if (Calibration.isGood()) break;
    status.textContent = `${t("calib_result")}: ${acc} px. ${t("calib_poor")}`;
    if (attempt < max) await sleep(1500);
  }

  let method = state.mock ? "mock" : "eyetracking";
  if (!Calibration.isGood() && CONFIG.study.mouseFallback) {
    await EyeTracking.enableMouseFallback();
    method = "mouse";
    status.textContent = `${t("calib_result")}: ${acc} px. ` +
      (getLang() === "en" ? "Switched to mouse-tracking (MouseView plan B)." : "Kaluam në gjurmim me miun (MouseView plan B).");
  } else {
    status.textContent = `${t("calib_result")}: ${acc} px. ` + (Calibration.isGood() ? t("calib_good") : t("calib_poor"));
  }
  Storage.patch((s) => { s.session = s.session || {}; s.session.kalibrimi_px = Calibration.accuracyPx; s.session.metoda = method; });
  $("btnCalibNext").classList.remove("hidden");
  $("btnRecalib").classList.remove("hidden");
}

/* ---------------------------- Module plan & rotation ---------------------------- */
function startModules() {
  const n = CONFIG.study.modulesPerSession;
  const fields = CONFIG.fields;
  const offset = (state.sessionNumber || 1) % fields.length;
  const chosen = [];
  for (let k = 0; k < n; k++) chosen.push(fields[(offset + k) % fields.length]);

  state.modulePlan = chosen.map((field, mi) => {
    const versions = (((state.sessionNumber || 1) + mi) % 2 === 0) ? ["A", "B"] : ["B", "A"];
    return { field, versions, firstVersion: versions[0] };
  });
  state.moduleIndex = 0;
  state.blockIndex = 0;
  state.moduleResults = [];

  Storage.patch((s) => {
    s.session = s.session || {};
    s.session.rendi_modulave = state.modulePlan.map((m) => m.field.id);
    s.session.fusha = state.modulePlan.map((m) => tr(m.field.name));
  });

  Runner.init($("stage-task"));
  showStage("task");
  startModuleIntro();
}

function refreshTaskLabels() {
  const m = state.modulePlan[state.moduleIndex];
  if (!m) return;
  $("taskModule").textContent = `${t("module_title")} ${t("module_progress", { i: state.moduleIndex + 1, n: state.modulePlan.length })} · ${tr(m.field.name)}`;
  $("taskFieldName").textContent = tr(m.field.name);
  $("taskInstruction").textContent = `${t("task_do")}: ${tr(m.field.task)}`;
}

function startModuleIntro() {
  const m = state.modulePlan[state.moduleIndex];
  state.moduleTrials = [];
  $("taskModule").textContent = `${t("module_title")} ${t("module_progress", { i: state.moduleIndex + 1, n: state.modulePlan.length })} · ${tr(m.field.name)}`;
  $("taskVersion").textContent = "";
  $("taskIntro").classList.remove("hidden");
  $("taskReading").classList.add("hidden");
  $("taskQuiz").classList.add("hidden");
  $("taskTlx").classList.add("hidden");
  $("taskBetween").classList.add("hidden");
  $("taskFieldName").textContent = tr(m.field.name);
  $("taskInstruction").textContent = `${t("task_do")}: ${tr(m.field.task)}`;
}

/* ---------------------------- Reading trial ---------------------------- */
async function startReading() {
  const m = state.modulePlan[state.moduleIndex];
  const version = m.versions[state.blockIndex];

  $("taskIntro").classList.add("hidden");
  $("taskReading").classList.remove("hidden");
  $("docLoading").classList.remove("hidden");
  $("doc").classList.add("hidden");
  $("taskVersion").textContent = `${t("version_label")} ${version} · ${t("block")} ${state.blockIndex + 1}/${m.versions.length}`;

  try {
    const { aois } = await Stimuli.load(m.field, version, getLang());
    state.currentAois = aois;
    state.currentHtml = $("doc").innerHTML;
  } catch (e) {
    console.warn("Material load error:", e);
  }
  $("docLoading").classList.add("hidden");
  $("doc").classList.remove("hidden");

  await sleep(120);
  Stimuli.updateRegion($("doc"));
  state.readStart = performance.now();
  EyeTracking.startTrial(`${m.field.id}:${version}`);
  Storage.addEvent("reading_start", { field: m.field.id, version });
}

function onReadDone() {
  const m = state.modulePlan[state.moduleIndex];
  const version = m.versions[state.blockIndex];
  const trial = EyeTracking.endTrial();
  state.readingSec = round((performance.now() - state.readStart) / 1000, 1);

  const metrics = computeMetrics({ samples: trial.samples, startT: trial.startT }, state.currentAois);
  Storage.addEvent("reading_end", { field: m.field.id, version, samples: trial.samples.length, fixations: metrics.fixation_count });
  if (metrics.fixations && metrics.fixations.length) state.heatPoints.push(...metrics.fixations);

  // stash for post-quiz trial assembly
  state.pending = { field: m.field, version, metrics, readingSec: state.readingSec };

  $("taskReading").classList.add("hidden");
  runQuiz();
}

async function runQuiz() {
  const { field } = state.pending;
  const quizEl = $("taskQuiz");
  quizEl.classList.remove("hidden");
  quizEl.innerHTML = "";
  Stimuli.clear();

  const quizStart = performance.now();
  const results = await Runner.runQuiz(field.quiz, quizEl);
  const quizSec = (performance.now() - quizStart) / 1000;
  const perItem = results.length ? round(quizSec / results.length, 1) : null;
  results.forEach((r) => { r.time_s = perItem; });

  const { version, metrics, readingSec } = state.pending;
  const taskSec = round(readingSec + quizSec, 1);

  const stimulus = stimulusMeta(field, version, state.currentHtml || "");
  const trialObj = buildTrial({ field, version, stimulus, readingTimeSec: readingSec, taskTimeSec: taskSec, metrics, quiz: results });
  state.moduleTrials.push(trialObj);

  quizEl.classList.add("hidden");
  quizEl.innerHTML = "";

  const m = state.modulePlan[state.moduleIndex];
  if (state.blockIndex < m.versions.length - 1) {
    state.blockIndex++;
    showBetweenBlock();
  } else {
    await finishModule(m);
  }
}

function showBetweenBlock() {
  const box = $("taskBetween");
  box.classList.remove("hidden");
  box.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card";
  card.appendChild(Object.assign(document.createElement("h2"), { textContent: getLang() === "en" ? "Next block" : "Blloku tjetër" }));
  const p = document.createElement("p");
  p.className = "lead";
  p.textContent = getLang() === "en"
    ? "You will now read a different version of a document. Take a short break, then continue."
    : "Tani do të lexoni një version tjetër të një dokumenti. Bëni një pushim të shkurtër, pastaj vazhdoni.";
  card.appendChild(p);
  const actions = document.createElement("div");
  actions.className = "actions";
  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = t("next");
  btn.addEventListener("click", () => { box.classList.add("hidden"); startReading(); });
  actions.appendChild(btn);
  card.appendChild(actions);
  box.appendChild(card);
}

async function finishModule(m) {
  const tlx = (CONFIG.study.nasaTlx === "perModule") ? await runTlx() : null;
  state.moduleNasaTlx = tlx;
  state.moduleResults.push(buildModule({
    field: m.field,
    orderIndex: state.moduleIndex,
    firstVersion: m.firstVersion,
    trials: state.moduleTrials,
    nasaTlx: tlx
  }));
  state.moduleTrials = [];
  state.moduleIndex++;
  state.blockIndex = 0;
  if (state.moduleIndex < state.modulePlan.length) startModuleIntro();
  else await finishSession();
}

async function runTlx() {
  const tlxEl = $("taskTlx");
  tlxEl.classList.remove("hidden");
  tlxEl.innerHTML = "";
  const res = await Runner.runNasaTlx(tlxEl);
  tlxEl.classList.add("hidden");
  tlxEl.innerHTML = "";
  return res;
}

/* ---------------------------- Finish ---------------------------- */
function buildExport() {
  const flat = state.moduleResults.flatMap((m) => m.trials);
  const totalQ = flat.reduce((s, x) => s + x.response.length, 0);
  const totalC = flat.reduce((s, x) => s + x.response.filter((r) => r["e_saktë"]).length, 0);
  const gazeSummary = summarizeSessionMetrics(flat.map((x) => ({ metrics: { fixation_duration_ms: x.fixation_duration_ms, saccadic_regressions: x.regresione, time_to_first_fixation_ms: x.TTFF_ms }, koha_detyres_s: x.koha_detyrës_s })));
  const bio = Biometrics.ready ? Biometrics.summary() : { blink_rate_per_min: null, head_pose: null };
  const readingTimes = flat.map((x) => x.koha_e_leximit_s);

  const session = Object.assign({}, Storage.read().session, {
    "kohëzgjatja_min": state.startedAt ? round((performance.now() - state.startedAt) / 60000, 2) : null,
    shfletuesi: detectBrowser().name,
    pajisja: detectBrowser().device
  });

  return assembleSession({
    participant: state.participant,
    session,
    modules: state.moduleResults,
    biometric_metrics: Object.assign({}, gazeSummary, {
      blink_rate_per_min: bio.blink_rate_per_min,
      head_pose: bio.head_pose,
      reading_time_s: readingTimes.length ? round(mean(readingTimes), 1) : null
    }),
    quiz_results: {
      total_questions: totalQ,
      correct_answers: totalC,
      accuracy_score_pct: totalQ ? round((totalC / totalQ) * 100, 1) : 0
    },
    gaze: alignGazeSamples(state.gazeSamples, Biometrics.samples)
  });
}

async function finishSession() {
  if (CONFIG.study.nasaTlx !== "perModule") state.endNasaTlx = await runTlx();
  EyeTracking.stop();
  Biometrics.stop();
  state.gazeSamples = EyeTracking.getSessionSamples().slice();
  // flush to buffer for crash recovery
  Storage.patch((s) => {
    s.gaze = state.gazeSamples.map((p) => ({ t: round(p.t, 1), x: round(p.x, 1), y: round(p.y, 1) }));
  });

  const summary = buildExport();
  await submitSession(summary);

  $("doneSummary").textContent = JSON.stringify({
    participant: summary.participant,
    session: summary.session,
    biometric_metrics: summary.biometric_metrics,
    quiz_results: summary.quiz_results,
    modules: summary.modules.map((m) => ({ fusha: m.fusha, versioni_i_parë: m.versioni_i_parë, trials: m.trials.length, nasa_tlx: m.nasa_tlx }))
  }, null, 2);

  showStage("done");

  const size = Heatmap.maxDocSize([{ metrics: { fixations: state.heatPoints } }]);
  Heatmap.render($("heatmapContainer"), state.heatPoints, size);
}

/* ---------------------------- Withdraw ---------------------------- */
function withdraw() {
  if (!confirm(getLang() === "en" ? "Delete all collected data for this session?" : "Të fshihen të gjitha të dhënat e këtij sesioni?")) return;
  Storage.clear();
  EyeTracking.stop();
  Biometrics.stop();
  alert(t("done_withdrawn"));
  window.location.reload();
}

boot();
