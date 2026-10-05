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

The auction's **AI 3D (Beta)** tab uses [Tencent Hunyuan3D-2mv](https://huggingface.co/tencent/Hunyuan3D-2mv) from Hugging Face. It sends up to four separate exterior rotation photos to the Colab API. The RAM-efficient loader streams checkpoint tensors directly to the GPU rather than duplicating full float32 models in CPU memory. The notebook removes each background, then passes a dictionary of images to the multi-view geometry model. There is no contact sheet and no Shap-E fallback.

1. Open [the notebook in Colab](https://colab.research.google.com/github/ldbtech/Kepler-452b/blob/main/colab/keplerv_diffusion_3d.ipynb).
2. Select **T4 GPU** and **Run all**. Installation and first model download take several minutes.
3. Enter your [ngrok authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) when prompted.
4. The website automatically uses **https://aloha-anytime-zodiac.ngrok-free.dev**. The notebook requests that same stable domain when it starts; no URL entry is needed.

**Upgrading an existing session:** stop the old server cell, reopen the updated notebook, and rerun setup/model/reconstruction/server cells. Reuse the existing ngrok token or enter it again. The website checks `/health` and refuses to use the old Shap-E service.

The four camera slots represent the reference image and views approximately 90°, 180°, and 270° clockwise around the same vehicle. Auction corner images provide approximate angles; unrelated close-ups/interior photos are excluded. Foreground cutouts are saved to `/content/keplerv-inputs` for inspection. Input masks and camera consistency affect quality. This configuration generates normalized, **untextured** GLB geometry on a T4, with orbit, zoom, regeneration, and download in the website. It infers hidden details and cannot guarantee exact proportions, damage, or measurements.

Keep the Colab runtime running; a GitHub/Vercel deployment does not host the GPU model. The stable ngrok domain is the app default, with an optional browser override. The server stays active for the lifetime of the Colab session. Colab can terminate the runtime; guaranteed continuous availability requires an always-on GPU host. Review Tencent's model license for your intended use before a production commercial rollout.

## Deploying

Standard Next.js app, fully static-generated (`next build`) — deploys on [Vercel](https://vercel.com) with zero configuration. Import this repo in the Vercel dashboard, or:

```bash
npx vercel
```

### Calibrated photo reconstruction

Open [the photogrammetry Colab notebook](https://colab.research.google.com/github/ldbtech/Kepler-452b/blob/main/colab/keplerv_photogrammetry.ipynb) on a T4 GPU and run all. This is a separate service from the diffusion notebook; stop its ngrok tunnel before starting the new one.

The notebook builds CUDA COLMAP 3.11.1 from its official source (the distribution package lacks CUDA dense stereo). First setup may take 10–20 minutes. Upload 3–60 exterior photos, at most 40 MB total. Capture 30–60 overlapping views of a stationary vehicle for the first experiment. Four separated auction views may fail registration. Intrinsics and poses are estimated from feature matches; dimensions have arbitrary scale. Reflective paint and glass can produce holes or incorrect surfaces.

Before ngrok starts, the notebook displays foreground cutouts, runs SIFT matching, camera estimation, dense stereo, fusion and meshing, and shows an interactive local mesh preview. A failed test blocks API startup. The test workspace contains `colmap.log`, registered camera files, cutouts, and mesh statistics. Inspect the preview before accepting it; a successful mesh does not guarantee geometric accuracy.

In the website's AI 3D panel choose **Photo reconstruction**, optionally upload a larger set, then generate. Jobs run in the background and report stages to the website. Results open directly in the orbit/pan/zoom viewer with a wireframe toggle. No Blender or export workflow is required. **AI generation** remains available with the original Hunyuan service.

The photogrammetry backend lives in `colab/photogrammetry_service.py`; its source is embedded in the notebook so Run all does not depend on fetching a mutable service script. After edits, regenerate the service code cell from that file. Local syntax, TypeScript, and lint checks do not confirm a successful CUDA build or vehicle reconstruction; those require the Colab image test with real photos.
