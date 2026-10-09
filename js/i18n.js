/*
 * Bilingual interface strings (Albanian / English).
 * Usage: import { t, getLang, setLang, applyI18n } from './i18n.js';
 */

export const I18N = {
  al: {
    app_title: "Neuro-Cognitive Information Design",
    app_subtitle: "Matja e lexueshmërisë digjitale përmes eye-tracking dhe biometrisë",
    lang_label: "Gjuha",
    step: "Hapi",
    of: "nga",
    next: "Vazhdo",
    back: "Kthehu",
    start: "Fillo",
    finish: "Përfundo",
    loading: "Duke u ngarkuar…",
    error_generic: "Ndodhi një gabim. Provoni përsëri.",

    welcome_title: "Mirë se vini",
    welcome_body: "Ky studim mat se si paraqitja e informacionit ndikon në lexim dhe kuptim. Sesioni zgjat deri në 30 minuta dhe përfshin kalibrimin e syrit me kamerën, leximin e dokumenteve dhe një pyetësor të shkurtër.",
    consent_title: "Pëlqimi (Consent)",
    consent_point_1: "Kamera përdoret vetëm për të llogaritur koordinatat e shikimit (X, Y). Nuk regjistrohet asnjë video.",
    consent_point_2: "Ruhen vetëm të dhëna anonime me një ID anonim. Asnjë emër ose email nuk përfshihet në dataset.",
    consent_point_3: "Pjesëmarrja është vullnetare. Mund të tërhiqeni në çdo moment pa pasoja.",
    consent_point_4: "Të dhënat ruhen sipas GDPR dhe përdoren vetëm për kërkime shkencore.",
    consent_accept: "Pranoj dhe vazhdoj",
    consent_decline: "Nuk pranoj",

    reg_title: "Të dhënat e pjesëmarrësit",
    reg_name: "Emri & Mbiemri (opsionale)",
    reg_name_hint: "Nëse plotësohet, ruhet vetëm lokalisht; dataseti i eksportuar mbetet anonim.",
    reg_age: "Mosha",
    reg_profession: "Profesioni / Dega e studimit",
    reg_expertise: "Niveli i ekspertizës",
    reg_choose: "— Zgjidh —",
    reg_required: "Plotësoni moshat dhe fushat e detyrueshme.",

    setup_title: "Përgatitja e pajisjes",
    setup_body: "Qëndroni ulur rehat, në një distancë ~60 cm nga ekrani, me fytyrën të ndriçuar mirë. Mbyllni dritaret e tjera me kamerë.",
    setup_camera_ok: "Kamera është gati",
    setup_start_camera: "Aktivizo kamerën",
    setup_camera_denied: "Nuk mundëm të hapim kamerën. Kontrolloni lejet e shfletuesit.",

    calib_title: "Kalibrimi i syrit (9 pika)",
    calib_instr: "Shikoni me sy pikën e verdhë dhe klikoni mbi të. Përsëriteni për të nëntë pikat.",
    calib_point: "Pika",
    calib_measuring: "Duke matur saktësinë…",
    calib_result: "Saktësia mesatare e kalibrimit",
    calib_good: "Kalibrimi është i mirë. Vazhdojmë.",
    calib_poor: "Saktësia është nën standardin e rekomanduar (<150 px).",
    calib_retry: "Ri-kalibro",
    calib_continue: "Vazhdo",

    task_read_instr: "Lexojeni dokumentin me kujdes. Kur të mbaroni, klikoni 'Kam mbaruar leximin'.",
    task_do: "Detyra juaj",
    read_done: "Kam mbaruar leximin",
    doc_loading: "Duke ngarkuar dokumentin…",

    quiz_title: "Pyetësori i kuptueshmërisë",
    quiz_instr: "Përgjigjuni pa u konsultuar me dokumentin.",
    quiz_question: "Pyetja",
    quiz_submit: "Dërgo përgjigjen",
    quiz_select: "Zgjidh një përgjigje para se të vazhdoni.",

    tlx_title: "NASA-TLX",
    tlx_instr: "Vlerësoni përvojën tuaj gjatë detyrës së fundit.",
    tlx_submit: "Dërgo",

    module_title: "Moduli",
    module_progress: "Moduli {i} nga {n}",
    version_label: "Versioni",
    block: "Blloku",

    done_title: "Faleminderit!",
    done_body: "Sesioni përfundoi me sukses. Të dhënat u ruajtën në mënyrë anonime.",
    done_download: "Shkarko të dhënat (JSON)",
    download_gaze: "Shkarko gjurmën e syrit (JSON)",
    done_withdraw: "Tërhiq & fshi të dhënat",
    done_withdrawn: "Të dhënat u fshinë. Sesioni u anulua.",

    panel_title: "Panel kërkuesi",
    panel_heatmap: "Harta e nxehtësisë",
    panel_metrics: "Metrikat e provës",
    session_counter: "Numri i sesionit",
    mock_on: "Modaliteti testues (mock gaze) aktiv"
  },

  en: {
    app_title: "Neuro-Cognitive Information Design",
    app_subtitle: "Measuring digital readability through eye-tracking and biometrics",
    lang_label: "Language",
    step: "Step",
    of: "of",
    next: "Continue",
    back: "Back",
    start: "Start",
    finish: "Finish",
    loading: "Loading…",
    error_generic: "Something went wrong. Please try again.",

    welcome_title: "Welcome",
    welcome_body: "This study measures how information presentation affects reading and comprehension. The session lasts up to 30 minutes and includes webcam eye-calibration, document reading, and a short questionnaire.",
    consent_title: "Consent",
    consent_point_1: "The camera is used only to compute gaze coordinates (X, Y). No video is recorded.",
    consent_point_2: "Only anonymous data with an anonymous ID is stored. No name or email is included in the dataset.",
    consent_point_3: "Participation is voluntary. You may withdraw at any time without consequences.",
    consent_point_4: "Data is stored under GDPR and used for scientific research only.",
    consent_accept: "I agree and continue",
    consent_decline: "I do not agree",

    reg_title: "Participant details",
    reg_name: "Full name (optional)",
    reg_name_hint: "If provided, it is stored locally only; the exported dataset stays anonymous.",
    reg_age: "Age",
    reg_profession: "Profession / Field of study",
    reg_expertise: "Expertise level",
    reg_choose: "— Choose —",
    reg_required: "Please fill in the required fields.",

    setup_title: "Device setup",
    setup_body: "Sit comfortably, about 60 cm from the screen, with your face well lit. Close other apps that use the camera.",
    setup_camera_ok: "Camera is ready",
    setup_start_camera: "Enable camera",
    setup_camera_denied: "Could not open the camera. Check browser permissions.",

    calib_title: "Eye calibration (9 points)",
    calib_instr: "Look at the yellow dot and click on it. Repeat for all nine points.",
    calib_point: "Point",
    calib_measuring: "Measuring accuracy…",
    calib_result: "Mean calibration accuracy",
    calib_good: "Calibration is good. Proceeding.",
    calib_poor: "Accuracy is below the recommended threshold (<150 px).",
    calib_retry: "Recalibrate",
    calib_continue: "Continue",

    task_read_instr: "Read the document carefully. When done, click 'I have finished reading'.",
    task_do: "Your task",
    read_done: "I have finished reading",
    doc_loading: "Loading document…",

    quiz_title: "Comprehension questionnaire",
    quiz_instr: "Answer without referring back to the document.",
    quiz_question: "Question",
    quiz_submit: "Submit answer",
    quiz_select: "Select an answer before continuing.",

    tlx_title: "NASA-TLX",
    tlx_instr: "Rate your experience during the last task.",
    tlx_submit: "Submit",

    module_title: "Module",
    module_progress: "Module {i} of {n}",
    version_label: "Version",
    block: "Block",

    done_title: "Thank you!",
    done_body: "The session completed successfully. Data was stored anonymously.",
    done_download: "Download data (JSON)",
    download_gaze: "Download gaze trace (JSON)",
    done_withdraw: "Withdraw & delete data",
    done_withdrawn: "Data deleted. The session was cancelled.",

    panel_title: "Researcher panel",
    panel_heatmap: "Heatmap",
    panel_metrics: "Trial metrics",
    session_counter: "Session number",
    mock_on: "Test mode (mock gaze) active"
  }
};

let current = localStorage.getItem("ncid_lang") || "en";

export function getLang() { return current; }

export function setLang(lang) {
  current = (lang === "en") ? "en" : "al";
  localStorage.setItem("ncid_lang", current);
  document.documentElement.setAttribute("lang", current);
  applyI18n();
  window.dispatchEvent(new CustomEvent("ncid:lang", { detail: current }));
}

export function t(key, vars = {}) {
  let s = (I18N[current] && I18N[current][key]) || (I18N.al[key]) || key;
  for (const k of Object.keys(vars)) s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
  return s;
}

export function tr(obj) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[current] || obj.al || obj.en || "";
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
}

document.documentElement.setAttribute("lang", current);
