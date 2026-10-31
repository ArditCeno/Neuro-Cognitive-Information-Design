/*
 * Worker unit checks (pure helpers, no network).
 * Run: node scripts/test-worker.mjs
 */
import {
  validateSubmission, gazeMeta, parseEmailResult, participantRows, MAX_GAZE_SAMPLES
} from "../worker/src/lib.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL " + m); } };

const base = {
  submission_id: "TEST_001",
  summary: {
    participant: { id_anonim: "USR_001", mosha: 22, profesioni: "Law", "niveli_i_ekspertizës": "Beginner" },
    session: { session_number: 1, kalibrimi_px: 80, "kohëzgjatja_min": 30, gjuha: "al", metoda: "eyetracking" },
    modules: [],
    quiz_results: { accuracy_score_pct: 75 }
  },
  identity: { emri_mbiemer: "Test Person" },
  gaze: [{ t_ms: 0, x: 1, y: 2 }, { t_ms: 100, x: 1, y: 3 }]
};

const v = validateSubmission(base);
ok(v.ok, "valid submission accepted");
ok(v.submissionId === "TEST_001", "submission id returned");
ok(v.gaze.length === 2, "gaze passed through");

ok(!validateSubmission({}).ok, "empty body rejected");
ok(!validateSubmission({ submission_id: "x", summary: {} }).ok, "missing participant rejected");
ok(!validateSubmission({ ...base, gaze: new Array(MAX_GAZE_SAMPLES + 1).fill({}) }).ok, "gaze cap enforced");
ok(!validateSubmission({ ...base, identity: { emri_mbiemer: "x".repeat(500) } }).ok, "name cap enforced");

const g = gazeMeta(base.gaze);
ok(g.count === 2 && g.duration_ms === 100, "gaze metadata");

ok(parseEmailResult('var r={"ok":true};').ok === true, "email ok parsed");
ok(parseEmailResult('var r={"ok":true,"duplicate":true};').duplicate === true, "email duplicate parsed");
ok(parseEmailResult('var r={"ok":false,"error":"forbidden"};').ok === false, "email error parsed");
ok(parseEmailResult("plain").ok === true, "non-JSON email response treated as ok");

const p = participantRows(base.summary, base.identity);
ok(p.id_anonim === "USR_001", "participant id mapped");
ok(p.age === 22 && p.profession === "Law", "participant fields mapped");
ok(p.full_name === "Test Person", "identity mapped");
ok(p.accuracy_pct === 75, "accuracy mapped");

console.log("Worker checks: PASS " + pass + "  FAIL " + fail);
process.exit(fail ? 1 : 0);
