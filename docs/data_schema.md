# Rubin Night Watch Data Schema

This document is the contract between the Python data-generation scripts and the React frontend for v0.1. The frontend should be able to consume any dataset that follows this schema without knowing whether the source is synthetic, broker-like, or eventually real survey-derived data.

Version 0.1 uses static files only. There is no backend API and no database.

## File Layout

```text
data/
|-- demo_alerts.json.gz
`-- demo_objects/
    |-- object_000001.json
    |-- object_000002.json
    `-- ...

frontend/public/
`-- cutouts/
    |-- object_000001_ref.webp
    |-- object_000001_new.webp
    `-- object_000001_diff.webp
```

`data/demo_alerts.json.gz` is a gzip-compressed UTF-8 JSON array of alert points. During early frontend development, an uncompressed `data/demo_alerts.json` may also be generated, but the compressed file is the canonical dataset.

Each file in `data/demo_objects/` is a UTF-8 JSON object containing detailed metadata for one featured object.

Cutout paths are written as browser-public paths rooted at `frontend/public`, for example `/cutouts/object_000001_ref.webp`.

## Supported Classes

All class labels must be one of:

- `variable_star`
- `asteroid`
- `supernova_candidate`
- `agn`
- `artifact`
- `unknown_anomaly`

The UI must present these as candidate or likely labels, never as confirmed classifications.

## Alert Point Schema

Each item in `data/demo_alerts.json.gz` represents one synthetic alert-like detection.

```json
{
  "object_id": "object_000001",
  "ra": 123.4,
  "dec": -32.1,
  "mjd": 60400.123,
  "class_label": "supernova_candidate",
  "class_prob": 0.74,
  "anomaly_score": 0.86,
  "priority_score": 0.79,
  "mag": 21.3,
  "delta_mag": -1.2
}
```

### Required Fields

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `object_id` | string | Pattern `object_XXXXXX` | Stable object identifier shared with detailed object files. |
| `ra` | number | `0 <= ra < 360` | Right ascension in decimal degrees. |
| `dec` | number | `-90 <= dec <= 90` | Declination in decimal degrees. |
| `mjd` | number | finite number | Modified Julian date for the alert detection. |
| `class_label` | string | supported class | Best synthetic class label for the detection. |
| `class_prob` | number | `0 <= class_prob <= 1` | Probability associated with `class_label`. |
| `anomaly_score` | number | `0 <= anomaly_score <= 1` | Heuristic anomaly score in the demo feature space. |
| `priority_score` | number | `0 <= priority_score <= 1` | Heuristic review priority score. |
| `mag` | number | finite number | Synthetic apparent magnitude. |
| `delta_mag` | number | finite number | Synthetic magnitude change relative to a local/reference baseline. |

### Alert Rules

- Alert records must not contain `NaN`, `Infinity`, or non-numeric placeholders.
- Multiple alert points may share the same `object_id`.
- Asteroid alert points may have small RA/Dec drift across time.
- `class_prob` should normally match the largest class probability for that object's detailed record, but exact equality is not required.
- Scores must be clamped to `[0, 1]`.

## Detailed Object Schema

Each file in `data/demo_objects/object_XXXXXX.json` contains object-level metadata loaded on demand when a user selects an object.

```json
{
  "object_id": "object_000001",
  "ra": 123.4,
  "dec": -32.1,
  "first_seen_mjd": 60400.123,
  "last_seen_mjd": 60405.312,
  "class_probabilities": {
    "variable_star": 0.07,
    "asteroid": 0.03,
    "supernova_candidate": 0.74,
    "agn": 0.12,
    "artifact": 0.04,
    "unknown_anomaly": 0.0
  },
  "anomaly_score": 0.86,
  "priority_score": 0.79,
  "short_explanation": "Fast brightening, weak class certainty, possible host-galaxy context.",
  "flags": [
    "fast_brightening",
    "low_classification_confidence",
    "possible_host_galaxy"
  ],
  "light_curve": [
    {"mjd": 60400.1, "mag": 22.1, "mag_err": 0.2},
    {"mjd": 60401.1, "mag": 21.7, "mag_err": 0.2}
  ],
  "cutouts": {
    "reference": "/cutouts/object_000001_ref.webp",
    "new": "/cutouts/object_000001_new.webp",
    "difference": "/cutouts/object_000001_diff.webp"
  }
}
```

