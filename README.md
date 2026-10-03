# Kepler-452b (keplerv)

AI auction co-pilot concept for salvage-vehicle marketplaces (Copart / ACV) — built for the AI for Good competition.

## What's here

- **Live Auctions dashboard** — a demo UI for an AI agent that inspects, scores, and bids on salvage vehicles within dealer-set guardrails.
- **Real vehicle data** — a small batch of real Copart lots (specs + photos), pulled via a one-off script (`npm run fetch:copart`), not a live/continuous scraper.
- **3D photo viewer** — each vehicle's real auction photos are converted to depth-displaced 3D surfaces (via local, free monocular depth estimation — no paid API) so you can drag to tilt and see genuine parallax, then switch between the real angles.
- **AI recommendation panel, live bid activity, guardrails** — presentation-layer simulation. There is no live auction feed or trained pricing model yet; values are deterministic, explainable heuristics derived from each vehicle's real specs (year, odometer, damage), clearly for demo purposes.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · three.js / React Three Fiber · Transformers.js (local depth estimation, dev-only)

## Running locally

```bash
npm install
npm run dev
```

## Refreshing the demo data (optional)

Requires no API keys — everything runs locally.

```bash
npm run fetch:copart -- 10   # pull a fresh random batch of 10 real Copart lots + photos
npm run gen:depth            # generate depth maps for the 3D viewer
```

## AI 3D reconstruction (experimental, Colab-powered)

The auction detail page has an **"AI 3D (Beta)"** tab that turns one vehicle photo into a
real 3D mesh using [Shap-E](https://github.com/openai/shap-e), an actual diffusion model — not
a trick. It needs a GPU, which this app doesn't have access to on its own, so it calls out to
a notebook you run in [Google Colab](https://colab.research.google.com) (free tier GPU):

1. Open [`colab/keplerv_diffusion_3d.ipynb`](colab/keplerv_diffusion_3d.ipynb) in Colab
   (Colab → File → Upload notebook, or open it from this GitHub repo directly).
2. `Runtime` → `Change runtime type` → **T4 GPU**.
3. Get a free ngrok authtoken at https://dashboard.ngrok.com/get-started/your-authtoken.
4. `Runtime` → `Run all`. First run downloads model weights (a few GB, several minutes).
5. Copy the public URL the last cell prints, paste it into the "AI 3D (Beta)" tab on the
   website when prompted.

This only works while that Colab notebook stays open and running — free GPU sessions
disconnect after a period of idle time or ~12h max. It's a demo feature, not part of the
deployed site's always-on functionality. The ngrok URL is stored only in your browser
(`localStorage`), never deployed or committed.

## Deploying

Standard Next.js app, fully static-generated (`next build`) — deploys on [Vercel](https://vercel.com) with zero configuration. Import this repo in the Vercel dashboard, or:

```bash
npx vercel
```
