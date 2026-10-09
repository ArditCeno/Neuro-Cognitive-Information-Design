#!/usr/bin/env python3
"""
figures.py — Stage 04 (Figura dhe Heatmap).

Boxplots of A vs B per field for the key metrics, an effect-size chart, and
an aggregate gaze-density illustration (heatmap-style) from gaze_*.json.

Usage:
    python figures.py --trials ../data/processed/trials.csv --gaze ../raw --output ../data/figures
"""
import argparse
import glob
import json
import os

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

METRICS = {
    "fixation_duration_ms": "Fixation duration (ms)",
    "regresione": "Saccadic regressions",
    "TTFF_ms": "Time-to-first-fixation (ms)",
    "koha_detyrës_s": "Task completion time (s)",
    "accuracy_score_pct": "Accuracy (%)",
}


def boxplots(df, out_dir):
    for metric, label in METRICS.items():
        if metric not in df.columns:
            continue
        fields = sorted(df["fusha"].dropna().unique())
        data, positions, colors = [], [], []
        for i, f in enumerate(fields):
            for j, v in enumerate(["A", "B"]):
                vals = df[(df["fusha"] == f) & (df["versioni"] == v)][metric].dropna()
                data.append(vals.to_numpy())
                positions.append(i * 2.4 + j * 0.9)
                colors.append("#9aa3bd" if v == "A" else "#ffd166")
        fig, ax = plt.subplots(figsize=(10, 4.5))
        bp = ax.boxplot(data, positions=positions, widths=0.7, patch_artist=True)
        for patch, c in zip(bp["boxes"], colors):
            patch.set_facecolor(c)
        ax.set_xticks([i * 2.4 + 0.45 for i in range(len(fields))])
        ax.set_xticklabels(fields)
        ax.set_ylabel(label)
        ax.set_title(f"A vs B — {label}")
        fig.tight_layout()
        path = os.path.join(out_dir, f"box_{metric}.png")
        fig.savefig(path, dpi=140)
        plt.close(fig)
        print(f"[fig] {path}")


def gaze_heatmap(gaze_dir, out_dir, bins=60):
    xs, ys = [], []
    for path in glob.glob(os.path.join(gaze_dir, "gaze_*.json")):
        with open(path, encoding="utf-8") as fh:
            try:
                payload = json.load(fh)
            except json.JSONDecodeError:
                continue
        for s in payload.get("gaze", []):
            if s.get("dx") is not None and s.get("dy") is not None:
                xs.append(s["dx"]); ys.append(s["dy"])
    if not xs:
        print("[fig] no gaze samples with dx/dy; skipping heatmap.")
        return
    fig, ax = plt.subplots(figsize=(8, 6))
    h = ax.hist2d(xs, ys, bins=bins, cmap="inferno")
    ax.invert_yaxis()
    ax.set_title("Aggregate gaze density (attention heatmap)")
    fig.colorbar(h[3], ax=ax, label="fixations")
    fig.tight_layout()
    path = os.path.join(out_dir, "gaze_heatmap.png")
    fig.savefig(path, dpi=140)
    plt.close(fig)
    print(f"[fig] {path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--trials", default="../data/processed/trials.csv")
    ap.add_argument("--gaze", default="../raw")
    ap.add_argument("--output", default="../data/figures")
    args = ap.parse_args()
    os.makedirs(args.output, exist_ok=True)

    if os.path.exists(args.trials):
        df = pd.read_csv(args.trials)
        boxplots(df, args.output)
    else:
        print(f"[warn] {args.trials} not found; run clean.py first.")

    gaze_heatmap(args.gaze, args.output)


if __name__ == "__main__":
    main()
