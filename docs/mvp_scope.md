# Rubin Night Watch MVP Scope

Milestone 0 freezes the scope for Rubin Night Watch v0.1. Later milestones can refine implementation details, but they should not expand the product surface unless the milestone plan is intentionally revised.

## Project Description

Rubin Night Watch is a web-based cosmic weather map inspired by the Vera C. Rubin Observatory and LSST-style alert ecosystem. The v0.1 release is a polished synthetic-data demonstration: Python scripts generate realistic alert-like records, object detail files, and demo cutout images, while a React frontend visualizes sky activity, anomalous changes, candidate objects, blink images, light curves, and priority ranking. It is not a live Rubin product, does not ingest real broker data, and must not imply confirmed astronomical discoveries.

## MVP Features

- Synthetic alert dataset generated locally.
- Static sky map using a simple RA/Dec projection.
- Anomaly score layer.
- Priority score layer.
- Class filters for synthetic object classes.
- Time slider for a simulated observing window.
- Selected object panel with candidate metadata.
- Blink card with reference, new, and difference synthetic cutouts.
- Light curve for selected detailed objects.
- Top-object ranking list by priority or anomaly.
- Static-data frontend deployable on Vercel or Netlify.

## Explicitly Excluded From v0.1

- Live Rubin data.
- Live broker ingestion.
- Backend API.
- Database.
- User accounts.
- Comments or collaborative annotations.
- Perfect astronomical projection.
- Telescope follow-up coordination.
- Claims of confirmed discoveries.
- Any wording that presents synthetic objects as real alerts.

## Data Schema Draft

The frontend will consume two static data shapes: alert points for the map and detailed object files loaded on demand. Milestone 2 will turn this draft into the strict schema contract.

### Alert Point

Each alert point in `data/demo_alerts.json.gz` represents one synthetic alert-like detection:

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

Required constraints:

- `object_id`: stable object identifier string.
- `ra`: degrees in `[0, 360)`.
- `dec`: degrees in `[-90, 90]`.
- `mjd`: numeric modified Julian date.
- `class_label`: one of the supported synthetic classes.
- `class_prob`: number in `[0, 1]`.
- `anomaly_score`: number in `[0, 1]`.
- `priority_score`: number in `[0, 1]`.
- `mag`: numeric magnitude.
- `delta_mag`: numeric brightness change indicator.

### Detailed Object

Each detailed object file in `data/demo_objects/object_XXXXXX.json` provides panel, light-curve, and cutout metadata:

```json
{
  "object_id": "object_000001",
  "ra": 123.4,
  "dec": -32.1,
  "first_seen_mjd": 60400.123,
  "last_seen_mjd": 60405.312,
  "class_probabilities": {
    "supernova_candidate": 0.74,
    "agn": 0.12,
    "variable_star": 0.07,
    "asteroid": 0.03,
    "artifact": 0.04
  },
  "anomaly_score": 0.86,
  "priority_score": 0.79,
  "short_explanation": "Fast brightening, weak class certainty, possible host-galaxy context.",
  "flags": ["fast_brightening", "low_classification_confidence"],
  "light_curve": [
    {"mjd": 60400.1, "mag": 22.1, "mag_err": 0.2}
  ],
  "cutouts": {
    "reference": "/cutouts/object_000001_ref.webp",
    "new": "/cutouts/object_000001_new.webp",
    "difference": "/cutouts/object_000001_diff.webp"
  }
}
```

`cutouts` may be omitted for non-featured detailed objects. The initial target is 20,000 alert points, 200 detailed objects, and 50 objects with cutouts.

Supported synthetic classes:

- `variable_star`
- `asteroid`
- `supernova_candidate`
- `agn`
- `artifact`
- `unknown_anomaly`

## Rough UI Layout

The first usable screen is a full-screen dark scientific dashboard, not a landing page.

```text
+--------------------------------------------------------------------------------+
| Rubin Night Watch                    A cosmic weather map of the changing sky    |
+----------------------+--------------------------------------+------------------+
| Layer controls        | Sky map                              | Selected object  |
| - class filters       | - RA/Dec projection                  | - likely class   |
| - color mode          | - alert/anomaly/priority coloring    | - scores         |
| - anomaly threshold   | - hover tooltip                      | - flags          |
| - priority threshold  | - click to select object             | - blink card     |
| - layer toggles       |                                      | - light curve    |
|                      |                                      | - probabilities  |
+----------------------+--------------------------------------+------------------+
| Time slider / simulated observing window                                         |
+--------------------------------------------------------------------------------+
| Top-priority object ranking, compact and clickable                               |
+--------------------------------------------------------------------------------+
```

Language in the UI must use cautious terms such as "candidate", "likely", "possible", "flagged for review", and "synthetic demo object". It must avoid certainty language and never describe a synthetic object as a confirmed discovery.

## Exit Criterion

Milestone 0 is complete when the project description, MVP feature list, exclusions, schema draft, and rough UI layout are written down clearly enough that repository skeleton and implementation work can proceed without redesigning v0.1 scope.
