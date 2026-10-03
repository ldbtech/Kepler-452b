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

## AI 3D reconstruction (Colab-powered)

The auction's **AI 3D (Beta)** tab uses [Tencent Hunyuan3D-2mv](https://huggingface.co/tencent/Hunyuan3D-2mv) from Hugging Face. It sends up to four separate exterior rotation photos to the Colab API. The notebook removes each background, then passes a dictionary of images to the multi-view geometry model. There is no contact sheet and no Shap-E fallback.

1. Open [the notebook in Colab](https://colab.research.google.com/github/ldbtech/Kepler-452b/blob/main/colab/keplerv_diffusion_3d.ipynb).
2. Select **T4 GPU** and **Run all**. Installation and first model download take several minutes.
3. Enter your [ngrok authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) when prompted.
4. Paste the printed **Public API URL** into the website's AI 3D tab.

**Upgrading an existing session:** stop the old server cell, reopen the updated notebook, and rerun setup/model/reconstruction/server cells. Reuse the existing ngrok token or enter it again. The website checks `/health` and refuses to use the old Shap-E service.

The four camera slots represent the reference image and views approximately 90°, 180°, and 270° clockwise around the same vehicle. Auction corner images provide approximate angles; unrelated close-ups/interior photos are excluded. Foreground cutouts are saved to `/content/keplerv-inputs` for inspection. Input masks and camera consistency affect quality. This configuration generates normalized, **untextured** GLB geometry on a T4, with orbit, zoom, regeneration, and download in the website. It infers hidden details and cannot guarantee exact proportions, damage, or measurements.

Keep the Colab runtime running; a GitHub/Vercel deployment does not host the GPU model. The ngrok URL is stored in the user's browser. Review Tencent's model license for your intended use before a production commercial rollout.

## Deploying

Standard Next.js app, fully static-generated (`next build`) — deploys on [Vercel](https://vercel.com) with zero configuration. Import this repo in the Vercel dashboard, or:

```bash
npx vercel
```
