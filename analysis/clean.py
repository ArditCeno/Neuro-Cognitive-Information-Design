#!/usr/bin/env python3
"""
clean.py — Stage 01 (Pastrim).

Load NCID session_*.json exports, flatten to a tidy table (one row per
participant x module x version trial), and apply the pre-registered
exclusion criteria.

Usage:
    python clean.py --input ../raw --output ../data/processed
"""
import argparse
import glob
import json
import os
import sys

import pandas as pd

CALIBRATION_PX_MAX = 150.0  # pre-registered (risk register / M3)


def load_sessions(input_dir):
    files = sorted(glob.glob(os.path.join(input_dir, "session_*.json")))
    if not files:
        sys.exit(f"No session_*.json found in {input_dir}")
    for path in files:
        with open(path, encoding="utf-8") as fh:
            try:
                yield path, json.load(fh)
            except json.JSONDecodeError as exc:
                print(f"[skip] {path}: {exc}")


def flatten(session):
    participant = session.get("participant", {}) or {}
    meta = session.get("session", {}) or {}
    sid = participant.get("id_anonim")
    rows = []
    for module in session.get("modules", []) or []:
        field = module.get("fusha")
        order = module.get("rendi_në_seson")
        first = module.get("versioni_i_parë")
        tlx = module.get("nasa_tlx") or {}
        for trial in module.get("trials", []) or []:
            stim = trial.get("stimulus", {}) or {}
            responses = trial.get("response", []) or []
            items = trial.get("quiz_item", []) or []
            crit = [(r, it) for r, it in zip(responses, items) if it.get("kritike")]
            rows.append({
                "id_anonim": sid,
                "profesioni_participant": participant.get("profesioni"),
                "niveli_ekspertizes": participant.get("niveli_i_ekspertizës"),
                "mosha": participant.get("mosha"),
                "session_number": meta.get("session_number"),
                "gjuha": meta.get("gjuha"),
                "metoda": meta.get("metoda"),
                "kalibrimi_px": meta.get("kalibrimi_px"),
                "kohëzgjatja_min": meta.get("kohëzgjatja_min"),
                "fusha": field,
                "rendi_në_seson": order,
                "versioni_i_parë": first,
                "versioni": trial.get("versioni"),
                "stimulus_gjatesia": stim.get("gjatësia"),
                "stimulus_lexueshmeria": stim.get("lexueshmëria"),
                "koha_e_leximit_s": trial.get("koha_e_leximit_s"),
                "koha_detyrës_s": trial.get("koha_detyrës_s"),
                "TTFF_ms": trial.get("TTFF_ms"),
                "regresione": trial.get("regresione"),
                "fixation_duration_ms": trial.get("fixation_duration_ms"),
                "fixation_count": trial.get("fixation_count"),
                "accuracy_score_pct": trial.get("accuracy_score_pct"),
                "correct_answers": sum(1 for r in responses if r.get("e_saktë")),
                "total_questions": len(responses),
                "critical_correct": sum(1 for r, _ in crit if r.get("e_saktë")),
                "critical_total": len(crit),
                "tlx_mental": tlx.get("mental"),
                "tlx_effort": tlx.get("effort"),
                "tlx_frustration": tlx.get("frustration"),
            })
    return rows


def apply_exclusions(df, calib_max):
    n0 = len(df)
    df = df[df["metoda"] != "mock"].copy()
    df = df[df["fixation_duration_ms"].notna()].copy()
    # exclude weak calibrations (keep mouse-fallback sessions, which have no px)
    bad = df["kalibrimi_px"].notna() & (df["kalibrimi_px"] >= calib_max)
    df = df[~bad].copy()
    print(f"[exclude] rows: {n0} -> {len(df)} "
          f"(weak calibration >= {calib_max} px, mock sessions, empty metrics)")
    return df


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="../raw")
    ap.add_argument("--output", default="../data/processed")
    ap.add_argument("--calibration-max", type=float, default=CALIBRATION_PX_MAX)
    args = ap.parse_args()

    rows = []
    n_sessions = 0
    for _, session in load_sessions(args.input):
        n_sessions += 1
        rows.extend(flatten(session))

    if not rows:
        sys.exit("No trials found.")

    df = pd.DataFrame(rows)
    df = apply_exclusions(df, args.calibration_max)

    os.makedirs(args.output, exist_ok=True)
    trials_path = os.path.join(args.output, "trials.csv")
    df.to_csv(trials_path, index=False)

    participants = (df.groupby("id_anonim")
                      .agg(session_number=("session_number", "first"),
                           gjuha=("gjuha", "first"),
                           kalibrimi_px=("kalibrimi_px", "first"),
                           profesioni=("profesioni_participant", "first"),
                           kohëzgjatja_min=("kohëzgjatja_min", "first"))
                      .reset_index())
    participants_path = os.path.join(args.output, "participants.csv")
    participants.to_csv(participants_path, index=False)

    print(f"[done] sessions={n_sessions} trials={len(df)} "
          f"participants={len(participants)}")
    print(f"       -> {trials_path}")
    print(f"       -> {participants_path}")


if __name__ == "__main__":
    main()
