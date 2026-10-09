# Analysis pipeline (Python)

Four stages matching the deployment/components diagram.

| Stage | File | Purpose |
|-------|------|---------|
| 01 Pastrim | `clean.py` | Load `session_*.json`, flatten, apply pre-registered exclusions |
| 02 Metrika dhe AOI | `metrics.py` | AOI dwell table + descriptive stats per field × version |
| 03 Statistika | `stats.py` | H1/H2/H3 within-subjects tests, mixed-effects, Holm, Cohen's d |
| 04 Figura | `figures.py` | Boxplots A vs B, effect sizes, gaze-density heatmap |

## Install
```bash
python -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run
Fetch sessions from Supabase/PostgreSQL directly (optional):
```bash
export DATABASE_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres"
python fetch_supabase.py --output ../raw
```
Or place the exported `session_*.json` and `gaze_*.json` in a `raw/` folder, then:
```bash
python clean.py    --input ../raw --output ../data/processed
python metrics.py  --input ../raw --output ../data/processed
python stats.py    --trials ../data/processed/trials.csv --output ../data/processed
python figures.py  --trials ../data/processed/trials.csv --gaze ../raw --output ../data/figures
```

## Outputs
- `data/processed/trials.csv` — one row per participant × field × version
- `data/processed/participants.csv`
- `data/processed/aoi_dwell.csv`
- `data/processed/metrics_summary.csv`
- `data/processed/stats_results.json`
- `data/figures/*.png`

## Pre-registered criteria
- Exclude sessions with mean calibration error ≥ **150 px**.
- Exclude mock/test sessions.
- Primary model: mixed-effects with participant and text as random effects, field as fixed factor.
- Holm correction across the three hypotheses.