### Required Fields

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `object_id` | string | Pattern `object_XXXXXX` | Must match the filename stem. |
| `ra` | number | `0 <= ra < 360` | Representative object right ascension. |
| `dec` | number | `-90 <= dec <= 90` | Representative object declination. |
| `first_seen_mjd` | number | finite number | First synthetic detection time. |
| `last_seen_mjd` | number | `>= first_seen_mjd` | Last synthetic detection time. |
| `class_probabilities` | object | all supported classes present | Values must be in `[0, 1]` and sum approximately to 1. |
| `anomaly_score` | number | `0 <= anomaly_score <= 1` | Object-level anomaly score. |
| `priority_score` | number | `0 <= priority_score <= 1` | Object-level review priority score. |
| `short_explanation` | string | non-empty | Cautious explanation suitable for display. |
| `flags` | string array | may be empty | Machine-readable feature/context flags. |
| `light_curve` | object array | at least one point | Synthetic photometric history. |

### Optional Fields

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `cutouts` | object | all three paths required when present | Only expected for featured objects with generated blink-card images. |

### Light Curve Point

Each light curve point must follow:

```json
{
  "mjd": 60400.1,
  "mag": 22.1,
  "mag_err": 0.2
}
```

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `mjd` | number | finite number | Observation time. |
| `mag` | number | finite number | Synthetic apparent magnitude. |
| `mag_err` | number | `mag_err >= 0` | Synthetic measurement uncertainty. |

Light curve points should be sorted by increasing `mjd`.

### Cutout Paths

When `cutouts` is present, it must contain:

```json
{
  "reference": "/cutouts/object_000001_ref.webp",
  "new": "/cutouts/object_000001_new.webp",
  "difference": "/cutouts/object_000001_diff.webp"
}
```

All three files must exist under `frontend/public/cutouts/`. The frontend should still handle missing cutouts gracefully, but the validator should fail if declared paths do not exist.

## Class Probability Rules

- `class_probabilities` must include every supported class key.
- Values must be numeric and in `[0, 1]`.
- The sum must be approximately 1, with validator tolerance `0.001`.
- The likely class displayed in the UI should be the key with the highest probability.
- Low-confidence objects should have a flatter distribution and may carry the `low_classification_confidence` flag.

## Score Semantics

Scores are heuristic demo values, not scientific classifications.

`anomaly_score` means "anomalous in this synthetic demo feature space." It should combine unusual light-curve behavior, fast change, classification uncertainty, rare context, and isolation.

`priority_score` means "worth reviewing in this demo triage view." It should combine anomaly score, observability, scientific interest, and artifact penalties.

Both scores must stay in `[0, 1]`.

## Initial Dataset Targets

The initial MVP dataset should contain:

- 20,000 alert points.
- 200 detailed objects.
- 50 detailed objects with cutouts.
- At least one object from each supported class.

These are targets for Milestones 3 and 5. The schema supports smaller datasets for tests and local debugging.

## Validation Expectations

`scripts/validate_demo_data.py` must check:

- `data/demo_alerts.json.gz` exists and is valid gzip-compressed JSON.
- Every alert has all required fields.
- RA/Dec ranges are valid.
- Scores and probabilities are in `[0, 1]`.
- Class labels are supported.
- Object IDs are valid strings.
- Detailed object files exist for the expected featured/detail objects.
- Detailed objects have all required fields.
- Light curve values are numeric and sorted.
- Cutout files exist when declared.
- Class probabilities sum approximately to 1.

## Frontend Type Mapping

Milestone 7 should map this schema to TypeScript interfaces named:

- `AlertPoint`
- `DetailedObject`
- `LightCurvePoint`
- `ClassProbabilities`
- `CutoutPaths`

All static data loading must remain isolated in `frontend/src/data/loadData.ts`.
