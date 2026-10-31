# Codebook

Field names follow the exported session JSON (Albanian keys are intentional and
must not be renamed without a schema version bump).

## Participant

| Field | Type | Notes |
|---|---|---|
| `id_anonim` | string | Anonymous participant ID, generated at registration |
| `emri_mbiemer` | string | Optional name; email report only, never in analysis payload |
| `profesioni` | string | Localized profession name |
| `fusha` | string | Profession id (e.g. `software`) |
| `niveli_i_ekspertizës` | string | Localized expertise level |
| `mosha` | integer | Age in years (18+) |

## Session

| Field | Type | Notes |
|---|---|---|
| `session_number` | integer | Local counter, used for A/B counterbalancing |
| `gjuha` | `en` \| `sq` | Interface language |
| `metoda` | string | `eyetracking` or `mock` |
| `fusha` / `fusha_emri` | string | Profession id / label |
| `ekspertiza` | string | `fillestar` \| `mesatar` \| `avancuar` |
| `kalibrimi_px` | number | Calibration error in pixels |
| `kohëzgjatja_min` | number | Session duration in minutes |
| `shfletuesi` | string | Browser name |
| `pajisja` | string | Device class |

## Module

| Field | Type | Notes |
|---|---|---|
| `fusha` | string | Profession id |
| `ekspertiza` | string | Expertise id |
| `module_id` | string | `m1` \| `m2` \| `m3` |
| `complexity` | string | Module complexity label |
| `preference` | `A` \| `B` \| `equal` | Post-module preference |
| `rendi_në_seson` | integer | 1-based module order |
| `versioni_i_parë` | `A` \| `B` | First format read |
| `trials` | array | Two trials (A and B) |
| `nasa_tlx` | object | Six subscales (0–100) and derived mean |

## Trial

| Field | Type | Notes |
|---|---|---|
| `versioni` / `format` | `A` \| `B` | Presentation format |
| `module_id` | string | Module id |
| `complexity` | string | Complexity label |
| `stimulus` | object | `fusha`, `versioni`, `module_id`, `complexity`, `gjatësia` (words), `lexueshmëria` (Flesch) |
| `koha_e_leximit_s` | number | Reading time, seconds |
| `koha_detyrës_s` | number | Reading + quiz time, seconds |
| `TTFF_ms` | number | Time to first fixation, ms |
| `regresione` | integer | Saccadic regressions |
| `fixation_duration_ms` | number | Median fixation duration |
| `fixation_count` | integer | Fixations detected |
| `aoi_dwell` | array | `{name, duration_ms}` per AOI |
| `accuracy_score_pct` | number | Quiz accuracy for this trial |
| `response` | array | Per-item responses (below) |
| `quiz_item` | array | Question text, correct answer, critical flag |

## Response

| Field | Type | Notes |
|---|---|---|
| `zgjedhja` | integer | Chosen option index |
| `e_saktë` | boolean | Correctness |
| `koha_s` | number | Seconds allocated per item |

## Biometrics and gaze

| Field | Type | Notes |
|---|---|---|
| `biometric_metrics.blink_rate_per_min` | number | Exploratory |
| `biometric_metrics.head_pose` | object | Exploratory (yaw/pitch/roll) |
| `biometric_metrics.reading_time_s` | number | Mean reading time |
| `gaze[].t_ms` | number | Timestamp, ms |
| `gaze[].x`, `gaze[].y` | number | Viewport coordinates |
| `gaze[].dx`, `gaze[].dy` | number | Document-content coordinates |
| `gaze[].blink` | 0 \| 1 | Aligned blink sample |
| `gaze[].head_pose` | object \| null | Aligned head pose |

## Envelope

| Field | Type | Notes |
|---|---|---|
| `kind` | string | Always `session` |
| `submission_id` | string | Stable id; one report per id |
| `exported_at` | ISO timestamp | When the report was assembled |

## SQL storage (D1)

The JSON export remains the canonical report format. D1 stores both the full
report (`sessions.payload_json`) and normalized tables for analysis.

| JSON | SQL |
|---|---|
| `participant.id_anonim` | `participants.id_anonim` / `sessions.id_anonim` |
| `participant.mosha` | `participants.age` |
| `participant.profesioni` | `participants.profession` |
| `participant.niveli_i_ekspertizës` | `participants.expertise` |
| `identity.emri_mbiemer` | `identity.full_name` (private) |
| `session.*` | `sessions.*` |
| `modules[]` | `modules`, `trials`, `responses`, `module_tlx` |
| `gaze[]` | R2 object; `gaze_objects` metadata |
| `quiz_results.accuracy_score_pct` | `sessions.accuracy_pct` |

Column names are ASCII (`profession`, `expertise`) to avoid Unicode identifiers
in SQL; the JSON keys keep the original Albanian names.
