<div align="center">

# Neuro-Cognitive Information Design

**An eye-tracking and biometric study of document readability across law, finance, business, health and software.**

[![Deploy to GitHub Pages](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml)
[![CI](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml)

</div>

---

## Links

The whole website is one page with three tabs (Home, Test, Admin).

| What | Link |
|------|------|
| Website (one link) | https://arditceno.github.io/Neuro-Cognitive-Information-Design/ |
| Participant test | https://arditceno.github.io/Neuro-Cognitive-Information-Design/study.html |
| Admin panel | https://arditceno.github.io/Neuro-Cognitive-Information-Design/admin.html |
| Privacy Policy | https://arditceno.github.io/Neuro-Cognitive-Information-Design/privacy.html |
| Terms and Conditions | https://arditceno.github.io/Neuro-Cognitive-Information-Design/terms.html |

Participants open the website and press **Start the study**. The researcher opens **Admin panel**.

## What the study measures

Each participant picks their profession and reads the same documents in two
versions (A traditional, B optimised) at three difficulty levels. While reading,
the study records:

- fixation duration (ms)
- saccadic regressions (re-reads)
- time to first fixation (ms)
- comprehension accuracy (%)
- reading time and task time (seconds)
- NASA-TLX workload
- blink rate and head orientation (exploratory)

No video is recorded. Only gaze coordinates and timings are stored, linked to an
anonymous ID.

## Run locally

```bash
npx serve .
```

Open `http://localhost:3000/`. The camera works on `http` or `https`, not on a
local file path. Use Chrome or Edge. Add `?mock=1` to `study.html` for a
simulated gaze run (no webcam).

## Project layout

```
index.html              one-page site with Home, Test and Admin tabs
study.html              participant test
admin.html              researcher panel with live results
privacy.html terms.html legal pages
about/methodology/fields/contact.html   public pages
materials/   A and B documents for each profession and level
js/          application, config, eye-tracking, storage, visuals
css/         landing, header, main, materials
mediapipe/   FaceMesh assets for WebGazer
vendor/      heatmap.js, jsPDF, emailjs, supabase-js (local copies)
backend/     Spring Boot API (optional)
analysis/    Python: fetch, clean, metrics, stats, figures
```

## Results in the admin panel

Open the Admin tab. It reads the sessions from Supabase and shows:

- a summary per profession, with each participant's answers
- a **map**: X = tests completed, Y = average comprehension (%), one point per profession
- full session view: node map, hashmap, and a gaze **heatmap**
- search by UUID and CSV export

Updates appear live (Realtime, with a 15-second fallback refresh).

## Email the results as a table

Every registration and every finished session can be emailed to
`arditceno82@gmail.com` as an HTML table, with no backend. Use a **Google Apps
Script** web app (free, sends from your Gmail):

1. Open https://script.google.com and create a new project.
2. Paste this code:

```javascript
function doPost(e) {
  var to = "arditceno82@gmail.com";
  var data = {};
  try { data = JSON.parse(e.postData.contents); } catch (err) {}
  var s = data.summary || data;
  var id = (s.participant && s.participant.id_anonim) || data.id_anonim || "?";
  MailApp.sendEmail({
    to: to,
    subject: "NCID " + (s.kind || "session") + " - " + id,
    htmlBody: tableHTML(s),
    body: "New NCID submission (" + id + ")"
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function tableHTML(s) {
  var p = s.participant || {}, q = s.quiz_results || {};
  var rows = [
    ["ID", p.id_anonim], ["Profession", p.profesioni],
    ["Expertise", p["niveli_i_ekspertizës"]], ["Age", p.mosha],
    ["Type", s.kind], ["Accuracy %", q.accuracy_score_pct], ["Date", s.exported_at]
  ];
  var h = "<h2>NCID " + (s.kind || "session") + "</h2><table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial'>";
  rows.forEach(function (r) { h += "<tr><td><b>" + esc(r[0]) + "</b></td><td>" + esc(r[1]) + "</td></tr>"; });
  h += "</table>";
  var mods = s.modules || [];
  if (mods.length) {
    h += "<h3>Results</h3><table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial'>";
    h += "<tr><th>Level</th><th>Version</th><th>Accuracy %</th><th>Fixation ms</th><th>Regressions</th><th>TTFF ms</th></tr>";
    mods.forEach(function (m) { (m.trials || []).forEach(function (t) {
      h += "<tr><td>" + esc(m.niveli) + "</td><td>" + esc(t.versioni) + "</td><td>" + esc(t.accuracy_score_pct) +
           "</td><td>" + esc(t.fixation_duration_ms) + "</td><td>" + esc(t.regresione) + "</td><td>" + esc(t.TTFF_ms) + "</td></tr>";
    }); });
    h += "</table><h3>Answers</h3><table border='1' cellspacing='0' cellpadding='6' style='border-collapse:collapse;font-family:Arial'>";
    h += "<tr><th>Level</th><th>Version</th><th>Question</th><th>Chosen</th><th>Correct</th></tr>";
    mods.forEach(function (m) { (m.trials || []).forEach(function (t) {
      var qs = t.quiz_item || [];
      (t.response || []).forEach(function (r, i) { var qq = qs[i] || {};
        h += "<tr><td>" + esc(m.niveli) + "</td><td>" + esc(t.versioni) + "</td><td>" + esc(qq.pyetja) +
             "</td><td>" + esc(r.zgjedhja) + "</td><td>" + (r["e_saktë"] ? "yes" : "no") + "</td></tr>";
      });
    }); });
    h += "</table>";
  }
  return h;
}

function esc(x) { return String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
```

3. Deploy: **New deployment** then **Web app**, *Execute as: Me*, *Who has access: Anyone*. Copy the URL that ends with `/exec`.
4. Add that URL as a GitHub secret named **`SUBMISSION_URL`** (Settings, Secrets and variables, Actions). The deploy workflow injects it, so nothing secret is committed.

Now every registration and finished session is emailed to you as a table.

Alternative: use **EmailJS** (set `publicKey`, `serviceId`, `templateId` in
`js/config.local.js`); the message includes a variable `{{html}}` with the same
table.

## Data and privacy

Sessions are stored in Supabase (PostgreSQL). The admin panel reads them
directly. No video is stored; only gaze coordinates and timings, tied to an
anonymous ID. See [privacy.html](privacy.html) and [terms.html](terms.html).

Required Supabase policy (SQL editor):

```sql
alter table sessions enable row level security;
create policy "anon insert" on sessions for insert to anon with check (true);
-- temporary read access for the admin panel (remove when you add a login)
create policy "temp read" on sessions for select to anon using (true);
```

## Deployment

- Hosting: GitHub Pages, published by `.github/workflows/deploy-pages.yml` on
  every push to `main`. In Settings, Pages, set Source to **Deploy from a branch**
  (branch `main`, folder `/`) or to **GitHub Actions**. For a free account the
  repository must be public.
- Continuous integration: `.github/workflows/ci.yml` checks the JavaScript and
  the Python analysis.

## Analysis (Python)

```bash
python -m pip install -r analysis/requirements.txt
python analysis/fetch_supabase.py --output analysis/raw
python analysis/clean.py --input analysis/raw --output analysis/data/processed
```

---

<div align="center">

**Copyright 2026 Ardit Ceno. All rights reserved.** · [arditceno82@gmail.com](mailto:arditceno82@gmail.com)

</div>
