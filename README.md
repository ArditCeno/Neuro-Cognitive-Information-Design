# Neuro-Cognitive Information Design (NCID)

Browser-based eye-tracking A/B study measuring **digital readability** across five
professional fields — Legal, Finance, Business, Health, Software — using
WebGazer.js, MediaPipe Face Mesh, jsPsych and Heatmap.js. No special hardware:
participants only need a computer with a webcam.

Each participant reads **both** version A (traditional) and version B
(neuro-optimised) of documents with identical facts, in counterbalanced order,
across **3 of 5** modules.

---

## 1. Flow (sequence diagram)

```
[1 Consent] -> [2 Calibrate 9 points] -> [3 Read A/B docs + eye-tracking]
   -> [4 Quiz + NASA-TLX] (x3 modules) -> [5 Save anonymous JSON + debrief]
```

Quality control: if calibration error >= **150 px** the 9-point routine repeats
automatically (up to `calibrationMaxAttempts`); if it still fails, the session
switches to **MouseView.js** mouse-tracking (plan B) and is flagged.

## 2. Architecture (components diagram)

| Layer | Components |
|-------|------------|
| **Participant app** | jsPsych (flow, timing, quiz), WebGazer.js (gaze x,y), MediaPipe Face Mesh (blink, head pose), A/B stimuli in HTML |
| **Data collection** | Timestamped logger, local buffer against loss (localStorage), anonymous ID, JSON export |
| **Backend (optional)** | Supabase or Firebase, encrypted storage, session-quality dashboard |
| **Analysis (Python)** | 01 Cleaning, 02 Metrics & AOI, 03 Statistics, 04 Figures & Heatmap.js |

## 3. Tools
WebGazer.js · MediaPipe Face Mesh · jsPsych · Heatmap.js · Supabase/Firebase ·
Python (pandas, scipy, statsmodels) · OSF / G\*Power / NASA-TLX · MouseView.js (plan B).

## 4. Files
```
index.html                 SPA shell
css/main.css, materials.css
js/config.js               5 field protocols, quiz items, study parameters, CDN
js/i18n.js                 Albanian / English strings
js/app.js                  flow controller
js/registration.js (inline)  demographics -> anonymous ID
js/calibration.js          9-point calibration + accuracy
js/eyetracking.js          WebGazer + mock + mouse modes, gaze sampling
js/mouseview.js            plan-B mouse-tracking
js/biometrics.js           MediaPipe blink rate + head pose (exploratory)
js/aoi.js                  fixation / regression / TTFF engine
js/stimuli.js              material loader + AOI extraction ([data-aoi])
js/runner.js               quiz + NASA-TLX (jsPsych primary, DOM fallback)
js/schema.js               UML class-model export assembler + readability
js/storage.js              local buffer, JSON export, Supabase adapter
js/heatmap.js              Heatmap.js researcher view
js/research.js             content-parity + AOI inspector + quality dashboard
materials/                 20 files: 5 fields x A/B x AL/EN
data/session.schema.json   export JSON schema
analysis/                  Python pipeline (see analysis/README.md)
```

## 5. Run locally
Camera access requires a local server (not `file://`):

```bash
npx serve .          # or: python -m http.server 8080
```

Open `http://localhost:3000` (or `:8080`). Use Chrome or Edge for WebGazer +
MediaPipe. Add `?mock=1` to run the full flow with a simulated gaze trace (no
webcam) — useful to validate the pipeline and the Python analysis.

## 6. Study parameters (`js/config.js`)
```js
modulesPerSession: 3      // rotated from 5 fields
design: "within"          // each participant reads both A and B
quizPerDoc: 8             // 8-10 per field
nasaTlx: "perModule"      // NASA-TLX after each module
useJsPsych: true          // jsPsych v7 primary, DOM auto-fallback
calibrationThresholdPx: 150
calibrationMaxAttempts: 2
mouseFallback: true       // switch to MouseView.js if calibration fails
```

## 7. Data model (UML class diagram)
Participant → Session → 3 Modules → Trials → Responses / QuizItems / GazeSamples.
See `data/session.schema.json`. Two files are produced per session:
- `session_<ID>.json` — summary (participant, session, modules, metrics, quiz, gaze available)
- `gaze_<ID>.json` — raw `gaze_sample{t_ms, x, y, dx, dy, blink, head_pose}`

Metrics captured: **Fixation Duration (ms)**, **Saccadic Regressions**,
**Time-to-First-Fixation (ms)**, **Accuracy Score (%)**, Task Completion Time (s),
NASA-TLX, blink rate & head pose (exploratory), reading time (s).

## 8. Researcher panel
Top-bar **Researcher** button: session-quality dashboard, A/B content-parity
(word count + Flesch readability), and AOI inspector/export.

## 9. Privacy & GDPR
- No video is stored — only gaze coordinates `(x, y, t)` and aggregate biometrics.
- Anonymous ID only; the exported dataset never contains names or emails.
- Actions happen locally by default; the Supabase adapter (EU region) is opt-in.
- Participants may withdraw at any time (button clears the local buffer).

## 10. Deploy
Static hosting on GitHub Pages / Vercel / Netlify. Point the root to this folder;
no build step required.

## 11. Analysis
See [`analysis/README.md`](analysis/README.md):
`clean.py → metrics.py → stats.py → figures.py`.

## 12. Roles (use-case diagram)
- **Participant** — consent, calibrate, read A/B, quiz + NASA-TLX.
- **Researcher** — create A/B stimuli + AOI, content-parity review, analyze, publish code/data.
- **Field experts** — review content parity per field.
- **Ethics committee** — ethics approval + pre-registration.

## 13. Risk register
| Risk | Prob. | Impact | Mitigation |
|------|-------|--------|------------|
| Low WebGazer accuracy | High | High | AOI measurement; primary metrics are time & accuracy; MouseView.js plan B |
| Calibration failure | Medium | High | Clear instructions, automatic re-calibration, 20–30% recruitment buffer |
| Too few participants | Medium | High | Within-subjects, early recruitment, balanced module rotation |
| Compromised A/B parity | Medium | High | Same facts, length/readability control, expert review |
| Overstated claims | Medium | Medium | "Indicator" wording, NASA-TLX, declared limitations |
| Ethics delay / data loss | Medium | High | Ecology submission week 2; local buffer + daily backup |

## 14. Development
Syntax check (Node): `node --check js/<file>.js`.
Validate a full run in mock mode before collecting real data.

## 15. Deploy to GitHub Pages
1. Push this repository to `main`.
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow `.github/workflows/deploy-pages.yml` publishes the site on every
   push to `main`. The participant link is then
   `https://<user>.github.io/Neuro-Cognitive-Information-Design/`.

## 16. Collecting data (kept private)
By default the app is local-first and the collected JSON never leaves the
browser. To collect sessions over the internet, add **your own** backend:

- Copy `js/config.local.example.js` to `js/config.local.js` (gitignored) and fill
  in either:
  - **Supabase** — `sessions(id_anonim text, payload jsonb, created_at timestamptz default now())`.
  - **Any JSON endpoint** — Google Apps Script Web App, Formspree, your own API.
- `js/config.local.js`, all `raw/` data, processed data and PDFs are gitignored,
  so keys, endpoints and participant data are never published.

No secrets or personal data belong in the repository.

