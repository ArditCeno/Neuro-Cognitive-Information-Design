/*
 * Diagram specs - group A: software, legal, finance, business.
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { S, svg, tx, bx, ln, VS, HF, TC, TB, FM, CODE, BR, MX, PY, CY, wrapText,
  N, B, B2, O, G, LB, LO, BD } from "./lib.mjs";

export function register(add) {
  /* ===== SOFTWARE ===== */
  add("software_fillestar_m1", "Variables and types", CODE([
    ["x = 5", "int"],
    ['name = "Ana"', "str"],
    ["pi = 3.14", "float"],
    ["ok = True", "bool"],
    ["type(3.14)", "-> float"],
    ["x = 5;  y = x;  x = 7", "y stays 5"]
  ]));

  add("software_fillestar_m2", "if / elif / else", (() => {
    const dia = (cx, cy, w, hh, label) =>
      `<polygon points="${cx},${cy - hh} ${cx + w},${cy} ${cx},${cy + hh} ${cx - w},${cy}" fill="${LO}" stroke="${O}"/>` +
      tx(cx, cy + 4, label, { size: 11.5, anchor: "middle", fill: "#7a2b12" });
    let g = "";
    g += bx(60, 58, 150, 46, LB) + tx(135, 86, "x = 10", { size: 13, anchor: "middle", mono: true });
    g += dia(135, 170, 108, 44, "x > 5 and x < 8 ?");
    g += ln(135, 104, 135, 126, { marker: true });
    g += ln(243, 170, 400, 170, { marker: true }) + tx(252, 160, "True", { size: 11, fill: B2 });
    g += bx(400, 146, 216, 48, LB) + tx(508, 175, "print('mes')", { size: 12.5, anchor: "middle", mono: true });
    g += ln(135, 214, 135, 246, { marker: true }) + tx(142, 238, "False", { size: 11, fill: G });
    g += dia(135, 290, 100, 42, "x >= 8 ?");
    g += ln(235, 290, 400, 262, { marker: true }) + tx(252, 282, "True", { size: 11, fill: B2 });
    g += bx(400, 238, 216, 48, LB) + tx(508, 267, "print('lart')", { size: 12.5, anchor: "middle", mono: true });
    g += ln(135, 332, 135, 352) + ln(135, 352, 508, 352) + ln(508, 352, 508, 312, { marker: true });
    g += tx(150, 372, "False  ->  print('ulët')", { size: 11.5, fill: G });
    return svg("if / elif / else", 392, g);
  })());

  add("software_fillestar_m3", "Loops and lists", (() => {
    let g = "";
    g += bx(40, 62, 190, 150, "#F7FAFB") + tx(56, 86, "a = [10, 20, 30]", { size: 12.5, mono: true, fill: B2 });
    ["10", "20", "30"].forEach((v, i) => g += bx(56 + i * 54, 104, 46, 40, LB) + tx(79 + i * 54, 130, v, { size: 13, anchor: "middle", mono: true }));
    g += tx(56, 178, "index  0   1   2", { size: 11, fill: G });
    g += ln(230, 137, 300, 137, { marker: true });
    g += bx(300, 92, 130, 90, LO) + tx(365, 122, "s = 0", { size: 12.5, anchor: "middle", mono: true }) + tx(365, 148, "s += v", { size: 12.5, anchor: "middle", mono: true }) + tx(365, 170, "for v in a", { size: 11, anchor: "middle", fill: "#7a2b12" });
    g += ln(430, 137, 500, 137, { marker: true });
    g += bx(500, 104, 110, 66, LB) + tx(555, 133, "s", { size: 12, anchor: "middle", fill: G }) + tx(555, 160, "60", { size: 18, anchor: "middle", w: 700, fill: B2 });
    g += tx(40, 236, "range(n) -> 0..n-1    append() adds to the end    while repeats while True", { size: 11.5, fill: G });
    return svg("Loops and lists", 258, g);
  })());

  add("software_mid_m1", "Functions", CODE([
    ["def f(x, y=2):", "y has a default"],
    ["    return x * y", "returns the result"],
    ["f(3)", "-> 6"],
    ["f(3, 4)", "-> 12"],
    ["no return", "-> None"],
    ["local variable", "exists only inside"]
  ]));

  add("software_mid_m2", "Filtering lists", (() => {
    let g = "";
    g += bx(40, 64, 250, 118, "#F7FAFB") + tx(56, 90, "a = [1, 2, 3, 4, 5, 6]", { size: 12.5, mono: true, fill: B2 });
    g += tx(56, 118, "a[1:3]", { size: 12.5, mono: true }) + tx(150, 118, "-> [2, 3]", { size: 11.5, fill: G });
    g += tx(56, 144, "[x for x in a", { size: 12, mono: true });
    g += tx(56, 164, "   if x % 2 == 0]", { size: 12, mono: true });
    g += ln(290, 120, 350, 120, { marker: true });
    g += bx(350, 84, 250, 72, LB) + tx(475, 112, "pare = [2, 4, 6]", { size: 13, anchor: "middle", mono: true, fill: B2 });
    g += tx(40, 214, "sorted() returns a new list    sum() adds    sorted(reverse=True) orders descending", { size: 11.5, fill: G });
    g += tx(40, 236, "slicing creates a new list - it does not change the original", { size: 11.5, fill: G });
    return svg("Filtering lists", 258, g);
  })());

  add("software_mid_m3", "Functions + lists + conditions", (() => {
    let g = "";
    g += bx(40, 64, 250, 66, "#F7FAFB") + tx(56, 90, "def frekuenca(lst):", { size: 12.5, mono: true, fill: B2 }) + tx(56, 112, "  d[x] = d.get(x, 0) + 1", { size: 11.5, mono: true });
    g += ln(290, 98, 350, 98, { marker: true });
    g += bx(350, 64, 250, 66, LB) + tx(475, 102, "[1, 2, 2, 3, 3, 3]", { size: 12.5, anchor: "middle", mono: true });
    g += ln(475, 130, 475, 166, { marker: true });
    g += bx(350, 166, 250, 66, LO) + tx(475, 204, "{1:1, 2:2, 3:3}", { size: 14, anchor: "middle", mono: true, fill: "#7a2b12" });
    g += tx(40, 268, "d['a'] reads a key    d.get('k', 0) returns the default if missing", { size: 11.5, fill: G });
    g += tx(40, 290, "enumerate() yields (index, value)    max([]) raises ValueError", { size: 11.5, fill: G });
    return svg("Functions + lists + conditions", 312, g);
  })());

  add("software_senior_m1", "Algorithms and complexity", (() => {
    const X0 = 60, Y0 = 268, X1 = 300, Y1 = 70;
    let g = "";
    g += ln(X0, Y0, X1, Y0, { stroke: BD }) + ln(X0, Y0, X0, Y1, { stroke: BD });
    g += tx(X1, Y0 + 18, "n", { size: 11, fill: G }) + tx(X0 - 12, Y1, "time", { size: 11, fill: G, anchor: "middle" });
    const curve = (fn, color, label) => {
      let p = "";
      for (let i = 0; i <= 20; i++) { const t = i / 20; p += (i ? " L" : "M") + (X0 + t * (X1 - X0)) + " " + (Y0 - Math.min(1, fn(t)) * (Y0 - Y1)); }
      return `<path d="${p}" fill="none" stroke="${color}" stroke-width="2"/>` + tx(X1 + 6, Y0 - Math.min(1, fn(1)) * (Y0 - Y1) + 4, label, { size: 11, fill: color });
    };
    g += curve((t) => t * t, O, "O(n^2)");
    g += curve((t) => t, B, "O(n)");
    g += curve((t) => Math.log2(1 + 9 * t) / 3.4, B2, "O(log n)");
    g += tx(360, 90, "Binary search  O(log n)", { size: 13, w: 700, fill: B2 });
    g += tx(360, 114, "needs a sorted list", { size: 12, fill: G });
    g += tx(360, 146, "Two nested loops  ->  O(n^2)", { size: 12 });
    g += tx(360, 170, "O(n log n) beats O(n^2) for large n", { size: 12 });
    g += tx(360, 194, "'x in list'  ->  O(n)", { size: 12 });
    return svg("Algorithms and complexity", 300, g);
  })());

  add("software_senior_m2", "Data structures: stack vs queue", (() => {
    let g = "";
    g += tx(24, 74, "Stack  -  LIFO", { size: 13.5, w: 700, fill: B2 });
    g += bx(24, 90, 280, 150, "#F4F8FA");
    ["2 (top)", "1"].forEach((v, i) => g += bx(150, 104 + i * 44, 70, 38, LO) + tx(185, 128 + i * 44, v, { size: 12, anchor: "middle", mono: true }));
    g += ln(280, 122, 330, 122, { marker: true }) + tx(288, 112, "pop()", { size: 11, fill: G });
    g += tx(40, 226, "append / pop  -  last in, first out", { size: 11.5, fill: G });
    g += tx(328, 74, "Queue  -  FIFO", { size: 13.5, w: 700, fill: B2 });
    g += bx(328, 90, 288, 150, "#F4F8FA");
    ["1", "2", "3"].forEach((v, i) => g += bx(348 + i * 82, 146, 68, 38, LB) + tx(382 + i * 82, 170, v, { size: 12, anchor: "middle", mono: true }));
    g += ln(348, 122, 616, 122, { marker: true }) + tx(410, 112, "append / popleft()", { size: 11, fill: G });
    g += tx(344, 226, "first in, first out", { size: 11.5, fill: G });
    return svg("Data structures: stack vs queue", 260, g);
  })());

  add("software_senior_m3", "Debugging: reading a traceback", (() => {
    let g = "";
    g += bx(40, 56, 400, 216, "#F7FAFB");
    const rows = [
      "Traceback (most recent call last):",
      '  File "main.py", line 3',
      "    print(a[i])",
      "a = [1, 2, 3]",
      "for i in range(len(a)+1):",
      "IndexError: list index out of range"
    ];
    rows.forEach((t, i) => g += tx(56, 84 + i * 32, t, { size: 12, mono: true, fill: i === 5 ? "#b91c1c" : (i === 1 ? B2 : N) }));
    g += ln(56, 214, 424, 214, { stroke: O, dash: true });
    g += tx(456, 96, "Read from the bottom", { size: 12.5, fill: B2, w: 700 });
    g += tx(456, 124, "line 3 is the last executed", { size: 12, fill: G });
    g += tx(456, 150, "range(5) goes 0..4", { size: 12 });
    g += tx(456, 176, "range(len(a)+1) is the bug", { size: 12 });
    g += tx(456, 204, "fix: range(len(a))", { size: 12, fill: "#15803d", mono: true });
    return svg("Debugging: reading a traceback", 292, g);
  })());

  /* ===== LEGAL ===== */
  add("legal_fillestar_m1", "Elements of an article", (() => {
    let g = "";
    g += bx(40, 56, 300, 236, "#ffffff", BD);
    g += tx(60, 84, "Article 4", { size: 13, w: 700, fill: B2 });
    g += tx(60, 110, "Heading of the provision", { size: 12, fill: G });
    for (let i = 0; i < 4; i++) g += ln(60, 132 + i * 26, 320, 132 + i * 26, { stroke: BD, w: 4 });
    g += tx(60, 244, "1. paragraph    a) b) c) points", { size: 11.5, fill: G });
    const L = [
      ["Number", "identifies the article"],
      ["Heading", "brief title"],
      ["Paragraph", "a numbered block"],
      ["Hypothesis", "conditions to apply"],
      ["Provision", "the rule laid down"],
      ["Sanction", "effect of a breach"]
    ];
    L.forEach(([t, d], i) => { g += tx(370, 84 + i * 34, t, { size: 12.5, w: 700, fill: B2 }) + tx(370, 100 + i * 34, d, { size: 11.5, fill: G }); });
    return svg("Elements of an article", 312, g);
  })());

  add("legal_fillestar_m2", "Basic terms", TC(
    "Capacity and relation",
    ["Subjective right - power recognised by law", "Obligation - required conduct", "Competence - authority to act"],
    "Who and what",
    ["Subject - holder of rights / obligations", "Object - what the right applies to"],
    { rowH: 34 }
  ));

  add("legal_fillestar_m3", "Deadlines (teaching rule)", (() => {
    const X0 = 50, X1 = 600, Y = 150; let g = "";
    g += ln(X0, Y, X1, Y, { stroke: N, w: 2, marker: true });
    const marks = [[70, "event"], [220, "day 1 starts the next day"], [400, "monthly rule: corresponding date"], [560, "holiday -> first working day"]];
    marks.forEach(([x, t]) => {
      g += `<circle cx="${x}" cy="${Y}" r="6" fill="${O}"/>`;
      wrapText(t, 18).forEach((l, k) => g += tx(x, Y - 20 - (wrapText(t, 18).length - 1 - k) * 15, l, { size: 11.5, anchor: "middle", fill: B2 }));
    });
    g += tx(50, Y + 48, "For days: the start day is not counted.", { size: 12 });
    g += tx(50, Y + 72, "Missing it can cause loss of the right.", { size: 12, fill: "#b91c1c" });
    return svg("Deadlines (teaching rule)", 250, g);
  })());

  add("legal_mid_m1", "Interpreting a provision", CY([
    ["Linguistic", "the words"],
    ["Systematic", "the place"],
    ["Teleological", "the purpose"],
    ["Historical", "the intent"]
  ]));

  add("legal_mid_m2", "Calculating deadlines", VS([
    "Notification starts the period",
    "Counting starts the day after the event",
    "Calendar days vs working days",
    "Suspension stops / interruption restarts",
    "Ends at the end of the last day"
  ]));

  add("legal_mid_m3", "Conditions and consequences", (() => {
    let g = "";
    g += bx(40, 60, 170, 60, LB) + tx(125, 96, "Condition A", { size: 12.5, anchor: "middle" });
    g += bx(40, 150, 170, 60, LB) + tx(125, 186, "Condition B", { size: 12.5, anchor: "middle" });
    g += tx(125, 138, "AND  (cumulative)", { size: 11.5, anchor: "middle", fill: B2 });
    g += tx(125, 228, "OR  (alternative)", { size: 11.5, anchor: "middle", fill: B2 });
    g += ln(210, 90, 430, 130, { marker: true });
    g += ln(210, 180, 430, 140, { marker: true });
    g += bx(430, 96, 180, 78, LO) + tx(520, 128, "Consequence", { size: 13, anchor: "middle", w: 700, fill: "#7a2b12" }) + tx(520, 152, "check order", { size: 11.5, anchor: "middle", fill: G });
    return svg("Conditions and consequences", 250, g);
  })());

  add("legal_senior_m1", "Conflict of norms", (() => {
    let g = "";
    g += bx(24, 56, 288, 156, "#F4F8FA") + tx(40, 82, "Hierarchy", { size: 13, w: 700, fill: B2 });
    ["Constitution", "Law", "Sub-legal act"].forEach((t, i) => {
      const w = 240 - i * 40;
      g += bx(48 + i * 20, 96 + i * 34, w, 28, i === 2 ? LO : LB) + tx(48 + i * 20 + w / 2, 115 + i * 34, t, { size: 12, anchor: "middle" });
    });
    const R = [["Lex superior", "the higher norm prevails"], ["Lex specialis", "the special beats the general"], ["Lex posterior", "the later beats the earlier"]];
    R.forEach(([t, d], i) => { g += tx(328, 90 + i * 46, t, { size: 13, w: 700, fill: B2 }) + tx(328, 110 + i * 46, d, { size: 12, fill: G }); });
    g += tx(328, 244, "Apply: superior, then specialis, then posterior", { size: 11.5 });
    return svg("Conflict of norms", 260, g);
  })());

  add("legal_senior_m2", "Legal argumentation (syllogism)", (() => {
    let g = "";
    g += bx(60, 60, 200, 70, LB) + tx(160, 90, "Norm", { size: 13, anchor: "middle", w: 700 }) + tx(160, 112, "major premise", { size: 11, anchor: "middle", fill: G });
    g += bx(60, 160, 200, 70, LB) + tx(160, 190, "Fact", { size: 13, anchor: "middle", w: 700 }) + tx(160, 212, "minor premise", { size: 11, anchor: "middle", fill: G });
    g += ln(260, 95, 380, 135, { marker: true }) + ln(260, 195, 380, 165, { marker: true });
    g += bx(380, 90, 230, 120, LO) + tx(495, 135, "Conclusion", { size: 13.5, anchor: "middle", w: 700, fill: "#7a2b12" }) + tx(495, 162, "weight comes from the legal basis,", { size: 11, anchor: "middle", fill: G }) + tx(495, 180, "not from the tone", { size: 11, anchor: "middle", fill: G });
    return svg("Legal argumentation (syllogism)", 250, g);
  })());

  add("legal_senior_m3", "Complex case - method", VS([
    "Identify key facts and the legal question",
    "Find applicable norms and conflicts",
    "Compute the relevant deadlines",
    "Apply conditions (cumulative / alternative)",
    "Conclude with a recommendation and risk"
  ]));

  /* ===== FINANCE ===== */
  add("finance_fillestar_m1", "Income table", TB(["Line", "Amount"], [["Revenue", "120,000"], ["Costs", "80,000"], ["Profit", "40,000"], ["Margin", "33.3%"]]));

  add("finance_fillestar_m2", "Percentages", FM([
    "Percentage = part / whole x 100",
    "Growth % = (new - old) / old x 100",
    "20% off 200  =  160",
    "Simple interest = principal x rate x years",
    "VAT is added on the net price"
  ]));

  add("finance_fillestar_m3", "Budget (50 / 30 / 20)", (() => {
    let g = "", x = 40;
    [["Needs", 50, B], ["Wants", 30, G], ["Savings", 20, O]].forEach(([t, v, c]) => {
      const w = 5.6 * v;
      g += `<rect x="${x}" y="80" width="${w}" height="60" fill="${c}"/>`;
      g += tx(x + w / 2, 116, t, { size: 12, anchor: "middle", fill: "#fff", w: 700 }) + tx(x + w / 2, 160, v + "%", { size: 12, anchor: "middle", fill: c, w: 700 });
      x += w;
    });
    g += tx(40, 210, "Balance = income - expenses", { size: 12.5 });
    g += tx(40, 236, "Emergency fund: 3-6 months of expenses", { size: 12.5 });
    g += tx(40, 262, "Compare plan with actuals monthly", { size: 12, fill: G });
    return svg("Budget (50 / 30 / 20)", 280, g);
  })());

  add("finance_mid_m1", "P&L statement", (() => {
    let g = "";
    const rows = [["Revenue", 500, B], ["- COGS", 300, "#9db7c2"], ["= Gross profit", 200, G], ["- Opex", 100, "#9db7c2"], ["= EBIT", 100, O]];
    rows.forEach(([t, v, c], i) => {
      const w = v * 0.9;
      g += `<rect x="150" y="${62 + i * 42}" width="${w}" height="30" fill="${c}"/>`;
      g += tx(140, 82 + i * 42, t, { size: 12, anchor: "end", fill: B2 });
      g += tx(160 + w, 82 + i * 42, String(v), { size: 11.5, fill: G });
    });
    return svg("P&L statement", 282, g);
  })());

  add("finance_mid_m2", "KPIs", (() => {
    let g = "";
    const K = [["Gross margin", "gross profit / revenue"], ["ROI", "(gain - investment) / investment"], ["YoY growth", "year over year"], ["Current ratio", "assets / liabilities"]];
    K.forEach(([t, d], i) => {
      const x = 24 + (i % 2) * 300, y = 56 + Math.floor(i / 2) * 96;
      g += bx(x, y, 284, 84, i % 2 ? "#F4F8FA" : LB) + tx(x + 16, y + 32, t, { size: 13.5, w: 700, fill: B2 }) + tx(x + 16, y + 58, d, { size: 11.5, fill: G });
    });
    g += tx(24, 268, "A KPI without a target is useless.", { size: 12 });
    return svg("KPIs", 282, g);
  })());

  add("finance_mid_m3", "Comparisons", BR([{ l: "Budget", v: 100, c: G }, { l: "Actual", v: 90, c: O }, { l: "Competitor", v: 95, c: B }, { l: "Last period", v: 80, c: "#9db7c2" }], { max: 120 }));

  add("finance_senior_m1", "Multi-factor analysis", (() => {
    const f = FM(["Contribution margin = price - variable cost", "Break-even = fixed cost / contribution margin", "Example: 10000 / (50 - 30) = 500 units"]);
    let g = f.g;
    g += tx(24, f.h + 26, "Sensitivity: change one variable at a time.", { size: 12 });
    g += tx(24, f.h + 50, "Multi-variable: change several together.", { size: 12 });
    return svg("Multi-factor analysis", f.h + 66, g);
  })());

  add("finance_senior_m2", "Valuation (NPV)", (() => {
    const X0 = 50, Y = 130; let g = "";
    g += ln(X0, Y, 600, Y, { stroke: N, w: 1.5 });
    [[60, "t0", "-1000", O], [300, "t1", "+1100", B], [540, "t2", "...", "#9db7c2"]].forEach(([x, t, v, c]) => {
      g += `<circle cx="${x}" cy="${Y}" r="7" fill="${c}"/>` + tx(x, Y + 26, t, { size: 11, anchor: "middle", fill: G }) + tx(x, Y - 16, v, { size: 12, anchor: "middle", fill: c, w: 700 });
    });
    g += bx(50, 190, 590, 84, "#F7FAFB") + tx(66, 220, "NPV = sum of present values - investment", { size: 13, mono: true, fill: B2 }) + tx(66, 246, "PV = cash flow / (1 + r)^t ;  r reflects risk", { size: 11.5, fill: G }) + tx(66, 266, "NPV > 0 : the project creates value", { size: 11.5, fill: G });
    return svg("Valuation (NPV)", 292, g);
  })());

  add("finance_senior_m3", "Scenarios", TB(["Scenario", "Probability", "Outcome"], [["Optimistic", "30%", "200"], ["Base", "50%", "100"], ["Pessimistic", "20%", "-50"], ["Expected value", "", "100"]]));

  /* ===== BUSINESS ===== */
  add("business_fillestar_m1", "Basic indicators", FM([
    "Revenue = price x quantity",
    "Cost = fixed + variable",
    "Profit = revenue - cost",
    "Market share = firm sales / market sales",
    "Example: 20 x 500 = 10,000 revenue"
  ]));

  add("business_fillestar_m2", "SMART objectives", (() => {
    let g = "";
    [["S", "Specific"], ["M", "Measurable"], ["A", "Achievable"], ["R", "Relevant"], ["T", "Time-bound"]].forEach(([a, b], i) => {
      const x = 24 + i * 120;
      g += `<rect x="${x}" y="70" width="104" height="90" rx="10" fill="${i % 2 ? LO : LB}" stroke="${BD}"/>` + tx(x + 52, 116, a, { size: 26, anchor: "middle", w: 700, fill: B2 }) + tx(x + 52, 142, b, { size: 11, anchor: "middle", fill: G });
    });
    return svg("SMART objectives", 188, g);
  })());

  add("business_fillestar_m3", "Break-even", (() => {
    const X0 = 60, Y0 = 260, X1 = 420, Y1 = 64; let g = "";
    g += ln(X0, Y0, X1, Y0, { stroke: BD }) + ln(X0, Y0, X0, Y1, { stroke: BD });
    g += `<path d="M${X0} ${Y0} L${X1} ${Y1}" stroke="${B}" stroke-width="2"/>` + tx(X1 + 6, Y1 + 4, "revenue", { size: 11, fill: B });
    g += `<path d="M${X0} ${Y0 - 40} L${X1} ${Y0 - 100}" stroke="${O}" stroke-width="2"/>` + tx(X1 + 6, Y0 - 100, "cost", { size: 11, fill: O });
    const bxX = X0 + (X1 - X0) * 0.62;
    g += ln(bxX, Y1, bxX, Y0, { stroke: BD, dash: true }) + `<circle cx="${bxX}" cy="${Y0 - 40 - 0.62 * 60}" r="5" fill="${N}"/>`;
    g += tx(bxX + 8, Y1 + 22, "break-even  500 units", { size: 11.5, fill: B2, w: 700 });
    g += tx(24, 292, "Break-even = fixed / (price - variable)  =  2000 / (10 - 6)", { size: 12, fill: B2 });
    return svg("Break-even", 310, g);
  })());

  add("business_mid_m1", "SWOT", MX([
    { t: "S  Strengths", items: ["internal", "what we do well"] },
    { t: "W  Weaknesses", items: ["internal", "what holds us back"] },
    { t: "O  Opportunities", items: ["external", "use S to seize O"], tc: "#7a2b12" },
    { t: "T  Threats", items: ["external", "address W against T"], tc: "#7a2b12" }
  ]));

  add("business_mid_m2", "Performance comparison", BR([{ l: "Target", v: 100, c: B }, { l: "Actual", v: 90, c: O }, { l: "Previous", v: 85, c: "#9db7c2" }, { l: "Benchmark", v: 95, c: G }], { max: 120 }));

  add("business_mid_m3", "Segmentation and positioning", (() => {
    let g = "";
    g += bx(24, 56, 172, 58, LB) + tx(110, 90, "Segmentation", { size: 12.5, anchor: "middle" });
    g += ln(196, 85, 226, 85, { marker: true });
    g += bx(226, 56, 172, 58, LB) + tx(312, 90, "Targeting", { size: 12.5, anchor: "middle" });
    g += ln(398, 85, 428, 85, { marker: true });
    g += bx(428, 56, 188, 58, LO) + tx(522, 90, "Positioning", { size: 12.5, anchor: "middle", fill: "#7a2b12" });
    g += tx(24, 150, "Criteria: demographic, geographic, behavioural", { size: 12, fill: G });
    g += tx(24, 196, "4P:   Product    Price    Place    Promotion", { size: 15, fill: B2, w: 700 });
    return svg("Segmentation and positioning", 224, g);
  })());

  add("business_senior_m1", "Integrated strategy", (() => {
    let g = "";
    g += bx(24, 56, 288, 224, "#F4F8FA") + tx(40, 82, "Porter - 5 forces", { size: 13, w: 700, fill: B2 });
    ["Rivals", "New entrants", "Substitutes", "Suppliers", "Buyers"].forEach((t, i) => g += tx(40, 112 + i * 30, "\u2022 " + t, { size: 12 }));
    g += bx(328, 56, 288, 108, LB) + tx(344, 82, "Balanced Scorecard", { size: 13, w: 700, fill: B2 });
    [["Finance", "Customer"], ["Process", "Learning / growth"]].forEach((row, i) => row.forEach((t, k) => g += tx(344 + k * 140, 116 + i * 30, t, { size: 12 })));
    g += bx(328, 172, 288, 108, LO) + tx(344, 198, "Generic strategies", { size: 13, w: 700, fill: "#7a2b12" });
    ["Cost leadership", "Differentiation", "Focus"].forEach((t, i) => g += tx(344, 226 + i * 22, "\u2022 " + t, { size: 12 }));
    return svg("Integrated strategy", 292, g);
  })());

  add("business_senior_m2", "ROI and investments", FM([
    "ROI = (profit - investment cost) / investment cost",
    "Payback = investment / annual flow",
    "50,000 / 20,000 = 2.5 years",
    "NPV accounts for the time value of money",
    "ROI ignores time"
  ]));

  add("business_senior_m3", "Risk", (() => {
    let g = "";
    const cell = (x, y, t, fill) => bx(x, y, 150, 80, fill) + tx(x + 75, y + 44, t, { size: 12, anchor: "middle" });
    g += tx(24, 78, "Impact", { size: 12, fill: G });
    g += cell(150, 56, "Medium", "#FEF7C3") + cell(300, 56, "High", "#FDE0E0") + cell(450, 56, "Critical", "#F8C9C9");
    g += cell(150, 140, "Low", "#DEFCE7") + cell(300, 140, "Medium", "#FEF7C3") + cell(450, 140, "High", "#FDE0E0");
    g += tx(64, 240, "Risk = probability x impact", { size: 13, fill: B2, w: 700 });
    g += tx(64, 268, "Treatment:  avoid  -  mitigate  -  transfer  -  accept", { size: 12 });
    g += tx(64, 292, "Residual risk after controls, monitored continuously", { size: 11.5, fill: G });
    return svg("Risk", 310, g);
  })());
}
