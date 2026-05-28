# Wix Integration

Wix is the public website wrapper for Rubin Night Watch. It should not host the core visualization logic. The interactive app should be deployed separately on Vercel or Netlify and embedded into Wix.

## Intended Wix Structure

- Landing page: short project introduction and link to the app.
- App page: embedded iframe pointing to the deployed Vercel/Netlify app.
- Methods/about page: synthetic-data caveats and scoring/cutout explanation.
- Contact/link section: project links and future updates.

## Required Public Caveat

Use this wording near the app embed and methods/about content:

> Rubin Night Watch is currently a synthetic-data demonstration of how Rubin-like alert streams could be visualized as a cosmic weather map. It does not display live Rubin alerts or confirmed astronomical discoveries.

## Embed Snippet

Replace `https://YOUR_DEPLOYED_APP_URL` with the Vercel or Netlify URL from Milestone 18.

```html
<iframe
  title="Rubin Night Watch interactive demo"
  src="https://YOUR_DEPLOYED_APP_URL"
  style="width: 100%; height: min(86vh, 920px); border: 0; background: #080b12;"
  loading="lazy"
  allowfullscreen
></iframe>
```

## Wix Page Copy

### Landing

Rubin Night Watch is a synthetic-data prototype for exploring how Rubin-like alert streams could be visualized as a cosmic weather map of the changing sky.

### App

Explore synthetic alert density, anomaly scoring, object ranking, blink cards, and light curves. This embedded app is a static-data demo and does not show live Rubin alerts.

### Methods

The demo dataset is generated with local Python scripts. Object classes are illustrative, scores are transparent heuristics, and cutouts are generated synthetic images. No confirmed discoveries are shown.

## Integration Checklist

- Deploy the frontend to Vercel or Netlify.
- Replace the iframe URL with the production app URL.
- Confirm the embedded app loads `/data/demo_alerts.json.gz`.
- Confirm object JSON files load after selecting an object.
- Confirm cutout images render inside the object panel.
- Keep the methods/caveat copy visible from the Wix shell.

## Current Status

A Wix shell build has been started through the Wix connector. Final publication and iframe URL replacement require the deployed app URL from Vercel or Netlify.
