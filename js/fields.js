/*
 * Study structure (research protocol):
 *   12 professions x 3 expertise levels x 3 modules x 2 formats (A/B).
 *   - expertise level is a participant attribute (Fillestar / Mid / Senior)
 *   - each expertise has 3 modules of increasing complexity
 *   - every module exists in format A (structured) and B (compressed)
 *   - each format has its OWN quiz (different questions on the same text)
 *
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */

export const EXPERTISE = [
  { id: "fillestar", al: "Fillestar", en: "Beginner" },
  { id: "mid", al: "Mid", en: "Mid" },
  { id: "senior", al: "Senior", en: "Senior" }
];

export const COMPLEXITY = { m1: "basic", m2: "intermediate", m3: "advanced" };

export const PROFESSIONS = [
  { id: "software", al: "Informatikë", en: "Software" },
  { id: "legal", al: "Drejtësi", en: "Law" },
  { id: "finance", al: "Financë", en: "Finance" },
  { id: "business", al: "Biznes", en: "Business" },
  { id: "health", al: "Mjekësi", en: "Medicine" },
  { id: "nurse", al: "Infermieri", en: "Nursing" },
  { id: "pedagogue", al: "Pedagogji", en: "Pedagogy" },
  { id: "biologist", al: "Biologji", en: "Biology" },
  { id: "biotech", al: "Bioteknologji", en: "Biotechnology" },
  { id: "chemist", al: "Kimi", en: "Chemistry" },
  { id: "electrical", al: "Inxhinieri elektrike", en: "Electrical engineering" },
  { id: "cook", al: "Kuzhinieri", en: "Culinary" }
];

export function materialPath(id, expertise, mN, version, lang) {
  return `materials/${id}_${expertise}_m${mN}_${String(version).toLowerCase()}.${lang}.html`;
}

function opts(en, al) {
  return [
    { al: al[0], en: en[0] }, { al: al[1], en: en[1] },
    { al: al[2], en: en[2] }, { al: al[3], en: en[3] }
  ];
}

/* Placeholder quiz, distinct for A and B (different questions on the same text). */
function quizFor(p, expertise, mN, version) {
  const en = p.en, al = p.al;
  const vA = version === "A";
  return [
    { q: { al: `Në ${al} (${expertise}, moduli ${mN}): cili është qëllimi kryesor i tekstit?`, en: `${en} (${expertise}, module ${mN}): what is the main purpose of the text?` },
      options: opts(["To inform", "To entertain", "To sell", "None"], ["Të informojë", "Të zbavitë", "Të shesë", "Asnjë"]), correct: 0, critical: true },
    { q: { al: vA ? "Si është i organizuar informacioni?" : "Sa rreshta/të dhëna përmban blloku?", en: vA ? "How is the information organised?" : "How many lines/items does the block contain?" },
      options: opts(["Clearly separated", "Compressed", "Unordered", "Missing"], ["Të ndara qartë", "Të ngjeshura", "Pa rend", "Mungojnë"]), correct: vA ? 0 : 1, critical: false },
    { q: { al: "Sa kushte/elementë janë të nevojshëm për rezultatin kryesor?", en: "How many conditions/elements are needed for the main result?" },
      options: opts(["1", "2", "3", "0"], ["1", "2", "3", "0"]), correct: 2, critical: false },
    { q: { al: "Çfarë ndodh nëse një kusht nuk plotësohet?", en: "What happens if a condition is not met?" },
      options: opts(["It is refused", "It continues", "No effect", "Unknown"], ["Refuzohet", "Vazhdon", "Pa efekt", "Nuk dihet"]), correct: 0, critical: false },
    { q: { al: "Kush është përdoruesi/objekti kryesor i këtij informacioni?", en: "Who is the main user/subject of this information?" },
      options: opts(["A practitioner of the field", "A child", "A tourist", "Nobody"], ["Një profesionist i fushës", "Një fëmijë", "Një turist", "Askush"]), correct: 0, critical: false },
    { q: { al: "Sa herë rilexove pjesë të tekstit?", en: "How many times did you re-read parts of the text?" },
      options: opts(["Never", "1-2", "3-4", "Many"], ["Asnjëherë", "1-2", "3-4", "Shumë"]), correct: 1, critical: false },
    { q: { al: "A u regjistrua ndonjë vlerë/numër kritik?", en: "Was any critical value/number recorded?" },
      options: opts(["Yes", "No", "Unsure", "None given"], ["Po", "Jo", "Nuk jam i sigurt", "Nuk jepet"]), correct: 0, critical: true },
    { q: { al: "Sa i sigurt je për përgjigjet?", en: "How confident are you in your answers?" },
      options: opts(["Very", "Somewhat", "Little", "Not at all"], ["Shumë", "Mesatarisht", "Pak", "Aspak"]), correct: 0, critical: false }
  ];
}

function modulesFor(p, expertiseId) {
  return [1, 2, 3].map((n) => {
    const v = "m" + n;
    const materials = {
      A: { al: materialPath(p.id, expertiseId, n, "A", "al"), en: materialPath(p.id, expertiseId, n, "A", "en") },
      B: { al: materialPath(p.id, expertiseId, n, "B", "al"), en: materialPath(p.id, expertiseId, n, "B", "en") }
    };
    return {
      id: v,
      complexity: COMPLEXITY[v],
      materials,
      quiz: { A: quizFor(p, expertiseId, n, "A"), B: quizFor(p, expertiseId, n, "B") }
    };
  });
}

export const FIELDS = PROFESSIONS.map((p) => {
  const expertise = {};
  EXPERTISE.forEach((e) => { expertise[e.id] = { modules: modulesFor(p, e.id) }; });
  return { id: p.id, name: { al: p.al, en: p.en }, expertise };
});
