/*
 * Professions, difficulty levels and generated field definitions.
 * Each participant sees ONLY their chosen profession, across 3 levels
 * (very easy / medium / hard) in BOTH versions (A and B).
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */

export const LEVELS = [
  { id: "easy", al: "Shumë e lehtë", en: "Very easy" },
  { id: "medium", al: "Mesatare", en: "Medium" },
  { id: "hard", al: "E vështirë", en: "Hard" }
];

export const PROFESSIONS = [
  { id: "software", al: "Informatikë", en: "Software" },
  { id: "legal", al: "Drejtësi", en: "Law" },
  { id: "finance", al: "Financë", en: "Finance" },
  { id: "business", al: "Biznes", en: "Business" },
  { id: "health", al: "Mjekësi", en: "Medicine" },
  { id: "nurse", al: "Infermier", en: "Nursing" },
  { id: "pedagogue", al: "Pedagog", en: "Pedagogy" },
  { id: "biologist", al: "Biolog", en: "Biology" },
  { id: "biotech", al: "Bioteknolog", en: "Biotechnology" },
  { id: "chemist", al: "Kimist", en: "Chemistry" },
  { id: "electrical", al: "Inxhinier Elektrik", en: "Electrical Engineering" },
  { id: "cook", al: "Kuzhinier", en: "Culinary" }
];

export function materialPath(id, level, version, lang) {
  return `materials/${id}_${level}_${version.toLowerCase()}.${lang}.html`;
}

function materialsFor(id, level) {
  return {
    A: { al: materialPath(id, level, "A", "al"), en: materialPath(id, level, "A", "en") },
    B: { al: materialPath(id, level, "B", "al"), en: materialPath(id, level, "B", "en") }
  };
}

function taskFor(p, level) {
  const lvl = { easy: { al: "shumë e lehtë", en: "very easy" }, medium: { al: "mesatare", en: "medium" }, hard: { al: "e vështirë", en: "hard" } }[level];
  return {
    al: `Lexo me kujdes dokumentin (niveli ${lvl.al}) dhe pastaj përgjigju pyetjeve.`,
    en: `Read the document carefully (${lvl.en} level), then answer the questions.`
  };
}

function quizFor(p) {
  const n = p.en, a = p.al;
  return [
    { q: { al: `Cili është qëllimi kryesor i dokumentit në ${a}?`, en: `What is the main purpose of the document in ${n}?` },
      options: [ { al: "Të informojë qartë lexuesin", en: "To clearly inform the reader" }, { al: "Të zbavitë", en: "To entertain" }, { al: "Të shesë një produkt", en: "To sell a product" }, { al: "Asnjë qëllim", en: "No purpose" } ],
      correct: 0, critical: true },
    { q: { al: "Kur jepet informacioni kritik në dokument?", en: "When is critical information given in the document?" },
      options: [ { al: "Kur kushtet plotësohen", en: "When the conditions are met" }, { al: "Gjithmonë", en: "Always" }, { al: "Kurrë", en: "Never" }, { al: "Rastësisht", en: "Randomly" } ],
      correct: 0, critical: true },
    { q: { al: "Sa kushte/elementë duhen për rezultatin kryesor?", en: "How many conditions/elements are needed for the main result?" },
      options: [ { al: "1", en: "1" }, { al: "2", en: "2" }, { al: "3", en: "3" }, { al: "0", en: "0" } ],
      correct: 2, critical: false },
    { q: { al: "Nëse një kusht nuk plotësohet, çfarë ndodh?", en: "If a condition is not met, what happens?" },
      options: [ { al: "Refuzohet / kthehet mbrapsht", en: "It is refused / returned" }, { al: "Vazhdon normalisht", en: "It continues normally" }, { al: "Nuk ka efekt", en: "No effect" }, { al: "Asnjë", en: "None" } ],
      correct: 0, critical: false },
    { q: { al: "Cila paraqitje e bën më të lehtë gjetjen e informacionit?", en: "Which presentation makes finding information easier?" },
      options: [ { al: "E strukturuar / me theksime", en: "Structured / highlighted" }, { al: "E ngjeshur / pa strukturë", en: "Dense / unstructured" }, { al: "E njëjta", en: "The same" }, { al: "Nuk dihet", en: "Unknown" } ],
      correct: 0, critical: false },
    { q: { al: "Sa herë rilexoi pjesë të tekstit për t'i kuptuar?", en: "How many times did you re-read parts to understand?" },
      options: [ { al: "Asnjë herë", en: "Never" }, { al: "1–2 herë", en: "1–2 times" }, { al: "3–4 herë", en: "3–4 times" }, { al: "Shumë herë", en: "Many times" } ],
      correct: 1, critical: false },
    { q: { al: "A ishin të qarta afatet / vlerat kritike?", en: "Were the deadlines / critical values clear?" },
      options: [ { al: "Po, shumë të qarta", en: "Yes, very clear" }, { al: "Mesatarisht", en: "Somewhat" }, { al: "Jo", en: "No" }, { al: "Nuk kishte", en: "There were none" } ],
      correct: 0, critical: false },
    { q: { al: "Sa i sigurt je për përgjigjet e dhëna?", en: "How confident are you in your answers?" },
      options: [ { al: "Shumë i sigurt", en: "Very confident" }, { al: "I sigurt", en: "Confident" }, { al: "Pak i sigurt", en: "Slightly confident" }, { al: "Aspak", en: "Not at all" } ],
      correct: 0, critical: false }
  ];
}

export const FIELDS = PROFESSIONS.map((p) => ({
  id: p.id,
  name: { al: p.al, en: p.en },
  levels: Object.fromEntries(LEVELS.map((l) => [l.id, {
    task: taskFor(p, l.id),
    materials: materialsFor(p.id, l.id)
  }])),
  quiz: quizFor(p)
}));
