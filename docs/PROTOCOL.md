# Study protocol

**Version:** 1.1 · **Status:** working protocol; pre-registration pending.

## 1. Research question

How does document layout affect readability, comprehension and perceived
cognitive load for professionals reading material from their own field?

## 2. Design

Within-subjects, counterbalanced A/B comparison. Each participant selects one of
**12 professions** and one of **3 expertise levels** (beginner, intermediate,
advanced). They read **3 modules** at increasing complexity; each module is read
in both formats:

- **A — traditional:** dense, long clauses, minimal hierarchy.
- **B — optimised:** headings, spacing, visual hierarchy.

The facts are identical across A and B; only presentation changes. Order is
counterbalanced by session parity (`(session_number + module_index) % 2`).
Each format has its **own quiz** on the same content (8 items per document).

## 3. Hypotheses

- **H1** Dense formats produce longer fixations and more saccadic regressions.
- **H2** Optimised formats shorten time to first fixation and reduce errors.
- **H3** Comprehension accuracy is higher for structured formats.

## 4. Participants

- Age 18+.
- Works in, or is training for, one of the 12 professions.
- Self-reported expertise level.
- Target sample: to be fixed by **power analysis** before data collection.
- Exclusion (pre-specified): calibration error above threshold, gaze coverage
  below 60% of reading time, session shorter than the pilot minimum, or consent
  withdrawn.

## 5. Materials

- 108 modules (12 professions × 3 levels × 3 modules).
- 432 documents (108 modules × A/B × EN/AL).
- 648 quiz items (108 modules × A/B × 3+ items, 8 per document in the runner).
- One on-topic SVG diagram per module; five approved photos with credits.

## 6. Measures

**Primary**
- Comprehension accuracy (%) per trial.
- Reading time (s) and task time (s).
- NASA-TLX workload after each module.

**Secondary**
- Fixation duration (ms), fixation count.
- Saccadic regressions.
- Time to first fixation (TTFF, ms).
- AOI dwell time.
- Preference (A / B / no difference).

**Exploratory**
- Blink rate and head orientation (MediaPipe), not used for primary inference.

## 7. Procedure

1. Consent.
2. Registration (profession, expertise, age, optional name).
3. Camera permission and device check.
4. **Nine-point calibration, one pass** (threshold 150 px; manual recalibration available).
5. Three modules; each: read A → quiz A → read B → quiz B → preference → NASA-TLX.
6. Report emailed once to the researcher; participant sees their ID.

## 8. Data handling

Each session is stored once in a Cloudflare D1 (SQL) database, with raw gaze
stored as a compressed object in Cloudflare R2 and the report also emailed to the
researcher through Google Apps Script. No video is stored.

Gaze coordinates, blink samples and head orientation are linked to an anonymous
ID. The optional name is stored in a separate, access-restricted `identity` table
and in the email report; it is excluded from the analysis export. Older
email-only sessions are backfilled idempotently by `submission_id` (or
`id_anonim` for legacy reports).

Deletion requests use the participant ID and remove the session, its rows, the
R2 object and email copies within 30 days; the action is recorded in
`deletion_log`.

## 9. Ethics

Informed consent is required before any camera access. Participation is
voluntary; withdrawal is possible at any time before submission. GDPR basis:
explicit consent (Art. 6(1)(a)). Institutional ethics approval is **pending** and
must be recorded here before data collection for publication.

## 10. Deviations

Record every deviation from this protocol with date, reason and impact.
