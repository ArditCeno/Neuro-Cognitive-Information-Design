/*
 * Unit checks for the AOI engine (fixations, saccades, dwell).
 * Run: node scripts/test-aoi.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { detectFixations, computeMetrics } from "../js/aoi.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL " + m); } };

// Two stable clusters: 5 samples at (100,100), then 5 at (500,500), 50 ms apart.
const samples = [];
for (let k = 0; k < 5; k++) samples.push({ t: k * 50, dx: 100 + (k % 2), dy: 100, x: 100, y: 100 });
for (let k = 0; k < 5; k++) samples.push({ t: 250 + k * 50, dx: 500 + (k % 2), dy: 500, x: 500, y: 500 });

const fix = detectFixations(samples);
ok(fix.length === 2, "two fixations detected (got " + fix.length + ")");
if (fix.length === 2) {
  ok(Math.abs(fix[0].x - 100) < 1 && Math.abs(fix[0].y - 100) < 1, "first fixation centred on (100,100)");
  ok(Math.abs(fix[1].x - 500) < 1 && Math.abs(fix[1].y - 500) < 1, "second fixation centred on (500,500)");
  ok(fix[0].duration >= 100, "first fixation duration is measured");
}

const metrics = computeMetrics({ samples, startT: 0 }, [
  { name: "left", x: 0, y: 0, width: 250, height: 250 },
  { name: "right", x: 400, y: 400, width: 200, height: 200 }
]);
ok(metrics.fixation_count === 2, "computeMetrics counts fixations");
ok(Array.isArray(metrics.dwell) && metrics.dwell.length === 2, "computeMetrics returns dwell per AOI");

console.log("AOI checks: PASS " + pass + "  FAIL " + fail);
process.exit(fail ? 1 : 0);
