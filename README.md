<div align="center">

# Neuro-Cognitive Information Design

**The official web platform for NCID — an eye-tracking and biometric A/B study measuring digital readability across law, finance, business, health and software.**

<br>

[![Deploy to GitHub Pages](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml)

[![LIVE](https://img.shields.io/badge/LIVE-ARDITCENO.GITHUB.IO%2FNEURO--COGNITIVE--INFORMATION--DESIGN-2ea043?style=for-the-badge&labelColor=0d1b2a&logo=githubpages&logoColor=white)](https://arditceno.github.io/Neuro-Cognitive-Information-Design/)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-Proprietary-FF6E42?style=for-the-badge)](LICENSE)

</div>

---

**NCID** replaces subjective judgement ("I like this layout") with objective
biometric evidence. Each participant reads two versions of the same document —
traditional (A) and optimised (B) — while gaze, timing and comprehension are
measured, using only a webcam.

- **Participant test:** [`/study.html`](https://arditceno.github.io/Neuro-Cognitive-Information-Design/study.html)
- **Researcher dashboard:** [`/admin.html`](https://arditceno.github.io/Neuro-Cognitive-Information-Design/admin.html)
- **Stack:** HTML/CSS/JS · jsPsych · WebGazer · MediaPipe · Spring Boot · Supabase · Python

## Quick start

```bash
npx serve .          # camera needs http(s), not file://
```

Open the landing page → **Start Study**. Use **Chrome/Edge**, allow the camera.
Add `?mock=1` to `study.html` to run the flow with a simulated gaze trace (no webcam).

## The study

| Field | A (traditional) | B (optimised) |
|-------|-----------------|----------------|
| Law | Long clauses, Latin terms | Plain Language + headings |
| Finance | Dense P&L table | Chart + KPIs |
| Business | Two-page report | Executive summary cards |
| Health | Unstructured chart | SOAP / triage |
| Software | Nested `if/else` | Guard clauses |

**Flow:** consent → 9-point eye calibration → read A & B (3 of 5 fields,
counterbalanced) → quiz + NASA-TLX → anonymous save.

**Metrics:** fixation duration · saccadic regressions · time-to-first-fixation ·
accuracy · task & reading time · NASA-TLX · blink rate & head pose.

## Project layout

```
index / about / methodology / fields / contact .html   public pages
study.html · admin.html                                  participant test · dashboard
materials/                                               5 fields × A/B × AL/EN
js/  (app, eyetracking, aoi, schema, storage, site …)
css/ (landing, main, materials)
mediapipe/   FaceMesh assets (for WebGazer)
backend/     Spring Boot API → Supabase / PostgreSQL
analysis/    Python: clean → metrics → stats → figures
```

## Privacy

No video is stored — only gaze `(x, y, t)` and aggregate biometrics, tied to an
anonymous ID. Local-first by default; participants may withdraw at any time.
Secrets and participant data are gitignored.

## Deploy & collect

1. **Pages** — Settings → Pages → Source: **GitHub Actions** (workflow included).
2. **Database** — Supabase (EU) table:
   ```sql
   create table sessions (
     id uuid primary key default gen_random_uuid(),
     id_anonim text not null, payload jsonb not null,
     created_at timestamptz not null default now());
   ```
3. **Secrets** — add `SUPABASE_URL` + `SUPABASE_ANON_KEY` (direct, recommended) or
   deploy `backend/` and add `BACKEND_URL`. The workflow injects them at build
   time; nothing secret is committed.

Details: [`backend/README.md`](backend/README.md) · [`analysis/README.md`](analysis/README.md).

---

<div align="center">

**© 2026 Ardit Ceno — All rights reserved.** · [arditceno1@gmail.com](mailto:arditceno1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/ardit-ceno-a674b5307/)

</div>
