#!/usr/bin/env python3
"""
metrics.py — Stage 02 (Metrika dhe AOI).

Recompute/aggregate AOI-level dwell from the raw exports and produce
descriptive statistics per field x version.

Usage:
    python metrics.py --input ../raw --output ../data/processed
"""
import argparse
import glob
import json
import os

import pandas as pd

METRICS = [
    "fixation_duration_ms", "regresione", "TTFF_ms",
    "koha_e_leximit_s", "koha_detyrës_s", "accuracy_score_pct",
]


def iter_sessions(input_dir):
    for path in sorted(glob.glob(os.path.join(input_dir, "session_*.json"))):
        with open(path, encoding="utf-8") as fh:
            yield json.load(fh)


def aoi_rows(session):
    sid = (session.get("participant") or {}).get("id_anonim")
    out = []
    for module in session.get("modules", []) or []:
        for trial in module.get("trials", []) or []:
            for dwell in trial.get("aoi_dwell", []) or []:
                out.append({
                    "id_anonim": sid,
                    "fusha": module.get("fusha"),
                    "versioni": trial.get("versioni"),
                    "aoi": dwell.get("name"),
                    "duration_ms": dwell.get("duration_ms"),
                })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="../raw")
    ap.add_argument("--output", default="../data/processed")
    ap.add_argument("--trials", default=None,
                    help="trials.csv from clean.py (default: output/trials.csv)")
    args = ap.parse_args()
    os.makedirs(args.output, exist_ok=True)

    # --- AOI dwell table from raw exports ---
    rows = []
    for s in iter_sessions(args.input):
        rows.extend(aoi_rows(s))
    if rows:
        aoi = pd.DataFrame(rows)
        aoi_path = os.path.join(args.output, "aoi_dwell.csv")
        aoi.to_csv(aoi_path, index=False)
        print(f"[aoi] -> {aoi_path} ({len(aoi)} rows)")

    # --- descriptive summary per field x version ---
    trials_path = args.trials or os.path.join(args.output, "trials.csv")
    if not os.path.exists(trials_path):
        print(f"[warn] {trials_path} not found; run clean.py first.")
        return
    trials = pd.read_csv(trials_path)
    present = [m for m in METRICS if m in trials.columns]
    summary = (trials.groupby(["fusha", "versioni"])[present]
                     .agg(["mean", "std", "count"]))
    out = os.path.join(args.output, "metrics_summary.csv")
    summary.to_csv(out)
    print(f"[summary] -> {out}")


if __name__ == "__main__":
    main()
