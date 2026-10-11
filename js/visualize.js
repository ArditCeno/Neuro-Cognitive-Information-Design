/*
 * Node map (session tree) + hashmap (flat key -> value) visuals.
 * Used on the final screen, in the admin panel, and inside the PDF report.
 *
 * Copyright (c) 2026 Ardit Ceno. All rights reserved.
 */

/** Flatten a nested object into [key, value] rows (dot notation). */
export function flatten(obj, prefix = "") {
  const rows = [];
  const walk = (val, path) => {
    if (val == null) { rows.push([path, ""]); return; }
    if (Array.isArray(val)) {
      val.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (typeof val === "object") {
      Object.keys(val).forEach((k) => walk(val[k], path ? `${path}.${k}` : k));
    } else {
      rows.push([path, val]);
    }
  };
  walk(obj, prefix);
  return rows;
}

/** Build the node graph for a session summary. */
export function layoutTree(summary) {
  const nodes = [];
  const edges = [];
  const push = (label, sub, depth) => { nodes.push({ label, sub, depth }); return nodes.length - 1; };

  const p = summary.participant || {};
  const root = push(`Participant ${p.id_anonim || ""}`, p.profesioni || "", 0);
  const sess = push("Session", (summary.session || {}).session_number ? `#${summary.session.session_number}` : "", 1);
  edges.push([root, sess]);

  (summary.modules || []).forEach((m) => {
    const mi = push(`${m.fusha} / ${m.niveli || ""}`, m.versioni_i_parë ? `first: ${m.versioni_i_parë}` : "", 2);
    edges.push([sess, mi]);
    (m.trials || []).forEach((t) => {
      const ti = push(`v${t.versioni}`, `${t.accuracy_score_pct != null ? t.accuracy_score_pct + "%" : ""}`, 3);
      edges.push([mi, ti]);
    });
  });
  return { nodes, edges };
}

const XS = 190, YS = 46, PAD = 20;

/** Render the node map as an SVG element into a container. */
export function renderNodeMap(container, summary) {
  const { nodes, edges } = layoutTree(summary);
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const w = PAD * 2 + (maxDepth + 1) * XS;
  const h = PAD * 2 + nodes.length * YS;

  const pos = nodes.map((n, i) => ({ x: PAD + n.depth * XS, y: PAD + i * YS + YS / 2 }));
  const lines = edges.map(([a, b]) =>
    `<path d="M ${pos[a].x + 150} ${pos[a].y} C ${pos[a].x + 180} ${pos[a].y}, ${pos[b].x - 20} ${pos[b].y}, ${pos[b].x} ${pos[b].y}" fill="none" stroke="rgba(14,127,176,.6)" stroke-width="1.5"/>`
  ).join("");
  const boxes = nodes.map((n, i) => {
    const x = pos[i].x, y = pos[i].y - 15;
    return `<g><rect x="${x}" y="${y}" rx="8" width="150" height="30" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.22)"/>
      <text x="${x + 10}" y="${y + 13}" fill="#F9F9F9" font-size="11" font-family="Outfit,sans-serif">${esc(n.label).slice(0, 26)}</text>
      <text x="${x + 10}" y="${y + 25}" fill="#9fb8c6" font-size="9.5" font-family="Outfit,sans-serif">${esc(n.sub).slice(0, 30)}</text></g>`;
  }).join("");

  container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${Math.min(h, 460)}" preserveAspectRatio="xMinYMin meet" style="max-height:460px">${lines}${boxes}</svg>`;
  container.style.overflow = "auto";
}

/** Render the hashmap as a key -> value table. */
export function renderHashmap(container, summary) {
  const rows = flatten(summary).slice(0, 400);
  container.innerHTML = `<table class="hashmap"><thead><tr><th>key</th><th>value</th></tr></thead><tbody>${
    rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(String(v)).slice(0, 120)}</td></tr>`).join("")
  }</tbody></table>`;
  container.style.maxHeight = "420px";
  container.style.overflow = "auto";
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
