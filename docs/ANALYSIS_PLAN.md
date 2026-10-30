# Analysis plan

**Status:** draft; lock before data collection.

## Primary outcomes

1. **Comprehension accuracy** — proportion correct per trial.
2. **Reading time** — seconds per document.
3. **NASA-TLX** — mean workload per module.

## Secondary outcomes

- Fixation duration (ms), fixation count.
- Saccadic regressions.
- Time to first fixation (ms).
- AOI dwell (ms).
- Preference (A/B/equal).

## Models

- Accuracy: mixed-effects logistic regression (or LMM on arcsine-transformed
  proportions if convergence fails), random intercepts for participant and
  module; fixed effects: format, complexity, expertise, profession.
- Reading/task time: LMM on log-transformed seconds, same random structure.
- NASA-TLX: LMM with format and complexity.
- Secondary gaze metrics: LMM, same structure, reported as exploratory.

## Inference

- Alpha = .05, two-sided.
- Report effect sizes with 95% CI (odds ratios or standardized mean differences).
- Multiplicity: Holm–Bonferroni for the three primary outcomes; Benjamini–Hochberg
  for secondary outcomes.
- No p-value threshold is used as a substitute for effect size and CI.

## Missing data and exclusions

- Trials with calibration error above threshold or gaze coverage < 60% are
  excluded, with counts reported.
- Sensitivity analysis: include all trials, no exclusions.
- No imputation for the primary analysis; report complete-case N.

## Software and reproducibility

- Python 3.12; `analysis/requirements.txt`.
- Scripts: `fetch_supabase.py`, `clean.py`, `metrics.py`, `stats.py`, `figures.py`.
- Set a random seed for any bootstrap/permutation procedure.
- Figures and tables generated from scripts, not edited by hand.

## Pre-registration

- OSF link: _to be added before data collection._
- Any change after registration is listed in `PROTOCOL.md` §10 with a date.
