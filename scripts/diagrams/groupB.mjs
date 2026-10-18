/*
 * Diagram specs - group B: chemistry, culinary, electrical, medicine.
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { S, svg, tx, bx, ln, VS, HF, TC, TB, FM, CODE, BR, MX, PY, CY, wrapText,
  N, B, B2, O, G, LB, LO, BD } from "./lib.mjs";

export function register(add) {
  /* ===== CHEMISTRY ===== */
  add("chemist_fillestar_m1", "Formulas and molar masses", TB(["Formula", "M (g/mol)"], [["H2O", "18"], ["CO2", "44"], ["NaCl", "58.5"], ["H2SO4", "98"]]));

  add("chemist_fillestar_m2", "Simple reactions", FM([
    "2H2 + O2  ->  2H2O",
    "Mg + 2HCl  ->  MgCl2 + H2",
    "HCl + NaOH  ->  NaCl + H2O",
    "substance + O2  ->  CO2 + H2O",
    "mass of reactants = mass of products"
  ]));

  add("chemist_fillestar_m3", "pH scale", (() => {
    const X0 = 40, X1 = 600, Y = 110, w = X1 - X0; let g = "";
    const grads = ["#b91c1c", "#dc6a3a", "#e8a13a", "#7bbf6a", "#2f9e66", "#1f7f8f", "#22539a", "#2b2f8f"];
    grads.forEach((c, i) => g += `<rect x="${X0 + (w / 8) * i}" y="${Y}" width="${w / 8}" height="30" fill="${c}"/>`);
    ["0", "7", "14"].forEach((t, i) => g += tx(X0 + (w / 2) * i, Y + 52, t, { size: 12, anchor: "middle", fill: B2, w: 700 }));
    g += tx(110, Y - 16, "acid", { size: 12, anchor: "middle", fill: "#b91c1c" }) + tx(320, Y - 16, "neutral", { size: 12, anchor: "middle", fill: G }) + tx(560, Y - 16, "basic", { size: 12, anchor: "middle", fill: B2 });
    g += tx(40, 60, "pH = -log[H+]     each unit = 10x change     0.01 M HCl -> pH 2", { size: 12.5 });
    return svg("pH scale", 200, g);
  })());

  add("chemist_mid_m1", "Balancing equations", FM([
    "C3H8 + 5O2  ->  3CO2 + 4H2O",
    "4Fe + 3O2  ->  2Fe2O3",
    "N2 + 3H2  ->  2NH3",
    "equal atoms on both sides",
    "change coefficients, not subscripts"
  ]));

  add("chemist_mid_m2", "Stoichiometry", (() => {
    let g = "";
    g += bx(60, 70, 200, 56, LB) + tx(160, 104, "CH4", { size: 15, anchor: "middle", mono: true }) + tx(160, 162, "16 g  (1 mol)", { size: 11.5, anchor: "middle", fill: G });
    g += ln(260, 98, 380, 98, { marker: true }) + tx(320, 88, "+ 2 O2", { size: 12, anchor: "middle", fill: B2 });
    g += bx(380, 70, 200, 56, LO) + tx(480, 104, "CO2 + 2H2O", { size: 14, anchor: "middle", mono: true, fill: "#7a2b12" }) + tx(480, 162, "44 g CO2", { size: 11.5, anchor: "middle", fill: G });
    g += tx(24, 216, "Molar ratios come from the coefficients.", { size: 12 });
    g += tx(24, 240, "Limiting reactant runs out first.   % yield = actual / theoretical x 100", { size: 11.5, fill: G });
    return svg("Stoichiometry", 260, g);
  })());

  add("chemist_mid_m3", "Solutions and dilution", FM([
    "C1 V1 = C2 V2",
    "M = n / V     (mol/L)",
    "m = M x V x Mr",
    "0.1 M NaCl, 500 mL  ->  2.925 g",
    "use a volumetric flask"
  ]));

  add("chemist_senior_m1", "Reaction networks and yield", (() => {
    let g = "";
    [["A", 40, LB], ["B", 240, LB], ["C", 440, LO]].forEach(([t, x, f]) => g += bx(x, 76, 140, 56, f) + tx(x + 70, 110, t, { size: 15, anchor: "middle", mono: true }));
    g += ln(180, 104, 240, 104, { marker: true }) + tx(210, 94, "80%", { size: 11, anchor: "middle", fill: B2 });
    g += ln(380, 104, 440, 104, { marker: true }) + tx(410, 94, "90%", { size: 11, anchor: "middle", fill: B2 });
    g += tx(24, 190, "Overall yield = 0.80 x 0.90 = 72%", { size: 13.5, fill: B2, w: 700, mono: true });
    g += tx(24, 226, "Equilibrium  Kc = [products] / [reactants]  (coefficients as powers)", { size: 12 });
    g += tx(24, 252, "Le Chatelier: the system opposes the change.", { size: 12, fill: G });
    return svg("Reaction networks and yield", 272, g);
  })());

  add("chemist_senior_m2", "Thermochemistry", (() => {
    const Y = 180; let g = "";
    g += ln(60, Y, 600, Y, { stroke: BD });
    g += `<path d="M80 ${Y - 70} L160 ${Y - 70} L160 ${Y} L240 ${Y}" fill="none" stroke="${O}" stroke-width="2.5"/>` + tx(170, Y - 84, "exothermic  dH < 0", { size: 11.5, fill: O });
    g += `<path d="M360 ${Y} L440 ${Y} L440 ${Y - 70} L520 ${Y - 70}" fill="none" stroke="${B}" stroke-width="2.5"/>` + tx(440, Y - 84, "endothermic  dH > 0", { size: 11.5, fill: B, anchor: "middle" });
    const f = FM(["q = m x c x dT      c(water) = 4.18 J/g/C", "dH = sum of dH of steps (Hess)", "dG = dH - T dS  ;  dG < 0 spontaneous"]);
    g += `<g transform="translate(0,${Y + 20})">${f.g}</g>`;
    return svg("Thermochemistry", Y + 20 + f.h, g);
  })());

  add("chemist_senior_m3", "Kinetics and acid-base", (() => {
    const X0 = 60, Y0 = 220, X1 = 300, Y1 = 64; let g = "";
    g += ln(X0, Y0, X1, Y0, { stroke: BD }) + ln(X0, Y0, X0, Y1, { stroke: BD }) + tx(X1, Y0 + 18, "time", { size: 11, fill: G });
    g += `<path d="M${X0} ${Y1 + 10} C 120 ${Y1 + 40} 180 ${Y0 - 30} ${X1} ${Y0 - 10}" fill="none" stroke="${O}" stroke-width="2.5"/>`;
    g += tx(340, 90, "Rate rises with temperature", { size: 12 }) + tx(340, 112, "and concentration", { size: 12 });
    g += tx(340, 144, "v = k[A]^n", { size: 13, mono: true, fill: B2 });
    g += tx(340, 170, "First order: t1/2 = 0.693 / k", { size: 12 });
    g += tx(340, 196, "Strong acid dissociates fully", { size: 12 });
    g += tx(340, 222, "pH + pOH = 14   (25 C)", { size: 12.5, mono: true, fill: B2 });
    return svg("Kinetics and acid-base", 250, g);
  })());

  /* ===== CULINARY ===== */
  add("cook_fillestar_m1", "Simple recipe: omelette", VS([
    "Beat 3 eggs with salt",
    "Heat the pan with 10 g butter",
    "Cook over medium heat 2-3 min",
    "Fold and serve   (portion: 1)"
  ]));

  add("cook_fillestar_m2", "Hygiene and temperature", (() => {
    let g = "";
    g += `<rect x="90" y="56" width="34" height="210" rx="16" fill="#F4F8FA" stroke="${BD}"/>`;
    g += `<rect x="90" y="140" width="34" height="86" fill="${O}"/>`;
    g += tx(150, 76, "74 C - poultry inside", { size: 12, fill: "#b91c1c" });
    g += tx(150, 186, "5 - 60 C  -  danger zone", { size: 12.5, fill: "#7a2b12", w: 700 });
    g += tx(150, 258, "5 C - keep cold at or below", { size: 12, fill: B2 });
    g += tx(380, 90, "Wash hands 20-30 s", { size: 12.5 });
    g += tx(380, 120, "Separate boards:", { size: 12.5 });
    g += tx(380, 144, "raw meat   |   salad", { size: 11.5, fill: G });
    return svg("Hygiene and temperature", 288, g);
  })());

  add("cook_fillestar_m3", "Mise en place and cuts", (() => {
    let g = "";
    [["Julienne", "long sticks", 0], ["Brunoise", "small cubes", 1], ["Dice", "cubes", 2]].forEach(([t, d, i]) => {
      const x = 24 + i * 200;
      g += bx(x, 60, 184, 116, i % 2 ? LO : LB);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g += `<rect x="${x + 24 + c * 34}" y="${72 + r * 24}" width="${i === 0 ? 26 : 18}" height="${i === 0 ? 6 : 14}" rx="2" fill="${B}" opacity=".7"/>`;
      g += tx(x + 92, 206, t, { size: 13, anchor: "middle", w: 700, fill: B2 }) + tx(x + 92, 226, d, { size: 11, anchor: "middle", fill: G });
    });
    g += tx(24, 268, "Mise en place: prepare everything before the heat is on.", { size: 12 });
    g += tx(24, 292, "A sharp knife is safer. Hold it with a claw grip.", { size: 11.5, fill: G });
    return svg("Mise en place and cuts", 310, g);
  })());

  add("cook_mid_m1", "Coordinating: pasta with sauce", (() => {
    const X0 = 180, X1 = 610, Y = 88, rowH = 58; let g = "";
    g += ln(X0, 66, X1, 66, { stroke: BD });
    const tasks = [
      ["Boil water (1 L / 100 g)", 0, 0.35, B],
      ["Sauce in parallel (15 min)", 0.1, 0.45, G],
      ["Pasta al dente (8-10 min)", 0.4, 0.35, O],
      ["Combine (1-2 min)", 0.85, 0.15, "#9db7c2"]
    ];
    tasks.forEach(([t, a, d, c], i) => {
      const x = X0 + a * (X1 - X0), w = Math.max(24, d * (X1 - X0)), y = Y + i * rowH;
      g += tx(X0 - 12, y + 20, t, { size: 11.5, anchor: "end", fill: B2 });
      g += `<rect x="${x}" y="${y}" width="${w}" height="30" rx="6" fill="${c}"/>`;
    });
    g += tx(24, 268, "Start the water first; overlap the tasks; combine at the very end.", { size: 12 });
    return svg("Coordinating: pasta with sauce", 286, g);
  })());

  add("cook_mid_m2", "Timing (Gantt)", (() => {
    const X0 = 150, X1 = 610, Y = 74, rowH = 54, span = 55; let g = "";
    g += ln(X0, 64, X1, 64, { stroke: BD });
    [0, 10, 20, 30, 40, 50].forEach((m) => { const x = X0 + (m / span) * (X1 - X0); g += ln(x, 60, x, 64, { stroke: BD }) + tx(x, 56, m + "m", { size: 9.5, anchor: "middle", fill: G }); });
    [["Soup", 0, 40, B], ["Dessert (cold)", 0, 30, G], ["Salad", 30, 10, O]].forEach(([t, a, d, c], i) => {
      const x = X0 + (a / span) * (X1 - X0), w = (d / span) * (X1 - X0), y = Y + i * rowH;
      g += tx(X0 - 12, y + 20, t, { size: 12, anchor: "end", fill: B2 });
      g += `<rect x="${x}" y="${y}" width="${w}" height="28" rx="6" fill="${c}"/>` + tx(x + w / 2, y + 19, d + "m", { size: 11, anchor: "middle", fill: "#fff", w: 700 });
    });
    g += tx(24, 264, "Longest tasks first (critical path = 40 min).  Buffer ~10%.", { size: 12 });
    return svg("Timing (Gantt)", 284, g);
  })());

  add("cook_mid_m3", "Scaling recipes and yield", FM([
    "Factor = desired portions / original portions",
    "Edible yield % = edible / purchased x 100",
    "1000 g purchased, 800 g edible  ->  80%",
    "Cost per portion = total cost / portions",
    "Spices do not scale linearly"
  ]));

  add("cook_senior_m1", "Optimisation and time management", (() => {
    let g = "";
    g += bx(24, 60, 288, 208, "#F4F8FA") + tx(40, 86, "Batch cooking (series)", { size: 13, w: 700, fill: B2 });
    ["Cook in series to save time", "FIFO: first in, first out", "Station order: cleaning,", "   production, service", "Measure: time per portion"].forEach((t, i) => g += tx(40, 118 + i * 28, "\u2022 " + t, { size: 12 }));
    g += bx(328, 60, 288, 208, LO) + tx(344, 86, "Minimise switching", { size: 13, w: 700, fill: "#7a2b12" });
    ["Group similar tasks", "Avoid time lost switching", "Pre-prep once", "Keep the flow linear"].forEach((t, i) => g += tx(344, 118 + i * 28, "\u2022 " + t, { size: 12 }));
    return svg("Optimisation and time management", 284, g);
  })());

  add("cook_senior_m2", "Food cost and pricing", (() => {
    let g = "";
    g += bx(60, 64, 520, 56, LB) + tx(320, 98, "Food cost % = food cost / selling price x 100", { size: 14, anchor: "middle", mono: true, fill: B2 });
    g += ln(320, 120, 320, 152, { marker: true });
    g += bx(60, 152, 520, 56, LO) + tx(320, 186, "Price = cost / target %        3 EUR / 30% = 10 EUR", { size: 13.5, anchor: "middle", mono: true, fill: "#7a2b12" });
    g += tx(60, 244, "Typical target 28-35%.   Gross margin = price - cost.", { size: 12, fill: G });
    return svg("Food cost and pricing", 268, g);
  })());

  add("cook_senior_m3", "HACCP and safety management", VS([
    "Hazard analysis",
    "Determine CCPs (critical control points)",
    "Set critical limits (cooking >= 74 C)",
    "Monitor and record",
    "Corrective actions",
    "Verification",
    "Documentation"
  ]));

  /* ===== ELECTRICAL ===== */
  add("electrical_fillestar_m1", "Basic circuits: series vs parallel", (() => {
    const circuit = (x, series) => {
      let s = `<rect x="${x}" y="70" width="260" height="150" rx="6" fill="none" stroke="${B}" stroke-width="2.5"/>`;
      s += `<rect x="${x + 90}" y="60" width="60" height="20" fill="${N}"/>` + tx(x + 120, 55, "V", { size: 11, anchor: "middle", fill: N });
      if (series) {
        s += `<rect x="${x + 120}" y="90" width="26" height="48" fill="#fff" stroke="${N}"/>` + tx(x + 133, 118, "R1", { size: 9.5, anchor: "middle" });
        s += `<rect x="${x + 120}" y="152" width="26" height="48" fill="#fff" stroke="${N}"/>` + tx(x + 133, 180, "R2", { size: 9.5, anchor: "middle" });
      } else {
        s += ln(x + 120, 70, x + 120, 130, { stroke: N, w: 1.5 }) + ln(x + 120, 160, x + 120, 220, { stroke: N, w: 1.5 });
        s += `<rect x="${x + 44}" y="130" width="26" height="48" fill="#fff" stroke="${N}"/>` + tx(x + 57, 158, "R1", { size: 9.5, anchor: "middle" });
        s += `<rect x="${x + 190}" y="130" width="26" height="48" fill="#fff" stroke="${N}"/>` + tx(x + 203, 158, "R2", { size: 9.5, anchor: "middle" });
      }
      return s;
    };
    let g = "";
    g += circuit(24, true) + tx(154, 246, "Series: R = R1 + R2, same current", { size: 11.5, anchor: "middle", fill: B2 });
    g += circuit(336, false) + tx(466, 246, "Parallel: same voltage, 1/R = 1/R1 + 1/R2", { size: 11.5, anchor: "middle", fill: B2 });
    return svg("Basic circuits: series vs parallel", 262, g);
  })());

  add("electrical_fillestar_m2", "Ohm's law", (() => {
    let g = "";
    g += `<polygon points="320,60 200,220 440,220" fill="${LB}" stroke="${B}"/>`;
    g += tx(320, 108, "V", { size: 30, anchor: "middle", w: 700, fill: B2 });
    g += tx(262, 208, "I", { size: 26, anchor: "middle", w: 700, fill: B2 }) + tx(378, 208, "R", { size: 26, anchor: "middle", w: 700, fill: B2 });
    g += tx(460, 120, "V = I x R", { size: 14, mono: true }) + tx(460, 148, "I = V / R", { size: 14, mono: true }) + tx(460, 176, "R = V / I", { size: 14, mono: true });
    g += tx(460, 214, "12 V / 4 ohm = 3 A", { size: 12.5, fill: O });
    return svg("Ohm's law", 246, g);
  })());

  add("electrical_fillestar_m3", "Power and energy", FM([
    "P = V x I",
    "P = I^2 x R = V^2 / R",
    "E = P x t",
    "1 kWh = 1000 W for 1 hour",
    "unit: watt (W)"
  ]));

  add("electrical_mid_m1", "KCL and KVL", (() => {
    let g = "";
    g += tx(24, 80, "KCL  -  at a node", { size: 13, w: 700, fill: B2 });
    g += `<circle cx="90" cy="150" r="10" fill="${O}"/>`;
    g += ln(150, 100, 100, 150, { marker: true }) + ln(150, 200, 100, 150, { marker: true }) + ln(30, 150, 80, 150, { marker: true });
    g += tx(158, 104, "I1", { size: 11, fill: B2 }) + tx(158, 204, "I2", { size: 11, fill: B2 }) + tx(20, 138, "I3", { size: 11, fill: B2 });
    g += tx(24, 250, "sum of currents into a node = 0", { size: 12 });
    g += tx(330, 80, "KVL  -  around a loop", { size: 13, w: 700, fill: B2 });
    g += `<rect x="360" y="100" width="220" height="110" fill="none" stroke="${B}" stroke-width="2.5"/>` + tx(470, 160, "sum of voltages = 0", { size: 12, anchor: "middle", fill: B2 });
    g += tx(330, 250, "12 V over 100 + 200 ohm  ->  40 mA", { size: 12 });
    return svg("KCL and KVL", 268, g);
  })());

  add("electrical_mid_m2", "Voltage divider and Thevenin", (() => {
    let g = "";
    g += `<rect x="90" y="60" width="180" height="160" fill="none" stroke="${B}" stroke-width="2.5"/>`;
    g += tx(180, 50, "Vin", { size: 11, anchor: "middle", fill: N }) + tx(180, 240, "0 V", { size: 11, anchor: "middle", fill: G });
    g += `<rect x="168" y="76" width="26" height="50" fill="#fff" stroke="${N}"/>` + tx(181, 106, "R1", { size: 10, anchor: "middle" });
    g += `<rect x="168" y="150" width="26" height="50" fill="#fff" stroke="${N}"/>` + tx(181, 180, "R2", { size: 10, anchor: "middle" });
    g += ln(270, 140, 360, 140, { marker: true }) + tx(280, 130, "Vout", { size: 11, fill: B2 });
    g += tx(380, 100, "Vout = Vin x R2 / (R1 + R2)", { size: 13, mono: true, fill: B2 });
    g += tx(380, 132, "R1 = R2  ->  Vout = Vin / 2", { size: 12 });
    g += tx(380, 168, "Thevenin: source + series R_Th", { size: 12 });
    g += tx(380, 194, "Max power when R_L = R_Th", { size: 12 });
    return svg("Voltage divider and Thevenin", 262, g);
  })());

  add("electrical_mid_m3", "RC filters", (() => {
    let g = "";
    g += `<rect x="80" y="70" width="200" height="130" fill="none" stroke="${B}" stroke-width="2.5"/>`;
    g += `<rect x="150" y="60" width="60" height="20" fill="${N}"/>` + tx(180, 52, "Vin", { size: 10, anchor: "middle", fill: N });
    g += `<rect x="106" y="108" width="60" height="26" fill="#fff" stroke="${N}"/>` + tx(136, 126, "R", { size: 10, anchor: "middle" });
    g += ln(166, 121, 250, 121, { marker: true }) + tx(196, 110, "Vout", { size: 10, fill: B2 });
    g += `<line x1="126" y1="190" x2="146" y2="190" stroke="${N}" stroke-width="2"/><line x1="130" y1="198" x2="142" y2="198" stroke="${N}" stroke-width="2"/>` + tx(156, 194, "C", { size: 10, fill: G });
    g += tx(340, 100, "f_c = 1 / (2 pi R C)", { size: 13, mono: true, fill: B2 });
    g += tx(340, 132, "R = 1k, C = 1uF  ->  f_c ~ 159 Hz", { size: 12 });
    g += tx(340, 162, "Low-pass passes low frequencies", { size: 12, fill: G });
    g += tx(340, 186, "High-pass passes high ones", { size: 12, fill: G });
    g += tx(340, 212, "At f_c amplitude = 70.7%  (-3 dB)", { size: 12 });
    return svg("RC filters", 250, g);
  })());

  add("electrical_senior_m1", "Signals", (() => {
    const X0 = 50, X1 = 380, Y = 130, A = 60; let g = "";
    let p = "M" + X0 + " " + Y;
    for (let i = 0; i <= 120; i++) { const t = i / 120; p += " L" + (X0 + t * (X1 - X0)) + " " + (Y - A * Math.sin(t * 4 * Math.PI)); }
    g += `<path d="${p}" fill="none" stroke="${B}" stroke-width="2.5"/>`;
    g += ln(X0, Y + 80, X1, Y + 80, { stroke: BD }) + tx(X1 + 6, Y + 84, "t", { size: 11, fill: G });
    g += tx(X0, Y - A - 12, "V_peak", { size: 11, fill: B2 });
    g += tx(400, 90, "T = 1 / f", { size: 13, mono: true, fill: B2 });
    g += tx(400, 118, "V_rms = V_peak / sqrt(2)", { size: 13, mono: true, fill: B2 });
    g += tx(400, 146, "Nyquist: f_s > 2 x f_max", { size: 12.5 });
    g += tx(400, 174, "dB = 20 log10(V2 / V1)", { size: 12 });
    g += tx(400, 200, "Spectrum: many sinusoids (Fourier)", { size: 12, fill: G });
    return svg("Signals", 250, g);
  })());

  add("electrical_senior_m2", "Systems and feedback", (() => {
    let g = "";
    g += bx(60, 80, 90, 60, LB) + tx(105, 116, "Input", { size: 12, anchor: "middle" });
    g += `<circle cx="210" cy="110" r="18" fill="#fff" stroke="${N}"/>` + tx(210, 115, "+ -", { size: 12, anchor: "middle" });
    g += bx(260, 80, 110, 60, LO) + tx(315, 116, "A", { size: 14, anchor: "middle", w: 700, fill: "#7a2b12" });
    g += bx(410, 80, 100, 60, LB) + tx(460, 116, "Output", { size: 12, anchor: "middle" });
    g += ln(150, 110, 192, 110, { marker: true }) + ln(228, 110, 260, 110, { marker: true }) + ln(370, 110, 410, 110, { marker: true });
    g += ln(460, 140, 460, 200) + ln(460, 200, 210, 200) + ln(210, 200, 210, 128, { marker: true }) + tx(320, 216, "beta  (feedback)", { size: 11, fill: G });
    g += tx(24, 256, "A_cl = A / (1 + A beta)    negative feedback adds stability", { size: 12, fill: B2 });
    g += tx(24, 280, "First-order step: 63.2% at one tau,  ~99.3% at 5 tau", { size: 12 });
    return svg("Systems and feedback", 298, g);
  })());

  add("electrical_senior_m3", "Op-amp", (() => {
    const tri = (x, y, label, rf, rin) => {
      let s = tx(x + 45, y - 12, label, { size: 12, w: 700, fill: B2 });
      s += `<polygon points="${x},${y} ${x},${y + 110} ${x + 90},${y + 55}" fill="${LB}" stroke="${B}"/>`;
      s += tx(x + 12, y + 34, "-", { size: 12 }) + tx(x + 12, y + 82, "+", { size: 12 });
      s += tx(x + 104, y + 40, "Rf = " + rf, { size: 11, fill: G }) + tx(x + 104, y + 80, "Rin = " + rin, { size: 11, fill: G });
      return s;
    };
    let g = "";
    g += tri(60, 70, "Inverting", "10k", "1k") + tx(60, 236, "Av = -Rf / Rin = -10", { size: 12 });
    g += tri(340, 70, "Non-inverting", "9k", "1k") + tx(340, 236, "Av = 1 + Rf / Rin = 10", { size: 12 });
    g += tx(24, 276, "Ideal: infinite input resistance, virtual ground.  Output saturates at the supply.", { size: 11.5, fill: G });
    return svg("Op-amp", 292, g);
  })());

  /* ===== MEDICINE ===== */
  add("health_fillestar_m1", "Symptoms", TC(
    "Reported by the patient",
    ["Symptom - what the patient feels", "History: onset, duration, intensity", "Aggravating and relieving factors"],
    "Observed by the doctor",
    ["Sign - measurable on exam", "Fever: temperature >= 38 C", "Pain rated 0-10 (VAS / NRS)"]
  ));

  add("health_fillestar_m2", "Vital signs (adult reference)", TB(["Parameter", "Normal range"], [["Pulse", "60-100 /min"], ["Respiration", "12-20 /min"], ["Blood pressure", "< 120 / 80 mm Hg"], ["Temperature", "36.1-37.2 C"], ["SpO2", ">= 95%"]]));

  add("health_fillestar_m3", "Systems and terminology", (() => {
    let g = "";
    g += bx(24, 56, 288, 208, "#F4F8FA") + tx(40, 82, "Suffixes / prefixes", { size: 13, w: 700, fill: B2 });
    [["-itis", "inflammation"], ["-ectomy", "surgical removal"], ["tachy-", "fast"], ["brady-", "slow"]].forEach(([a, b], i) => { g += tx(40, 116 + i * 32, a, { size: 13, mono: true, fill: B2 }) + tx(150, 116 + i * 32, b, { size: 12 }); });
    g += bx(328, 56, 288, 208, LO) + tx(344, 82, "Terms", { size: 13, w: 700, fill: "#7a2b12" });
    [["Tachycardia", "> 100 /min"], ["Bradycardia", "< 60 /min"], ["Hypertension", ">= 140 / 90"], ["Dyspnea", "difficulty breathing"]].forEach(([a, b], i) => { g += tx(344, 116 + i * 32, a, { size: 12, w: 700 }) + tx(452, 116 + i * 32, b, { size: 11, fill: G }); });
    return svg("Systems and terminology", 284, g);
  })());

  add("health_mid_m1", "Differential diagnosis", VS([
    "List possible causes for the symptom",
    "Rank by probability and by risk",
    "Start with 'can't miss' (life-threatening)",
    "Order tests to exclude or confirm",
    "Reassess with new data"
  ]));

  add("health_mid_m2", "Clinical interpretation", TB(["Value", "Reference range"], [["Hb - men", "~13-17 g/dL"], ["Hb - women", "~12-15 g/dL"], ["Fasting glucose", "~70-99 mg/dL"]]));

  add("health_mid_m3", "Simple clinical case", VS([
    "Complaint",
    "History",
    "Examination",
    "Assessment",
    "Plan (allergies, meds, follow-up)"
  ]));

  add("health_senior_m1", "Treatment", (() => {
    let g = "";
    g += bx(24, 60, 180, 60, LB) + tx(114, 96, "Diagnosis", { size: 12.5, anchor: "middle" });
    g += ln(204, 90, 240, 90, { marker: true });
    g += `<polygon points="290,60 360,90 290,120 220,90" fill="${LO}" stroke="${O}"/>` + tx(290, 94, "benefit > risk?", { size: 10, anchor: "middle", fill: "#7a2b12" });
    g += ln(360, 90, 430, 90, { marker: true }) + tx(372, 80, "yes", { size: 10, fill: B2 });
    g += bx(430, 60, 186, 60, LB) + tx(523, 96, "Treatment", { size: 12.5, anchor: "middle" });
    g += tx(24, 180, "Informed consent  \u2022  monitor effects  \u2022  reassess", { size: 12 });
    g += tx(24, 206, "Adjust for kidney / liver / pregnancy", { size: 12 });
    g += tx(24, 232, "Follow guidelines for diagnosis and risk", { size: 11.5, fill: G });
    return svg("Treatment", 250, g);
  })());

  add("health_senior_m2", "Interactions", (() => {
    let g = "";
    [["Warfarin + NSAID", "increased bleeding risk"], ["ACE inhibitor + K-sparing diuretic", "hyperkalaemia risk"], ["Metformin + eGFR < 30", "contraindicated"]].forEach(([a, b], i) => {
      const y = 66 + i * 50;
      g += bx(24, y, 592, 40, i % 2 ? "#F5F8FA" : LO) + tx(40, y + 25, a, { size: 12.5, w: 700 }) + tx(340, y + 25, b, { size: 12, fill: "#7a2b12" });
    });
    g += tx(24, 250, "Polypharmacy increases interactions.  Verify every combination.", { size: 12, fill: B2 });
    return svg("Interactions", 268, g);
  })());

  add("health_senior_m3", "Complex case (qSOFA)", (() => {
    let g = "";
    g += tx(24, 76, "Sepsis-3  qSOFA predictors", { size: 13.5, w: 700, fill: B2 });
    [["RR >= 22", "respiration"], ["Altered mental status", "consciousness"], ["Systolic BP <= 100", "blood pressure"]].forEach(([a, b], i) => {
      const y = 96 + i * 42;
      g += bx(24, y, 380, 34, i % 2 ? "#F5F8FA" : LB) + tx(40, y + 22, a, { size: 12.5, mono: true, fill: B2 }) + tx(230, y + 22, b, { size: 11, fill: G });
    });
    g += bx(430, 96, 186, 118, LO) + tx(523, 132, ">= 2 criteria", { size: 13, anchor: "middle", w: 700, fill: "#7a2b12" }) + tx(523, 158, "high risk", { size: 12, anchor: "middle", fill: G }) + tx(523, 180, "urgent assessment", { size: 12, anchor: "middle", fill: G });
    g += tx(24, 240, "A patient with comorbidities: prioritise the life-threatening problem.", { size: 12 });
    g += tx(24, 264, "Work with a multidisciplinary team.", { size: 12, fill: G });
    return svg("Complex case (qSOFA)", 282, g);
  })());
}
