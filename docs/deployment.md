# Deployment

Rubin Night Watch is a static Vite app. The production artifact is `frontend/dist/`.

## Local Production Build

```bash
cd frontend
npm ci
npm run build
npm run preview
```

The app expects static assets under:

- `/data/demo_alerts.json.gz`
- `/data/demo_objects/object_XXXXXX.json`
- `/cutouts/object_XXXXXX_ref.webp`
- `/cutouts/object_XXXXXX_new.webp`
- `/cutouts/object_XXXXXX_diff.webp`

Those files are committed under `frontend/public/` so Vite copies them into `dist/`.

## Vercel

This repository includes `vercel.json`.

Recommended Vercel settings:

- Framework preset: Vite
- Build command: `cd frontend && npm ci && npm run build`
- Output directory: `frontend/dist`

After connecting the GitHub repository, Vercel can deploy `main` automatically.

## Netlify

This repository includes `netlify.toml`.

Netlify settings:

- Base directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

## Deployment Checklist

- Run `npm run build`.
- Confirm `/data/demo_alerts.json.gz` loads in production.
- Select at least one object with cutouts and confirm blink images render.
- Refresh the app route and confirm the single-page app fallback works.
- Confirm the methods/caveats panel is visible from the header.
- Confirm no UI text claims live Rubin data or confirmed discoveries.

## Current Status

The project is deployment-ready from the repository side. Creating the public URL requires access to a Vercel or Netlify account connected to the GitHub repository.
