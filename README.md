# Rubin Night Watch

Rubin Night Watch is a synthetic-data demonstration of a cosmic weather map for Rubin-like alert streams. Version 0.1 is not a live Rubin Observatory product and does not show confirmed astronomical discoveries; it uses generated alert-like data, synthetic cutouts, and heuristic scores to prototype how sky activity, anomalies, object triage, blink images, and light curves could be explored in a static web app.

## Milestone Status

Milestone 0, project definition, is complete. The frozen v0.1 scope lives in `docs/mvp_scope.md`.

Milestone 1, repository skeleton, is complete. The branch workflow lives in `docs/branching.md`.

Milestone 2, synthetic data schema, is complete. The schema contract lives in `docs/data_schema.md`.

Milestone 3, synthetic alert generator, is complete. The generator lives in `scripts/generate_demo_data.py`.

Current focus: Milestone 4, data validator.

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
