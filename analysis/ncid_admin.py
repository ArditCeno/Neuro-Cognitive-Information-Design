#!/usr/bin/env python3
"""
NCID admin (email mode).

The study emails every finished session to the researcher. This tool reads that
mailbox over IMAP (Gmail app password), extracts each submission - the embedded
machine-readable block when present, otherwise by parsing the HTML tables - and
builds a searchable report and a CSV. No data leaves your machine and nothing is
uploaded.

Usage
-----
    # set once (Gmail > Security > App passwords):
    #   Windows PowerShell:  $env:NCID_APP_PASSWORD="xxxxxxxxxxxxxxxx"
    #   macOS/Linux:         export NCID_APP_PASSWORD=xxxxxxxxxxxxxxxx

    python analysis/ncid_admin.py --user arditceno82@gmail.com
    python analysis/ncid_admin.py --find "Ardit"          # search by name / ID
    python analysis/ncid_admin.py --find USR_TEST_ARDIT_001

Outputs (default analysis/out/):
    sessions.json    raw records
    sessions.csv     one row per participant (identity + accuracy)
    admin.html       self-contained, searchable report (open in a browser)

Dependencies: standard library only.
"""

import argparse
import base64
import csv
import html
import imaplib
import json
import os
import re
import sys
import email
from email.header import decode_header

IMAP_HOST = "imap.gmail.com"

TAG = re.compile(r"<[^>]+>")
TR = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S | re.I)
TD = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S | re.I)
B64 = re.compile(r'id="ncid-data"[^>]*data-b64="([A-Za-z0-9+/=]+)"')

IDENTITY_LABELS = {
    "Name and surname", "ID", "Profession", "Expertise", "Age", "Type",
    "Session no", "Calibration px", "Duration min", "Browser", "Device",
    "Language", "Method", "Accuracy %", "Date",
}


def cell_text(fragment: str) -> str:
    return html.unescape(TAG.sub("", fragment)).strip()


def decode_header_value(value: str) -> str:
    if not value:
        return ""
    parts = []
    for text, enc in decode_header(value):
        if isinstance(text, bytes):
            parts.append(text.decode(enc or "utf-8", errors="replace"))
        else:
            parts.append(text)
    return "".join(parts)


def message_html(msg) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True) or b""
                return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                payload = part.get_payload(decode=True) or b""
                return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        return ""
    payload = msg.get_payload(decode=True) or b""
    return payload.decode(msg.get_content_charset() or "utf-8", errors="replace")


def parse_rows(html_text: str):
    rows = []
    for tr in TR.findall(html_text):
        cells = [cell_text(td) for td in TD.findall(tr)]
        if cells:
            rows.append(cells)
    return rows


def record_from_html(html_text: str, subject: str) -> dict:
    """Best-effort parse of the human-readable email tables."""
    rows = parse_rows(html_text)
    ident, answers, tlx, bio = {}, [], [], {}
    for cells in rows:
        if len(cells) == 2 and cells[0] in IDENTITY_LABELS:
            ident[cells[0]] = cells[1]
        elif len(cells) == 5 and cells[0] not in ("Level",):
            answers.append({"level": cells[0], "version": cells[1], "question": cells[2], "chosen": cells[3], "correct": cells[4]})
        elif len(cells) == 8 and cells[0] not in ("Module",):
            tlx.append({"module": cells[0], "mental": cells[1], "physical": cells[2], "temporal": cells[3],
                        "performance": cells[4], "effort": cells[5], "frustration": cells[6], "preference": cells[7]})
        elif len(cells) == 2 and ("mean" in cells[0].lower() or "duration" in cells[0].lower()
                                  or "regression" in cells[0].lower() or "blink" in cells[0].lower()
                                  or "fixation" in cells[0].lower() or "completion" in cells[0].lower()
                                  or "reading" in cells[0].lower() or "head" in cells[0].lower()):
            bio[cells[0]] = cells[1]
    return {
        "source": "email-html",
        "subject": subject,
        "name": ident.get("Name and surname", ""),
        "id": ident.get("ID", ""),
        "profession": ident.get("Profession", ""),
        "expertise": ident.get("Expertise", ""),
        "age": ident.get("Age", ""),
        "kind": ident.get("Type", "session"),
        "session_no": ident.get("Session no", ""),
        "calibration_px": ident.get("Calibration px", ""),
        "duration_min": ident.get("Duration min", ""),
        "browser": ident.get("Browser", ""),
        "device": ident.get("Device", ""),
        "language": ident.get("Language", ""),
        "method": ident.get("Method", ""),
        "accuracy": ident.get("Accuracy %", ""),
        "date": ident.get("Date", ""),
        "answers": answers,
        "nasa_tlx": tlx,
        "biometrics": bio,
        "modules": [],
    }


