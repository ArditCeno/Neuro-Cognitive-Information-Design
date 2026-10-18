/*
 * Diagram specs - group C: nursing, pedagogy, biology, biotechnology.
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { S, svg, tx, bx, ln, VS, HF, TC, TB, FM, CODE, BR, MX, PY, CY, wrapText,
  N, B, B2, O, G, LB, LO, BD } from "./lib.mjs";

export function register(add) {
  /* ===== NURSING ===== */
  add("nurse_fillestar_m1", "Nursing process", CY([
    ["Assessment", "gather data"],
    ["Diagnosis", "nursing dx"],
    ["Planning", "set objectives"],
    ["Implementation", "intervene"],
    ["Evaluation", "check outcomes"]
  ], { h: 400 }));

  add("nurse_fillestar_m2", "Hand hygiene (WHO 5 moments)", VS([
    "Before patient contact",
    "Before an aseptic procedure",
    "After body fluid exposure",
    "After patient contact",
    "After contact with the patient's surroundings"
  ]));

  add("nurse_fillestar_m3", "Rights and communication", (() => {
    let g = "";
    ["Confidentiality of patient data", "Informed consent", "Identify the patient with 2 identifiers", "Clear and respectful communication", "Accurate and timely documentation"].forEach((t, i) => {
      const y = 60 + i * 44;
      g += `<circle cx="34" cy="${y + 15}" r="13" fill="${B}"/>` + tx(34, y + 20, String(i + 1), { size: 12.5, fill: "#fff", anchor: "middle", w: 700 }) + tx(60, y + 20, t, { size: 13 }) + ln(24, y + 34, 616, y + 34, { stroke: BD });
    });
    return svg("Rights and communication", 286, g);
  })());

  add("nurse_mid_m1", "Parameters", TB(["Parameter", "Normal (adult)"], [["Pulse", "60-100 /min"], ["Respiration", "12-20 /min"], ["Blood pressure", "about < 120/80"], ["Temperature", "36.1-37.2 C"], ["SpO2", ">= 95%"]]));

  add("nurse_mid_m2", "Assessment (GCS)", (() => {
    let g = "";
    g += bx(24, 56, 288, 200, "#F4F8FA") + tx(40, 82, "Glasgow Coma Scale", { size: 13, w: 700, fill: B2 });
    [["Eyes", "1-4"], ["Verbal", "1-5"], ["Motor", "1-6"], ["Total", "3-15"]].forEach(([a, b], i) => { g += tx(40, 118 + i * 34, a, { size: 12.5 }) + tx(200, 118 + i * 34, b, { size: 12.5, mono: true, fill: B2 }); });
    g += bx(328, 56, 288, 200, LO) + tx(344, 82, "Interpretation", { size: 13, w: 700, fill: "#7a2b12" });
    ["GCS 15 = fully alert", "GCS <= 8 = severe (airway risk)", "Pain 0-10", "Full head-to-toe assessment"].forEach((t, i) => g += tx(344, 118 + i * 34, "\u2022 " + t, { size: 12 }));
    return svg("Assessment (GCS)", 276, g);
  })());

  add("nurse_mid_m3", "Medication (5 rights)", (() => {
    let g = "";
    [["1", "Right patient"], ["2", "Right drug"], ["3", "Right dose"], ["4", "Right route"], ["5", "Right time"]].forEach(([a, b], i) => {
      const x = 24 + i * 120;
      g += `<rect x="${x}" y="70" width="104" height="96" rx="10" fill="${i % 2 ? LO : LB}" stroke="${BD}"/>` + tx(x + 52, 118, a, { size: 26, anchor: "middle", w: 700, fill: B2 }) + tx(x + 52, 144, b, { size: 10, anchor: "middle", fill: G });
    });
    g += tx(24, 204, "Check allergies  \u2022  document after administration  \u2022  monitor side effects", { size: 12 });
    g += tx(24, 228, "When in doubt: stop and verify.", { size: 12, fill: G });
    return svg("Medication (5 rights)", 244, g);
  })());

  add("nurse_senior_m1", "Prioritisation", (() => {
    const p = PY(["Physiological needs", "Safety", "Social / belonging", "Esteem", "Self-actualisation"]);
    let g = p.g;
    g += tx(24, 66, "ABC: airway - breathing - circulation", { size: 12.5, w: 700, fill: B2 });
    g += tx(24, p.h + 24, "Prioritise life threats first. Delegate the right task to the right staff. Reassess continuously.", { size: 11.5, fill: G });
    return svg("Prioritisation", p.h + 40, g);
  })());

  add("nurse_senior_m2", "Triage and emergency (START)", (() => {
    let g = "";
    const cols = [["Red", "Immediate", "#F8C9C9"], ["Yellow", "Delayed", "#FEF7C3"], ["Green", "Minor (walking)", "#DEFCE7"], ["Black", "Deceased / unsurvivable", "#D9DEE1"]];
    cols.forEach(([t, d, c], i) => {
      const x = 24 + i * 150;
      g += `<rect x="${x}" y="70" width="136" height="96" rx="10" fill="${c}" stroke="${BD}"/>` + tx(x + 68, 116, t, { size: 15, anchor: "middle", w: 700, fill: N }) + tx(x + 68, 142, d, { size: 10, anchor: "middle", fill: N });
    });
    g += tx(24, 210, "START: walking?  breathing?  capillary refill?  consciousness?", { size: 12.5, fill: B2 });
    return svg("Triage and emergency (START)", 234, g);
  })());

  add("nurse_senior_m3", "Emergency case (SBAR)", (() => {
    let g = "";
    [["S", "Situation", "what is happening now"], ["B", "Background", "relevant history"], ["A", "Assessment", "what you think is wrong"], ["R", "Recommendation", "what you need"]].forEach(([a, b, c], i) => {
      const y = 60 + i * 56;
      g += `<rect x="24" y="${y}" width="56" height="46" rx="8" fill="${B}"/>` + tx(52, y + 30, a, { size: 20, anchor: "middle", w: 700, fill: "#fff" });
      g += tx(96, y + 20, b, { size: 13, w: 700, fill: B2 }) + tx(96, y + 38, c, { size: 11.5, fill: G });
    });
    g += tx(24, 300, "Activate the response team, monitor continuously, document the chronology.", { size: 11.5, fill: G });
    return svg("Emergency case (SBAR)", 318, g);
  })());

  /* ===== PEDAGOGY ===== */
  add("pedagogue_fillestar_m1", "Lesson plan", HF(["Introduction\n(motivation)", "Development\n(content)", "Consolidation\n(practice)", "Assessment\n+ homework"], { h: 150 }));

  add("pedagogue_fillestar_m2", "Objectives", TC(
    "Use measurable verbs",
    ["list", "compare", "solve", "one objective = one outcome", "linked to assessment"],
    "Avoid vague verbs",
    ["understand", "know", "appreciate", "be aware of", "learn about"]
  ));

  add("pedagogue_fillestar_m3", "Classroom management", (() => {
    let g = "";
    ["Clear, few, positive rules", "Routines for start and end", "Positive reinforcement", "Predictable consequences", "Respectful relationships"].forEach((t, i) => {
      const y = 60 + i * 44;
      g += `<circle cx="34" cy="${y + 15}" r="13" fill="${O}"/>` + tx(34, y + 20, String(i + 1), { size: 12.5, fill: "#fff", anchor: "middle", w: 700 }) + tx(60, y + 20, t, { size: 13 }) + ln(24, y + 34, 616, y + 34, { stroke: BD });
    });
    return svg("Classroom management", 286, g);
  })());

  add("pedagogue_mid_m1", "Organising concepts", (() => {
    let g = "";
    g += `<circle cx="320" cy="130" r="46" fill="${O}"/>` + tx(320, 135, "topic", { size: 13, anchor: "middle", fill: "#fff", w: 700 });
    [[150, 60], [150, 200], [490, 60], [490, 200]].forEach(([x, y], i) => {
      g += ln(320, 130, x, y, { stroke: B, w: 1.4 });
      g += `<circle cx="${x}" cy="${y}" r="34" fill="${LB}" stroke="${B}"/>` + tx(x, y + 4, "sub " + (i + 1), { size: 11, anchor: "middle" });
    });
    g += tx(24, 268, "From general to specific  -  build on prior knowledge  -  spiral: revisit deeper", { size: 11.5, fill: G });
    return svg("Organising concepts", 286, g);
  })());

  add("pedagogue_mid_m2", "Assessment", TC(
    "Formative",
    ["during learning", "to improve", "specific, timely feedback", "self-assessment"],
    "Summative",
    ["at the end", "for a grade", "criteria and rubrics", "measures achievement"]
  ));

  add("pedagogue_mid_m3", "Bloom's taxonomy", PY(["Remember", "Understand", "Apply", "Analyse", "Evaluate", "Create"]));

  add("pedagogue_senior_m1", "Integrating models", (() => {
    let g = "";
    const M = [["Constructivism", "the learner builds knowledge"], ["Behaviourism", "stimulus - response - reinforcement"], ["Cognitivism", "information processing"], ["Vygotsky", "zone of proximal development (ZPD)"]];
    M.forEach(([t, d], i) => {
      const x = 24 + (i % 2) * 300, y = 56 + Math.floor(i / 2) * 96;
      g += bx(x, y, 284, 84, i % 2 ? "#F4F8FA" : LB) + tx(x + 16, y + 32, t, { size: 13, w: 700, fill: B2 }) + tx(x + 16, y + 58, d, { size: 11.5, fill: G });
    });
    g += tx(24, 268, "Combine the models by goal and by students.", { size: 12 });
    return svg("Integrating models", 282, g);
  })());

  add("pedagogue_senior_m2", "Planning (backward design)", (() => {
    let g = "";
    [["Step 1", "Desired results"], ["Step 2", "Assessment evidence"], ["Step 3", "Learning activities"]].forEach(([a, b], i) => {
      const y = 60 + i * 62;
      g += bx(24, y, 592, 48, i % 2 ? LO : LB) + tx(40, y + 30, a, { size: 13, w: 700, fill: B2 }) + tx(140, y + 30, b, { size: 13 });
      if (i < 2) g += ln(320, y + 48, 320, y + 62, { marker: true });
    });
    g += tx(24, 268, "Alignment of objective - assessment - activity.  Review after implementation.", { size: 11.5, fill: G });
    return svg("Planning (backward design)", 284, g);
  })());

  add("pedagogue_senior_m3", "Differentiation and inclusion", (() => {
    let g = "";
    g += tx(24, 76, "Differentiation:  content  -  process  -  product", { size: 13, w: 700, fill: B2 });
    g += bx(24, 94, 592, 70, LB) + tx(40, 122, "Different levels of tasks", { size: 12.5 }) + tx(40, 146, "Flexible groups  -  continuous monitoring", { size: 12.5, fill: G });
    g += tx(24, 200, "UDL: multiple means of", { size: 13, w: 700, fill: B2 });
    ["Representation", "Expression", "Engagement"].forEach((t, i) => g += bx(24 + i * 200, 214, 184, 46, LO) + tx(116 + i * 200, 243, t, { size: 12.5, anchor: "middle" }));
    return svg("Differentiation and inclusion", 288, g);
  })());

  /* ===== BIOLOGY ===== */
  add("biologist_fillestar_m1", "Classification", (() => {
    const p = PY(["Species", "Genus", "Family", "Order", "Class", "Phylum", "Kingdom", "Domain"], {});
    let g = p.g;
    g += tx(24, 60, "Ranks (bottom to top)", { size: 12.5, w: 700, fill: B2 });
    g += tx(24, p.h + 22, "3 domains: Bacteria, Archaea, Eukarya.  Binomial name = genus + species (Homo sapiens).", { size: 11.5, fill: G });
    return svg("Classification", p.h + 38, g);
  })());

  add("biologist_fillestar_m2", "Cell diagram", (() => {
    let g = "";
    g += `<rect x="70" y="70" width="240" height="170" rx="14" fill="#EFF7F0" stroke="#4f8f5a" stroke-width="2"/>` + tx(190, 232, "cell wall (plants)", { size: 10.5, anchor: "middle", fill: "#3f7a4a" });
    g += `<circle cx="190" cy="150" r="180" fill="none" stroke="none"/>`;
    g += `<circle cx="150" cy="140" r="34" fill="${LB}" stroke="${B}"/>` + tx(150, 144, "nucleus", { size: 10, anchor: "middle" });
    [[250, 110], [250, 175], [110, 200]].forEach(([x, y]) => g += `<ellipse cx="${x}" cy="${y}" rx="26" ry="12" fill="${LO}" stroke="${O}"/>` + tx(x, y + 4, "mito.", { size: 9, anchor: "middle", fill: "#7a2b12" }));
    g += `<circle cx="185" cy="195" r="6" fill="${G}"/>` + tx(185, 214, "ribosome", { size: 9, anchor: "middle", fill: G });
    g += `<ellipse cx="215" cy="112" rx="20" ry="12" fill="#DFF0D8" stroke="#3f7a4a"/>` + tx(215, 116, "chloro.", { size: 9, anchor: "middle", fill: "#3f7a4a" });
    g += tx(340, 100, "Nucleus: genetic material", { size: 12 });
    g += tx(340, 128, "Mitochondria: ATP production", { size: 12 });
    g += tx(340, 156, "Ribosomes: protein synthesis", { size: 12 });
    g += tx(340, 184, "Chloroplast: photosynthesis", { size: 12 });
    g += tx(340, 212, "Cell wall: plants, not animals", { size: 12 });
    return svg("Cell diagram", 276, g);
  })());

  add("biologist_fillestar_m3", "Basic genetics (Punnett square)", (() => {
    let g = "";
    g += tx(24, 76, "Cross  Aa x Aa", { size: 13, w: 700, fill: B2 });
    const X = 60, Y = 96, c = 80;
    g += tx(X - 26, Y + 34, "A", { size: 14, anchor: "middle", fill: B2 }) + tx(X - 26, Y + 114, "a", { size: 14, anchor: "middle", fill: B2 });
    g += tx(X + 34, Y - 12, "A", { size: 14, anchor: "middle", fill: B2 }) + tx(X + 114, Y - 12, "a", { size: 14, anchor: "middle", fill: B2 });
    const cells = [["AA", "#DFF0D8"], ["Aa", "#EFF7F0"], ["Aa", "#EFF7F0"], ["aa", LO]];
    cells.forEach(([t, f], i) => {
      const cx = X + (i % 2) * c, cy = Y + Math.floor(i / 2) * c;
      g += `<rect x="${cx}" y="${cy}" width="${c}" height="${c}" fill="${f}" stroke="${BD}"/>` + tx(cx + c / 2, cy + c / 2 + 6, t, { size: 16, anchor: "middle", mono: true, fill: N });
    });
    g += tx(340, 130, "Genotype: 1 AA : 2 Aa : 1 aa", { size: 12.5, fill: B2, mono: true });
    g += tx(340, 158, "Phenotype: 3 : 1", { size: 12.5, fill: B2, mono: true });
    g += tx(340, 190, "Dominant A  -  recessive a", { size: 12, fill: G });
    return svg("Basic genetics (Punnett square)", 276, g);
  })());

  add("biologist_mid_m1", "Photosynthesis and respiration", (() => {
    let g = "";
    g += bx(24, 60, 288, 96, "#EFF7F0", "#9fd0a8") + tx(40, 88, "Photosynthesis", { size: 13, w: 700, fill: "#3f7a4a" }) + tx(40, 114, "6CO2 + 6H2O + light", { size: 12, mono: true }) + tx(40, 136, "-> C6H12O6 + 6O2", { size: 12, mono: true });
    g += bx(328, 60, 288, 96, LO) + tx(344, 88, "Cellular respiration", { size: 13, w: 700, fill: "#7a2b12" }) + tx(344, 114, "C6H12O6 + 6O2", { size: 12, mono: true }) + tx(344, 136, "-> 6CO2 + 6H2O + ATP", { size: 12, mono: true });
    g += ln(312, 108, 328, 108, { marker: true }) ;
    g += ln(328, 120, 312, 120, { marker: true });
    g += tx(24, 196, "Photosynthesis stores energy; respiration releases it.", { size: 12 });
    g += tx(24, 224, "Glycolysis in the cytoplasm; Krebs cycle in the mitochondrial matrix.", { size: 12, fill: G });
    return svg("Photosynthesis and respiration", 242, g);
  })());

  add("biologist_mid_m2", "Cell cycle and division", CY([
    ["G1", "growth"],
    ["S", "DNA replication"],
    ["G2", "growth"],
    ["M", "mitosis"]
  ]));

  add("biologist_mid_m3", "Biogeochemical cycles", (() => {
    let g = "";
    const ring = (cx, cy, r, labels, title) => {
      let s = tx(cx - 70, cy - r - 8, title, { size: 12, w: 700, fill: B2 });
      const pt = (deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
      for (let i = 0; i < labels.length; i++) {
        const a0 = -90 + (360 / labels.length) * i + 22, a1 = -90 + (360 / labels.length) * (i + 1) - 22;
        const [sx, sy] = pt(a0), [ex, ey] = pt(a1);
        s += `<path d="M${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}" fill="none" stroke="${N}" stroke-width="1.1" marker-end="url(#ar)"/>`;
      }
      labels.forEach((l, i) => { const [x, y] = pt(-90 + (360 / labels.length) * i); s += `<circle cx="${x}" cy="${y}" r="24" fill="${LB}" stroke="${B}"/>` + wrapText(l, 9).slice(0, 2).forEach((t, k) => s += tx(x, y + (wrapText(l, 9).length === 1 ? 4 : -2 + k * 12), t, { size: 9, anchor: "middle" })); });
      return s;
    };
    g += ring(160, 190, 70, ["CO2", "plants", "animals", "soil"], "Carbon");
    g += ring(470, 190, 70, ["fixation", "nitrification", "plants", "denitrification"], "Nitrogen");
    g += tx(24, 300, "Water cycle: evaporation - condensation - precipitation.  Human activity raises atmospheric CO2.", { size: 11.5, fill: G });
    return svg("Biogeochemical cycles", 316, g);
  })());

  add("biologist_senior_m1", "Systems and homeostasis", (() => {
    let g = "";
    g += bx(24, 66, 200, 52, LB) + tx(124, 98, "Set point", { size: 12.5, anchor: "middle" });
    g += ln(224, 92, 300, 92, { marker: true });
    g += bx(300, 66, 316, 52, "#F4F8FA") + tx(458, 98, "Negative feedback", { size: 12.5, anchor: "middle", w: 700, fill: B2 });
    g += ln(458, 118, 458, 168) + ln(458, 168, 124, 168) + ln(124, 168, 124, 118, { marker: true }) + tx(280, 186, "returns the value toward the set point", { size: 11.5, fill: G });
    g += tx(24, 226, "Insulin lowers blood glucose; glucagon raises it.", { size: 12 });
    g += tx(24, 252, "Thermoregulation: sweating, shivering.  Positive feedback reinforces (e.g. birth).", { size: 12 });
    return svg("Systems and homeostasis", 270, g);
  })());

  add("biologist_senior_m2", "Population and ecosystem ecology", (() => {
    let g = "";
    g += `<polygon points="320,60 220,140 420,140" fill="#FEF7C3" stroke="${BD}"/>` + tx(320, 112, "producers", { size: 10, anchor: "middle" });
    g += `<polygon points="250,144 390,144 370,196 270,196" fill="#DFF0D8" stroke="${BD}"/>` + tx(320, 176, "herbivores  ~10%", { size: 10, anchor: "middle" });
    g += `<polygon points="286,200 354,200 344,240 296,240" fill="${LO}" stroke="${BD}"/>` + tx(320, 226, "carnivores", { size: 10, anchor: "middle" });
    g += tx(440, 90, "10% rule", { size: 13, w: 700, fill: B2 });
    g += tx(440, 116, "~10% of energy", { size: 11.5, fill: G }) + tx(440, 134, "passes up a level", { size: 11.5, fill: G });
    g += tx(24, 268, "Logistic growth is limited by carrying capacity (K).  Hardy-Weinberg: p^2 + 2pq + q^2 = 1.", { size: 11.5, fill: G });
    return svg("Population and ecosystem ecology", 286, g);
  })());

  add("biologist_senior_m3", "Evolution and biodiversity", VS([
    "Variation exists in the population",
    "Variation is inherited",
    "Differential reproduction (selection)",
    "Mutations create new variation",
    "Genetic drift: random, strong in small populations",
    "Speciation: reproductive isolation",
    "Habitat loss is the main driver of species loss"
  ]));

  /* ===== BIOTECHNOLOGY ===== */
  add("biotech_fillestar_m1", "Central dogma", (() => {
    let g = "";
    g += bx(36, 90, 150, 60, LB) + tx(111, 126, "DNA", { size: 16, anchor: "middle", mono: true });
    g += ln(186, 120, 246, 120, { marker: true }) + tx(216, 110, "transcription", { size: 10, anchor: "middle", fill: G });
    g += bx(246, 90, 150, 60, "#EFF7F0", "#9fd0a8") + tx(321, 126, "RNA", { size: 16, anchor: "middle", mono: true });
    g += ln(396, 120, 456, 120, { marker: true }) + tx(426, 110, "translation", { size: 10, anchor: "middle", fill: G });
    g += bx(456, 90, 150, 60, LO) + tx(531, 126, "Protein", { size: 16, anchor: "middle", mono: true, fill: "#7a2b12" });
    g += tx(36, 200, "Transcription in the nucleus (eukaryotes); translation on ribosomes.", { size: 12 });
    g += tx(36, 228, "Codon = 3 nucleotides.  START codon = AUG (methionine).", { size: 12, fill: G });
    return svg("Central dogma", 244, g);
  })());

  add("biotech_fillestar_m2", "Basic terms", (() => {
    let g = "";
    const T = [["Plasmid", "small circular DNA"], ["Vector", "carrier of a gene"], ["Restriction enzyme", "cuts DNA at specific sites"], ["Ligase", "joins fragments"], ["GMO", "organism with modified DNA"]];
    T.forEach(([t, d], i) => {
      const x = 24 + (i % 2) * 300, y = 56 + Math.floor(i / 2) * 84;
      g += bx(x, y, 284, 72, i % 2 ? "#F4F8FA" : LB) + tx(x + 16, y + 30, t, { size: 12.5, w: 700, fill: B2 }) + tx(x + 16, y + 52, d, { size: 11.5, fill: G });
    });
    return svg("Basic terms", 260, g);
  })());

  add("biotech_fillestar_m3", "PCR scheme", (() => {
    let g = "";
    [["Denaturation", "94-98 C", O], ["Annealing", "50-65 C", B], ["Extension", "72 C", G]].forEach(([t, tmp, c], i) => {
      const y = 60 + i * 52;
      g += bx(24, y, 300, 42, i % 2 ? "#F4F8FA" : LB) + tx(40, y + 27, t, { size: 12.5, w: 700, fill: c }) + tx(240, y + 27, tmp, { size: 12.5, mono: true, fill: B2 });
    });
    g += ln(324, 90, 324, 150, { marker: true });
    g += bx(360, 60, 256, 42, LO) + tx(488, 87, "Each cycle doubles the copies", { size: 12, anchor: "middle", fill: "#7a2b12" });
    g += bx(360, 112, 256, 42, LB) + tx(488, 139, "After n cycles:  2^n copies", { size: 13, anchor: "middle", mono: true, fill: B2 });
    g += tx(24, 244, "1 template -> 2^n copies (theoretically).", { size: 12, fill: G });
    return svg("PCR scheme", 262, g);
  })());

  add("biotech_mid_m1", "Gel electrophoresis", (() => {
    let g = "";
    g += `<rect x="80" y="60" width="480" height="180" rx="8" fill="#EFF7F0" stroke="#9fd0a8"/>`;
    [[140, "ladder"], [230, "sample 1"], [320, "sample 2"], [410, "sample 3"]].forEach(([x, t]) => {
      g += `<line x1="${x}" y1="60" x2="${x}" y2="240" stroke="${BD}" stroke-dasharray="3 4"/>`;
      g += tx(x, 54, t, { size: 9.5, anchor: "middle", fill: G });
    });
    [[140, 80], [140, 100], [140, 120], [140, 140]].forEach(([x, y]) => g += `<rect x="${x - 12}" y="${y}" width="24" height="4" fill="${B}"/>`);
    [[230, 150, 22], [320, 120, 22], [410, 170, 22], [230, 190, 14], [320, 200, 14]].forEach(([x, y, w]) => g += `<rect x="${x - w / 2}" y="${y}" width="${w}" height="4" fill="${N}" opacity=".75"/>`);
    g += tx(24, 264, "DNA is negatively charged -> moves toward the anode (+).  Small fragments move farther.", { size: 11.5, fill: G });
    return svg("Gel electrophoresis", 282, g);
  })());

  add("biotech_mid_m2", "Solutions and dilution", FM([
    "C1 V1 = C2 V2",
    "Stock 5 M -> 100 mL of 0.5 M :  V1 = 10 mL",
    "M = n / V   (mol/L)",
    "use clean / sterile water",
    "label with date, contents, concentration"
  ]));

  add("biotech_mid_m3", "Sterile technique and safety", VS([
    "Work near a flame or in a biosafety cabinet",
    "Surface disinfection (e.g. 70% ethanol)",
    "Personal protective equipment (PPE)",
    "Biological waste in special containers (autoclaving)",
    "Document in a lab notebook"
  ]));

  add("biotech_senior_m1", "Gene cloning", VS([
    "Isolate the gene / DNA",
    "Cut with restriction enzymes",
    "Ligate into a vector",
    "Transform into bacteria (e.g. E. coli)",
    "Select (antibiotic) and verify (sequencing)"
  ]));

  add("biotech_senior_m2", "CRISPR-Cas9", (() => {
    let g = "";
    g += bx(24, 64, 592, 52, "#F4F8FA") + tx(40, 96, "Cas9 + guide RNA (gRNA)  ->  double-strand break (DSB)", { size: 12.5, mono: true, fill: B2 });
    g += ln(320, 116, 320, 148, { marker: true });
    g += bx(24, 148, 288, 70, LB) + tx(40, 178, "NHEJ", { size: 13, w: 700, fill: B2 }) + tx(40, 200, "often indels  ->  knockout", { size: 11.5, fill: G });
    g += bx(328, 148, 288, 70, LO) + tx(344, 178, "HDR", { size: 13, w: 700, fill: "#7a2b12" }) + tx(344, 200, "precise edit with a template", { size: 11.5, fill: G });
    g += tx(24, 248, "A PAM (e.g. NGG for SpCas9) is needed near the target.  Risk: off-target cuts.", { size: 11.5, fill: G });
    return svg("CRISPR-Cas9", 266, g);
  })());

  add("biotech_senior_m3", "Validation", (() => {
    let g = "";
    g += bx(24, 60, 592, 60, "#F4F8FA") + tx(320, 96, "Validation shows the method works for its purpose", { size: 13, anchor: "middle", w: 700, fill: B2 });
    g += tx(40, 156, "Parameters", { size: 12.5, w: 700, fill: B2 });
    ["accuracy", "precision", "specificity", "linearity", "LOD", "LOQ"].forEach((t, i) => g += bx(24 + i * 100, 168, 90, 40, i % 2 ? LO : LB) + tx(69 + i * 100, 192, t, { size: 11.5, anchor: "middle" }));
    g += tx(24, 250, "Positive and negative controls.  Replicates (e.g. n=3) and statistics.", { size: 11.5, fill: G });
    g += tx(24, 274, "GMP / IQ-OQ-PQ for equipment.", { size: 11.5, fill: G });
    return svg("Validation", 292, g);
  })());
}
