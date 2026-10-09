#!/usr/bin/env python3
"""
fetch_supabase.py — export sessions from Supabase/PostgreSQL into raw/*.json
so the analysis pipeline (clean.py, metrics.py, ...) can consume them.

Usage:
    export DATABASE_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
    python fetch_supabase.py --output ../raw
"""
import argparse
import json
import os
import sys

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit("Install psycopg2-binary:  pip install psycopg2-binary")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dsn", default=os.environ.get("DATABASE_URL"),
                    help="PostgreSQL DSN (default: $DATABASE_URL)")
    ap.add_argument("--output", default="../raw")
    args = ap.parse_args()
    if not args.dsn:
        sys.exit("Provide --dsn or set DATABASE_URL")

    os.makedirs(args.output, exist_ok=True)
    conn = psycopg2.connect(args.dsn)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Try the Spring Boot table first, then the direct-Supabase table shape.
            cur.execute("select id, id_anonim, payload, created_at from sessions "
                        "order by created_at")
            rows = cur.fetchall()
    finally:
        conn.close()

    n = 0
    for row in rows:
        payload = row["payload"]
        if isinstance(payload, str):
            payload = json.loads(payload)
        # normalise to the summary shape the analysis expects
        if "participant" not in payload and "summary" in payload:
            payload = payload["summary"]
        sid = (payload.get("participant") or {}).get("id_anonim") or row["id_anonim"]
        path = os.path.join(args.output, f"session_{sid}.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)
        n += 1

    print(f"[fetch] exported {n} sessions -> {args.output}")


if __name__ == "__main__":
    main()