def record_from_embedded(html_text: str, subject: str) -> dict:
    """Preferred: decode the hidden base64 JSON block."""
    m = B64.search(html_text)
    if not m:
        return {}
    try:
        data = json.loads(base64.b64decode(m.group(1)).decode("utf-8"))
    except Exception:
        return {}
    p = data.get("participant", {}) or {}
    ident = data.get("identity", {}) or {}
    s = data.get("session", {}) or {}
    q = data.get("quiz_results", {}) or {}
    return {
        "source": "embedded-json",
        "subject": subject,
        "name": ident.get("emri_mbiemer") or p.get("emri_mbiemer", ""),
        "id": p.get("id_anonim", ""),
        "profession": p.get("profesioni", ""),
        "expertise": p.get("niveli_i_ekspertizës", ""),
        "age": p.get("mosha", ""),
        "kind": data.get("kind", "session"),
        "session_no": s.get("session_number", ""),
        "calibration_px": s.get("kalibrimi_px", ""),
        "duration_min": s.get("kohëzgjatja_min", ""),
        "browser": s.get("shfletuesi", ""),
        "device": s.get("pajisja", ""),
        "language": s.get("gjuha", ""),
        "method": s.get("metoda", ""),
        "accuracy": q.get("accuracy_score_pct", ""),
        "date": data.get("exported_at", ""),
        "answers": [],
        "nasa_tlx": [],
        "biometrics": data.get("biometric_metrics", {}) or {},
        "modules": data.get("modules", []) or [],
    }


def fetch_records(user: str, password: str, limit=None):
    records = []
    conn = imaplib.IMAP4_SSL(IMAP_HOST)
    conn.login(user, password)
    conn.select("INBOX")
    typ, data = conn.search(None, '(SUBJECT "NCID")')
    if typ != "OK":
        conn.logout()
        return records
    ids = data[0].split()
    if limit:
        ids = ids[-limit:]
    for num in ids:
        typ, msg_data = conn.fetch(num, "(RFC822)")
        if typ != "OK" or not msg_data or not msg_data[0]:
            continue
        raw = msg_data[0][1]
        if not isinstance(raw, (bytes, bytearray)):
            continue
        msg = email.message_from_bytes(raw)
        subject = decode_header_value(msg.get("Subject", ""))
        body = message_html(msg)
        rec = record_from_embedded(body, subject) or record_from_html(body, subject)
        if rec.get("id"):
            records.append(rec)
    conn.logout()
    return records


def matches(rec: dict, query: str) -> bool:
    q = query.lower()
    haystack = " ".join(str(rec.get(k, "")) for k in ("name", "id", "profession", "expertise", "subject", "date"))
    return q in haystack.lower()


def write_csv(records, path):
    cols = ["date", "id", "name", "profession", "expertise", "age", "method", "device",
            "calibration_px", "duration_min", "accuracy", "kind", "source"]
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in records:
            w.writerow(r)


