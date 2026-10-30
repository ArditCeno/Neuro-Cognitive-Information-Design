# Power analysis (draft)

**Status:** to be completed and dated before data collection.

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
| Correlation A/B | _to estimate from pilot_ | Pilot |
| Attrition | _to estimate from pilot_ | Pilot |
| Design effect (modules) | _to estimate_ | Pilot |

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

## Target sample

- Required N (before attrition): _to fill_
- Required N (after attrition): _to fill_
- Per profession minimum: _to fill_
- Stopping rule: fixed N, no optional stopping.

## Reporting

Report the assumed effect size, alpha, power, correlation, attrition, software
and the resulting N in the protocol and the manuscript.
