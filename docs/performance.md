# Performance Notes

Milestone 17 keeps the MVP responsive with the generated 20,000-alert dataset.

## Current Measures

- The sky map uses canvas, not SVG, for alert rendering.
- Filtering is centralized and memoized in React with `useMemo`.
- Detailed object JSON is loaded only when an object is selected.
- Detailed object fetches are cached in `frontend/src/data/loadData.ts`.
- Cutout images are browser-lazy-loaded with async decoding hints.
- The Recharts light-curve component is code-split with `React.lazy`, so the main dashboard bundle does not carry the chart library until a selected object needs it.
- The canonical alert payload is gzip-compressed as `frontend/public/data/demo_alerts.json.gz`.

## Payload Snapshot

The committed demo payload is intentionally small enough for static hosting:

- `frontend/public/data/demo_alerts.json.gz`: about 0.7 MB.
- `frontend/public/data/demo_objects/`: about 0.7 MB total for 200 objects.
- `frontend/public/cutouts/`: about 0.23 MB for 50 cutout triplets.

The production build is expected to create a separate chart chunk because `LightCurve` is lazy-loaded.

## Remaining Performance Work

Milestone 17 is enough for the MVP, but later larger datasets may need:

- spatial indexing for hover hit-testing;
- point decimation or density tiles for 50,000+ alerts;
- worker-based filtering if filter latency becomes visible;
- explicit CDN caching headers on deployed static data.
