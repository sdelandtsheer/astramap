# Rubin Night Watch

Rubin Night Watch is a synthetic-data demonstration of a cosmic weather map for Rubin-like alert streams. Version 0.1 is not a live Rubin Observatory product and does not show confirmed astronomical discoveries; it uses generated alert-like data, synthetic cutouts, and heuristic scores to prototype how sky activity, anomalies, object triage, blink images, and light curves could be explored in a static web app.

## Milestone Status

Milestone 0, project definition, is complete. The frozen v0.1 scope lives in `docs/mvp_scope.md`.

Milestone 1, repository skeleton, is complete. The branch workflow lives in `docs/branching.md`.

Milestone 2, synthetic data schema, is complete. The schema contract lives in `docs/data_schema.md`.

Milestone 3, synthetic alert generator, is complete. The generator lives in `scripts/generate_demo_data.py`.

Milestone 4, data validator, is complete. The validator lives in `scripts/validate_demo_data.py`.

Milestone 5, synthetic cutout generator, is complete. The cutout generator lives in `scripts/generate_demo_cutouts.py`.

Milestone 6, frontend scaffold, is complete. The static shell lives under `frontend/src/`.

Milestone 7, data loading layer, is complete. Static data loading lives in `frontend/src/data/loadData.ts`.

Milestone 8, basic sky map, is complete. The map renders alert points in `frontend/src/components/SkyMap.tsx`.

Milestone 9, object panel, is complete. Selected-object rendering lives in `frontend/src/components/ObjectPanel.tsx`.

Milestone 10, light curve component, is complete. The chart lives in `frontend/src/components/LightCurve.tsx`.

Milestone 11, blink card, is complete. The blink viewer lives in `frontend/src/components/BlinkCard.tsx`.

Milestone 12, layer controls, is complete. Filtering is centralized in `frontend/src/utils/scoring.ts`.

Milestone 13, time slider, is complete. MJD filtering is wired through `frontend/src/components/TimeSlider.tsx`.

Milestone 14, object ranking list, is complete. The filtered top-object list lives in `frontend/src/components/ObjectRanking.tsx`.

Milestone 15, visual polish pass, is complete.

Current focus: Milestone 16, public caveats and methods.

Planned v0.1 MVP:

- Synthetic alert dataset
- Sky map
- Anomaly score layer
- Priority score layer
- Class filters
- Time slider
- Selected object panel
- Blink card
- Light curve
- Top-object ranking list

Explicitly excluded from v0.1:

- Live Rubin data
- Live broker ingestion
- Backend API
- Database
- User accounts
- Comments or annotations
- Perfect astronomical projection
- Telescope follow-up coordination
- Claims of confirmed discoveries

## Project Layout

```text
.
|-- docs/
|   |-- mvp_scope.md
|   |-- data_schema.md
|   |-- methods.md
|   `-- real_data_plan.md
|-- scripts/
|   |-- generate_demo_data.py
|   |-- generate_demo_cutouts.py
|   `-- validate_demo_data.py
|-- data/
|   `-- demo_objects/
|-- frontend/
|   |-- public/
|   |   `-- cutouts/
|   `-- src/
|       |-- data/
|       |-- components/
|       `-- utils/
`-- requirements.txt
```

## Development Notes

Python scripts will generate static demo data under `data/` and frontend-ready image assets under `frontend/public/cutouts/`.

The React frontend will consume static files only. No backend or database is planned for v0.1.

Generate the initial synthetic dataset with:

```bash
python scripts/generate_demo_data.py --n-alerts 20000 --n-objects 200 --seed 42
```

Validate the generated dataset with:

```bash
python scripts/validate_demo_data.py
```

Generate synthetic blink-card cutouts with:

```bash
python scripts/generate_demo_cutouts.py --n-featured 50 --seed 42
```