def build_html(records, path):
    payload = json.dumps(records, ensure_ascii=False)
    page = """<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NCID - participants</title>
<style>
 :root{--bg:#092634;--panel:#0f3a50;--text:#F9F9F9;--muted:#9fb8c6;--accent:#FF6E42;--line:#1d5570}
 *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:"Segoe UI",system-ui,Arial,sans-serif}
 header{padding:22px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:2}
 h1{font-size:20px;margin:0 0 12px}
 input{width:100%;max-width:420px;padding:11px 14px;border-radius:10px;border:1px solid var(--line);background:#0d3247;color:var(--text);font-size:15px}
 .count{color:var(--muted);font-size:13px;margin-top:8px}
 main{padding:20px 24px;display:grid;gap:14px}
 .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px}
 .card h2{margin:0 0 4px;font-size:16px}
 .meta{color:var(--muted);font-size:13px;margin-bottom:10px}
 table{border-collapse:collapse;width:100%;font-size:13px;margin-top:8px}
 th,td{border:1px solid var(--line);padding:6px 8px;text-align:left}
 th{background:#0d3247;color:var(--muted)}
 .pill{display:inline-block;background:#0d3247;border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:12px;margin:2px 6px 2px 0}
 .acc{color:var(--accent);font-weight:700}
 .hide{display:none}
</style></head><body>
<header>
 <h1>NCID - participants (email mode)</h1>
 <input id="q" placeholder="Search by name, ID, profession...">
 <div class="count" id="count"></div>
</header>
<main id="list"></main>
<script>
const DATA = __DATA__;
const list = document.getElementById('list');
const q = document.getElementById('q');
const count = document.getElementById('count');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function answersTable(mods){
  const rows=[];
  (mods||[]).forEach(m=>(m.trials||[]).forEach(tr=>{
    const qs=tr.quiz_item||[];
    (tr.response||[]).forEach((r,i)=>{const qq=qs[i]||{};
      rows.push('<tr><td>'+esc(m.module_id)+'</td><td>'+esc(tr.versioni)+'</td><td>'+esc(qq.pyetja)+'</td><td>'+esc(r.zgjedhja)+'</td><td>'+((r['e_saktë'])?'yes':'no')+'</td></tr>');
    });
  }));
  return rows.length?('<table><tr><th>Level</th><th>Version</th><th>Question</th><th>Chosen</th><th>Correct</th></tr>'+rows.join('')+'</table>'):'';
}
function answersFlat(a){ if(!a||!a.length) return ''; return '<table><tr><th>Level</th><th>Version</th><th>Question</th><th>Chosen</th><th>Correct</th></tr>'+
  a.map(r=>'<tr><td>'+esc(r.level)+'</td><td>'+esc(r.version)+'</td><td>'+esc(r.question)+'</td><td>'+esc(r.chosen)+'</td><td>'+esc(r.correct)+'</td></tr>').join('')+'</table>'; }
function render(recs){
  count.textContent = recs.length + ' / ' + DATA.length + ' shown';
  list.innerHTML = recs.map(r=>{
    const ans = r.answers&&r.answers.length ? answersFlat(r.answers) : answersTable(r.modules);
    return '<div class="card"><h2>'+esc(r.name||'(no name)')+'</h2>'+
      '<div class="meta">'+esc(r.id)+' | '+esc(r.profession)+' | '+esc(r.expertise)+' | age '+esc(r.age)+' | '+esc(r.date)+'</div>'+
      '<span class="pill">'+esc(r.method||'-')+'</span><span class="pill">'+esc(r.device||'-')+'</span>'+
      '<span class="pill">calib '+esc(r.calibration_px||'-')+' px</span><span class="pill">'+esc(r.duration_min||'-')+' min</span>'+
      '<span class="pill">accuracy <span class="acc">'+esc(r.accuracy)+'%</span></span>'+
      (ans?('<div style="margin-top:10px">'+ans+'</div>'):'')+
    '</div>';
  }).join('');
  if(!recs.length) list.innerHTML='<div class="card">No matching participants.</div>';
}
function apply(){const s=q.value.trim().toLowerCase();
  if(!s){render(DATA);return;}
  render(DATA.filter(r=>[r.name,r.id,r.profession,r.expertise,r.date,r.subject].join(' ').toLowerCase().includes(s)));
}
q.addEventListener('input',apply);render(DATA);
</script></body></html>"""
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(page.replace("__DATA__", payload))


def main():
    ap = argparse.ArgumentParser(description="NCID admin (email mode)")
    ap.add_argument("--user", default=os.environ.get("NCID_EMAIL", "arditceno82@gmail.com"))
    ap.add_argument("--password", default=os.environ.get("NCID_APP_PASSWORD", ""))
    ap.add_argument("--out", default=os.path.join("analysis", "out"))
    ap.add_argument("--find", default="")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    if not args.password:
        print("Set NCID_APP_PASSWORD (Gmail app password) or pass --password.", file=sys.stderr)
        return 2

    records = fetch_records(args.user, args.password, args.limit or None)
    records.sort(key=lambda r: r.get("date", ""), reverse=True)
    os.makedirs(args.out, exist_ok=True)

    if args.find:
        hits = [r for r in records if matches(r, args.find)]
        print(f"{len(hits)} match(es) for '{args.find}':")
        for r in hits:
            print(f"  - {r.get('name') or '(no name)'} | {r.get('id')} | {r.get('profession')} | accuracy {r.get('accuracy')}%")
        if not hits:
            return 1

    write_csv(records, os.path.join(args.out, "sessions.csv"))
    with open(os.path.join(args.out, "sessions.json"), "w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, indent=2)
    build_html(records, os.path.join(args.out, "admin.html"))

    print(f"{len(records)} submission(s).")
    print(f"Report: {os.path.join(args.out, 'admin.html')}")
    print(f"CSV:    {os.path.join(args.out, 'sessions.csv')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
