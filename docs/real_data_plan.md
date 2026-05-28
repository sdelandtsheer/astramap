# Real Data Bridge Plan

Milestone 20 introduces the first adapter path for broker-like or survey-like alert exports. The goal is to keep the frontend schema stable while allowing external data to be transformed before visualization.

## Principle

External data should be mapped into the Rubin Night Watch internal schema. The frontend should not care whether the source is synthetic, ZTF-like, broker-derived, or Rubin-like.

The frontend still consumes:

- `demo_alerts.json.gz`
- `demo_objects/object_XXXXXX.json`
- optional `/cutouts/...` paths

## Adapter Script

`scripts/import_broker_like_data.py` accepts a local CSV or JSON file and writes internal-schema output to a chosen directory.

```bash
python scripts/import_broker_like_data.py input.csv --output-dir data/imported_broker_like --source-name example_broker
```

Supported input aliases include common broker-like names:

- object ID: `object_id`, `objectId`, `oid`, `diaObjectId`, `source_id`
- coordinates: `ra`, `ra_deg`, `raMean`, `dec`, `dec_deg`, `decMean`
- time: `mjd`, `midpointMjdTai`, or `jd`
- class: `class_label`, `class`, `classification`, `broker_class`
- probability: `class_prob`, `prob`, `probability`
- scores: `anomaly_score`, `priority_score`, `rb`, `drb`
- photometry: `mag`, `magpsf`, `psfMag`, `delta_mag`

Unknown or missing classes are mapped to `unknown_anomaly`.

## Provenance

The adapter distinguishes imported data through detailed-object flags:

- `broker_like_import`
- `source_<source-name>`

The first adapter does not add new required frontend fields, so the TypeScript data model remains unchanged.

## Current Limitations

- It imports local files only; it does not call a live broker API.
- It uses conservative fallback scores when source scores are missing.
- It does not generate real cutouts.
- It does not claim imported objects are confirmed discoveries.

## Future Scientific Beta Work

- Add source-specific adapters for concrete brokers or public survey products.
- Preserve richer provenance metadata.
- Support real cutout URLs or downloaded cutout assets.
- Add calibrated scoring and uncertainty handling.
- Validate imported classes against known object catalogs where appropriate.
