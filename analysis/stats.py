#!/usr/bin/env python3
"""
stats.py — Stage 03 (Statistika).

Within-subjects analysis of H1 (fixations/regressions), H2 (speed/accuracy),
H3 (retention/accuracy). Paired t-test / Wilcoxon + mixed-effects models,
Cohen's d, and Holm correction across the three hypotheses.

Usage:
    python stats.py --trials ../data/processed/trials.csv --output ../data/processed
"""
import argparse
import json
import os

import numpy as np
import pandas as pd
from scipy import stats

try:
    import statsmodels.formula.api as smf
    HAVE_SM = True
except Exception:  # pragma: no cover
    HAVE_SM = False


H1_METRICS = ["fixation_duration_ms", "regresione"]
H2_METRICS = ["TTFF_ms", "koha_detyrës_s", "critical_error"]
H3_METRICS = ["accuracy_score_pct"]


def cohens_d_paired(a, b):
    diff = np.asarray(a) - np.asarray(b)
    sd = np.std(diff, ddof=1)
    return np.nan if sd == 0 else float(np.mean(diff) / sd)


def pairwise(df, metric):
    """Pair A vs B within participant x field."""
    sub = df[["id_anonim", "fusha", "versioni", metric]].dropna()
    wide = sub.pivot_table(index=["id_anonim", "fusha"], columns="versioni",
                           values=metric, aggfunc="mean")
    if "A" not in wide or "B" not in wide:
        return None
    wide = wide.dropna(subset=["A", "B"])
    if len(wide) < 3:
        return None
    a, b = wide["B"].to_numpy(), wide["A"].to_numpy()  # B = optimized
    t, p_t = stats.ttest_rel(a, b)
    try:
        _, p_w = stats.wilcoxon(a, b)
    except ValueError:
        p_w = np.nan
    return {
        "metric": metric,
        "n_pairs": int(len(wide)),
        "mean_A": float(np.mean(b)),
        "mean_B": float(np.mean(a)),
        "t": float(t),
        "p_ttest": float(p_t),
        "p_wilcoxon": float(p_w),
        "cohens_d": cohens_d_paired(a, b),
    }


def mixed_model(df, metric):
    if not HAVE_SM:
        return None
    sub = df[["id_anonim", "fusha", "versioni", metric]].dropna().copy()
    sub["versioni"] = pd.Categorical(sub["versioni"], categories=["A", "B"])
    sub["fusha"] = pd.Categorical(sub["fusha"])
    try:
        model = smf.mixedlm(f"{metric} ~ C(versioni) + C(fusha)", sub,
                            groups=sub["id_anonim"])
        res = model.fit(method="lbfgs")
        # coefficient for version B
        key = [k for k in res.params.index if k.startswith("C(versioni)")]
        if not key:
            return None
        coef = key[0]
        return {
            "metric": metric,
            "coef_B": float(res.params[coef]),
            "se": float(res.bse[coef]),
            "z": float(res.tvalues[coef]),
            "p_mixed": float(res.pvalues[coef]),
        }
    except Exception as exc:  # pragma: no cover
        print(f"[mixed] {metric}: {exc}")
        return None


def holm(pvals):
    """Return Holm-adjusted p-values preserving input order."""
    idx = np.argsort(pvals)
    m = len(pvals)
    adj = [None] * m
    running = 0.0
    for rank, i in enumerate(idx):
        val = min(1.0, (m - rank) * pvals[i])
        running = max(running, val)
        adj[i] = running
    return adj


def hypothesis_pvalues(df):
    # per hypothesis: smallest paired-test p among its metrics
    families = {"H1": H1_METRICS, "H2": H2_METRICS, "H3": H3_METRICS}
    fam_p, rows = [], []
    for h, metrics in families.items():
        ps = []
        for m in metrics:
            r = pairwise(df, m)
            if r:
                rows.append({**r, "hypothesis": h})
                ps.append(min(r["p_ttest"], r["p_wilcoxon"] if not np.isnan(r["p_wilcoxon"]) else 1))
        fam_p.append(min(ps) if ps else 1.0)
    adj = holm(fam_p)
    return rows, dict(zip(families.keys(), adj))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--trials", default="../data/processed/trials.csv")
    ap.add_argument("--output", default="../data/processed")
    args = ap.parse_args()

    df = pd.read_csv(args.trials)
    if "critical_total" in df and "critical_correct" in df:
        df["critical_error"] = df["critical_total"] - df["critical_correct"]

    rows, holm_by_h = hypothesis_pvalues(df)

    results = {"paired_tests": rows, "holm": holm_by_h, "mixed_effects": []}
    for m in H1_METRICS + H2_METRICS + H3_METRICS:
        mr = mixed_model(df, m) if m in df.columns else None
        if mr:
            results["mixed_effects"].append(mr)

    os.makedirs(args.output, exist_ok=True)
    out = os.path.join(args.output, "stats_results.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2, ensure_ascii=False)
    print(f"[stats] -> {out}")
    print(json.dumps({"holm_adjusted_p": holm_by_h}, indent=2))


if __name__ == "__main__":
    main()
