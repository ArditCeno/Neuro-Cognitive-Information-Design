# Power analysis

**Status:** paired approximation completed 2026-10-31; simulation-based check
pending pilot estimates.

## Decision

Primary inference is within-subject (format A vs B). The smallest effect of
interest (SESOI) for comprehension accuracy is **5 percentage points**; for
reading time it is a **standardized mean difference of 0.35**.

## Inputs

| Input | Value | Source |
|---|---|---|
| Alpha | .05 (two-sided) | Analysis plan |
| Power | .80 | Conventional |
| SESOI (accuracy) | 5 pp | Researcher decision |
| SESOI (time) | d = 0.35 | Researcher decision |
| Correlation A/B | 0.50 (assumption) | To refine with pilot |
| Attrition | 15% | Conservative planning assumption |
| Design effect (modules) | 1.00 (conservative) | To refine with pilot |

## Method

Because the design has repeated trials per participant and three modules, a
simple paired t-test is optimistic. Use one of:

1. **Simulation-based power** for the mixed-effects model in
   `docs/ANALYSIS_PLAN.md` (recommended), with the pilot estimates.
2. **Paired t-test approximation** as an upper bound for the required N.

### R sketch (paired approximation)

```r
# install.packages("pwr")
library(pwr)
pwr.t.test(d = 0.35, sig.level = .05, power = .80,
           type = "paired", alternative = "two.sided")
```

### Python sketch (simulation)

```python
# Pseudocode: simulate participant-level A/B differences, fit the planned
# model, and record the proportion of p < .05 across 2,000 replications.
```

## Result (paired approximation)

For d = 0.35, alpha = .05 (two-sided), power = .80:

```
n = ((z(1-α/2) + z(power)) / d)^2
  = ((1.95996 + 0.84162) / 0.35)^2
  = 65 participants
```

With 15% attrition: `ceil(65 / 0.85) = 77`, rounded up to **80**.

## Target sample

- Required N (before attrition): **65**
- Required N (after attrition): **80**
- Recruitment goal: **120** (10 per profession) for descriptive coverage.
- Per profession minimum: **5** (descriptive only; not powered for
  profession × format interactions).
- Stopping rule: fixed N, no optional stopping.

The mixed-effects model in `docs/ANALYSIS_PLAN.md` has more parameters than the
paired approximation; the 80 target should be treated as a lower bound. A
simulation-based check with pilot estimates is required before locking the
sample.

## Reporting

Report the assumed effect size, alpha, power, correlation, attrition, software
and the resulting N in the protocol and the manuscript.
