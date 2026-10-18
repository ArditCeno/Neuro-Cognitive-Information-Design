/*
 * Shared flat-SVG diagram library for the NCID study materials.
 * Palette matches the site: navy / blue / orange on white. No gradients,
 * no heavy shadows, no glass - clean technical drawing only.
 *
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */

export const N = "#092634";   // navy
export const B = "#0E7FB0";   // blue
export const B2 = "#004E72";  // dark blue
export const O = "#FF6E42";   // orange
export const G = "#2F7FA0";   // muted blue
export const LB = "#E8F1F7";  // light blue
export const LO = "#FDE7DF";  // light orange
export const BD = "#d5dbdf";  // border
export const MONO = "ui-monospace,'Cascadia Mono',Menlo,Consolas,monospace";

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function tx(x, y, s, o = {}) {
  const size = o.size || 13, fill = o.fill || N, w = o.w || 400, anchor = o.anchor || "start";
  const mono = o.mono ? ` font-family="${MONO}"` : "";
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}"${mono}>${esc(s)}</text>`;
}

export const bx = (x, y, w, h, fill, stroke) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke || BD}"/>`;

export const ln = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || N}" stroke-width="${o.w || 1.3}"${o.marker ? ' marker-end="url(#ar)"' : ""}${o.dash ? ' stroke-dasharray="4 4"' : ""}/>`;

export function svg(title, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 ${h}" width="640" height="${h}" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="${esc(title)}">
<defs><marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6" fill="${N}"/></marker></defs>
<rect x="0.5" y="0.5" width="639" height="${h - 1}" fill="#ffffff" stroke="${BD}"/>
<text x="24" y="30" font-size="14.5" font-weight="700" fill="${N}">${esc(title)}</text>
<line x1="24" y1="40" x2="616" y2="40" stroke="${BD}"/>
${inner}
</svg>`;
}

export const S = (title, r) => svg(title, r.h, r.g);

export function wrapText(s, max) {
  const words = String(s).split(" ");
  const out = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) { if (cur) out.push(cur); cur = w; }
    else cur = (cur ? cur + " " : "") + w;
  }
  if (cur) out.push(cur);
  return out;
}

/* ---------- builders (return {h, g}) ---------- */

export function VS(items) {
  const h = 52 + items.length * 42 + 8; let g = "";
  items.forEach((s, i) => {
    const y = 52 + i * 42;
    g += `<circle cx="34" cy="${y + 16}" r="13" fill="${B}"/>` + tx(34, y + 21, String(i + 1), { size: 12.5, fill: "#fff", w: 700, anchor: "middle" });
    g += tx(60, y + 21, s, { size: 13.5 });
    if (i < items.length - 1) g += ln(24, y + 34, 616, y + 34, { stroke: BD });
  });
  return { h, g };
}

export function HF(items, o = {}) {
  const h = o.h || 142, fill = o.fill || LB, n = items.length, gap = 26, x0 = 24, W0 = 592;
  const bw = (W0 - (n - 1) * gap) / n; let g = "";
  items.forEach((s, i) => {
    const x = x0 + i * (bw + gap);
    g += bx(x, 56, bw, 60, fill);
    const lines = wrapText(s, Math.max(8, Math.floor(bw / 7.4)));
    lines.slice(0, 2).forEach((l, k) => {
      const yy = lines.length === 1 ? 91 : 80 + k * 18;
      g += tx(x + bw / 2, yy, l, { size: 12.5, anchor: "middle" });
    });
    if (i < n - 1) g += ln(x + bw, 86, x + bw + gap, 86, { marker: true });
  });
  return { h, g };
}

export function TC(lh, lit, rh, rit, o = {}) {
  const rows = Math.max(lit.length, rit.length);
  const h = 64 + rows * (o.rowH || 26) + 18; let g = "";
  const draw = (x, head, items, fill) => {
    g += bx(x, 52, 288, h - 66, fill);
    g += tx(x + 14, 74, head, { size: 13.5, w: 700, fill: B2 });
    items.forEach((t, i) => { g += tx(x + 14, 98 + i * (o.rowH || 26), "\u2022 " + t, { size: 12.5 }); });
  };
  draw(24, lh, lit, "#F4F8FA"); draw(328, rh, rit, LO);
  return { h, g };
}

export function TB(headers, rows, o = {}) {
  const n = headers.length, x0 = 24, W0 = 592, cw = W0 / n, rh = o.rh || 30;
  const h = 52 + (rows.length + 1) * rh + 12; let g = "";
  g += bx(x0, 52, W0, (rows.length + 1) * rh, "#ffffff", BD);
  g += `<rect x="${x0}" y="52" width="${W0}" height="${rh}" fill="${LB}"/>`;
  headers.forEach((t, i) => { g += tx(x0 + i * cw + cw / 2, 52 + rh / 2 + 5, t, { size: 12.5, w: 700, anchor: "middle", fill: B2 }); });
  rows.forEach((r, ri) => {
    const y = 52 + (ri + 1) * rh;
    if (ri % 2) g += `<rect x="${x0}" y="${y}" width="${W0}" height="${rh}" fill="#F5F8FA"/>`;
    r.forEach((c, ci) => { g += tx(x0 + ci * cw + cw / 2, y + rh / 2 + 5, c, { size: 12.5, anchor: "middle" }); });
    if (ri < rows.length - 1) g += ln(x0, y, x0 + W0, y, { stroke: BD });
  });
  for (let i = 1; i < n; i++) g += ln(x0 + i * cw, 52, x0 + i * cw, 52 + (rows.length + 1) * rh, { stroke: BD });
  return { h, g };
}

export function FM(lines) {
  const h = 52 + lines.length * 38 + 10; let g = "";
  lines.forEach((s, i) => {
    const y = 52 + i * 38;
    g += bx(24, y, 592, 30, i % 2 ? "#F5F8FA" : "#ffffff");
    g += tx(40, y + 20, s, { size: 13.5, fill: B2, mono: true });
  });
  return { h, g };
}

export function CODE(pairs) {
  const h = 52 + pairs.length * 30 + 10; let g = "";
  g += bx(24, 52, 592, h - 62, "#F7FAFB");
  pairs.forEach(([c, note], i) => {
    const y = 74 + i * 30;
    g += tx(40, y, c, { size: 13, fill: B2, mono: true });
    g += tx(300, y, note, { size: 12, fill: G });
  });
  return { h, g };
}

export function BR(items, o = {}) {
  const plotB = 220, X0 = 64, X1 = 612;
  const max = o.max || Math.max(...items.map((i) => i.v)) * 1.15;
  const h = 52 + plotB + 46; let g = "";
  g += ln(X0, 62, X0, 62 + plotB, { stroke: BD });
  g += ln(X0, 62 + plotB, X1, 62 + plotB, { stroke: BD });
  const bw = (X1 - X0) / items.length;
  items.forEach((it, i) => {
    const bh = (it.v / max) * (plotB - 20);
    const x = X0 + i * bw + bw * 0.2, w = bw * 0.6, y = 62 + plotB - bh;
    g += `<rect x="${x}" y="${y}" width="${w}" height="${bh}" rx="4" fill="${it.c || B}"/>`;
    g += tx(x + w / 2, y - 6, it.tag || String(it.v), { size: 11.5, anchor: "middle", fill: B2, w: 700 });
    wrapText(it.l, Math.floor(bw / 7)).forEach((l, k) => { g += tx(x + w / 2, 62 + plotB + 18 + k * 13, l, { size: 11, anchor: "middle", fill: G }); });
  });
  return { h, g };
}

export function MX(cells, o = {}) {
  const cw = 288, ch = o.ch || 140, h = 52 + 2 * ch + 18; let g = "";
  const pts = [[24, 52], [328, 52], [24, 52 + ch + 8], [328, 52 + ch + 8]];
  cells.forEach((c, i) => {
    const [x, y] = pts[i];
    g += bx(x, y, cw, ch, c.fill || (i < 2 ? "#F4F8FA" : LO));
    g += tx(x + 16, y + 28, c.t, { size: 13.5, w: 700, fill: c.tc || B2 });
    (c.items || []).forEach((t, k) => { g += tx(x + 16, y + 52 + k * 20, t, { size: 12, fill: N }); });
  });
  return { h, g };
}

export function PY(levels) {
  const n = levels.length, rowH = 44, topW = 210, botW = 560;
  const h = 52 + n * rowH + 8; let g = "";
  levels.forEach((s, i) => {
    const w = topW + (botW - topW) * (i / (n - 1 || 1));
    const x = 320 - w / 2, y = 52 + (n - 1 - i) * rowH;
    g += bx(x, y, w, rowH - 6, i % 2 ? LO : LB);
    g += tx(320, y + (rowH - 6) / 2 + 5, s, { size: 12.5, anchor: "middle" });
  });
  return { h, g };
}

export function CY(items, o = {}) {
  const h = o.h || 372, cx = 320, cy = 218, r = 116, n = items.length; let g = "";
  const pt = (deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  for (let i = 0; i < n; i++) {
    const a0 = -90 + (360 / n) * i + 20, a1 = -90 + (360 / n) * (i + 1) - 20;
    const [sx, sy] = pt(a0), [ex, ey] = pt(a1);
    g += `<path d="M${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}" fill="none" stroke="${N}" stroke-width="1.3" marker-end="url(#ar)"/>`;
  }
  items.forEach((it, i) => {
    const [x, y] = pt(-90 + (360 / n) * i);
    g += `<circle cx="${x}" cy="${y}" r="40" fill="${LB}" stroke="${B}"/>`;
    const lines = Array.isArray(it) ? it.map(String) : wrapText(it, 11);
    lines.slice(0, 2).forEach((l, k) => { g += tx(x, y + (lines.length === 1 ? 5 : -5 + k * 15), l, { size: 11.5, anchor: "middle" }); });
  });
  return { h, g };
}
