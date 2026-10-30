"""Unit tests for analysis/metrics.py (stdlib unittest, no fixtures on disk)."""
import json
import os
import tempfile
import unittest

from metrics import aoi_rows, iter_sessions


class TestAoiRows(unittest.TestCase):
    def test_flattens_modules_trials_and_dwell(self):
        session = {
            "participant": {"id_anonim": "USR_1"},
            "modules": [
                {
                    "fusha": "software",
                    "trials": [
                        {
                            "versioni": "A",
                            "aoi_dwell": [
                                {"name": "title", "duration_ms": 120},
                                {"name": "body", "duration_ms": 300},
                            ],
                        }
                    ],
                }
            ],
        }
        rows = aoi_rows(session)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["id_anonim"], "USR_1")
        self.assertEqual(rows[0]["fusha"], "software")
        self.assertEqual(rows[0]["versioni"], "A")
        self.assertEqual(rows[0]["aoi"], "title")
        self.assertEqual(rows[1]["duration_ms"], 300)

    def test_missing_fields_are_safe(self):
        self.assertEqual(aoi_rows({}), [])
        self.assertEqual(aoi_rows({"modules": [{}]}), [])


class TestIterSessions(unittest.TestCase):
    def test_reads_sessions_in_sorted_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            for name, sid in (("session_2.json", "B"), ("session_1.json", "A")):
                with open(os.path.join(tmp, name), "w", encoding="utf-8") as fh:
                    json.dump({"participant": {"id_anonim": sid}}, fh)
            found = [s["participant"]["id_anonim"] for s in iter_sessions(tmp)]
            self.assertEqual(found, ["A", "B"])


if __name__ == "__main__":
    unittest.main()
