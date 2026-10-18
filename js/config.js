/*
 * NCID study configuration. Professions/levels live in js/fields.js.
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */

import { FIELDS, EXPERTISE } from "./fields.js?v=31";

export const CONFIG = {
  study: {
    title: "Neuro-Cognitive Information Design",
    design: "within",              // each participant reads both A and B
    modulesPerSession: 3,          // 3 modules per expertise level
    quizPerDoc: 8,
    nasaTlx: "perModule",
    useJsPsych: false,
    calibrationThresholdPx: 150,
    calibrationMaxAttempts: 2,
    mouseFallback: true,
    fixationDispersionPx: 40,
    fixationMinDurationMs: 100
  },

  // Where the session is stored. Supabase publishable key = client-safe (RLS insert-only).
  storage: {
    supabase: {
      url: "https://kvfqvnvlledzzxstgdch.supabase.co",
      anonKey: "sb_publishable_98Vch8De9ZGxo1ofHMxDzA_ZS8ZpfUv"
    },
    submission: {
      // Direct path: the browser posts to the Google Apps Script endpoint, which
      // emails the full report (name, ID, profession, results, NASA-TLX, answers,
      // biometrics) to the researcher. No server or Edge Function needed.
      url: null,
      fallbackUrl: "https://script.google.com/macros/s/AKfycbw7e1yJvFui_uXsxkkAg8aHPtGAQ3jAh90YOKE82K-gXdbrzmvGtOad6Jivt3ukTYn2/exec",
      fallbackToken: "ncid_k9f3Xq2Lm7Pz",
      includeGaze: false
    },
    backend: { url: null },        // optional Spring Boot API
    keyName: "ncid_session_buffer_v1",
    langKey: "ncid_lang",
    counterKey: "ncid_session_counter"
  },

  // Only this account may read the data (admin login).
  adminEmail: "arditceno82@gmail.com",
  adminAuth: true,   // require Supabase login for the admin panel

  // Email delivery of the full report (PDF with node map + hashmap).
  email: {
    to: "arditceno82@gmail.com",
    emailjs: { publicKey: null, serviceId: null, templateId: null }  // fill to enable client-side send
  },

  cdn: {
    webgazer: "https://webgazer.cs.brown.edu/webgazer.js",
    heatmap: "vendor/heatmap.min.js",
    mediapipeFaceMesh: "mediapipe/face_mesh/face_mesh.js",
    mouseview: null,
    jsPsych: "https://unpkg.com/jspsych@7.3.4",
    jsPsychHtmlButton: "https://unpkg.com/@jspsych/plugin-html-button-response@1.1.3",
    jsPsychSurveyLikert: "https://unpkg.com/@jspsych/plugin-survey-likert@1.1.3",
    jsPDF: "vendor/jspdf.umd.min.js",
    emailjs: "vendor/email.min.js"
  },

  fields: FIELDS,

  nasaTlx: [
    { id: "mental", al: "Kërkesa mendore", en: "Mental demand", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "physical", al: "Kërkesa fizike", en: "Physical demand", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "temporal", al: "Kërkesa kohore", en: "Temporal demand", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "performance", al: "Performanca", en: "Performance", low: { al: "E mirë", en: "Good" }, high: { al: "E dobët", en: "Poor" } },
    { id: "effort", al: "Përpjekja", en: "Effort", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "frustration", al: "Frustrimi", en: "Frustration", low: { al: "I ulët", en: "Low" }, high: { al: "I lartë", en: "High" } }
  ],

  expertiseLevels: EXPERTISE
};

/*
 * Private overrides: create js/config.local.js (gitignored) with window.NCID_LOCAL.
 * Never wipes defaults with null values.
 */
if (typeof window !== "undefined" && window.NCID_LOCAL) {
  const local = window.NCID_LOCAL;
  if (local.storage) {
    for (const k of Object.keys(local.storage)) {
      const v = local.storage[k];
      if (v == null) continue;
      if (typeof v === "object" && !Array.isArray(v)) {
        const clean = {};
        for (const j of Object.keys(v)) if (v[j] != null) clean[j] = v[j];
        CONFIG.storage[k] = Object.assign({}, CONFIG.storage[k], clean);
      } else {
        CONFIG.storage[k] = v;
      }
    }
  }
  if (local.email) CONFIG.email = Object.assign({}, CONFIG.email, local.email);
  if (local.study) Object.assign(CONFIG.study, local.study);
  if (local.cdn) Object.assign(CONFIG.cdn, local.cdn);
}
