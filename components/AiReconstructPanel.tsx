"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { DEFAULT_RECONSTRUCT_URL, getReconstructUrl, setReconstructUrl } from "@/lib/reconstructSettings";

const MeshViewer = dynamic(() => import("@/components/MeshViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-neutral-600">
      Loading viewer…
    </div>
  ),
});

type Status = "idle" | "loading" | "error" | "done";

export default function AiReconstructPanel({ imageUrls }: { imageUrls: string[] }) {
  const [mode, setMode] = useState<"photogrammetry" | "diffusion">("photogrammetry");
  const [photos, setPhotos] = useState<File[]>([]);
  const [stage, setStage] = useState("");
  const [alignment, setAlignment] = useState("");
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [url, setUrl] = useState(DEFAULT_RECONSTRUCT_URL);
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [meshUrl, setMeshUrl] = useState<string | null>(null);

  useEffect(() => {
    // localStorage isn't available during SSR, so this is deliberately
    // deferred past the first client render.
    const saved = getReconstructUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(saved);
    setUrlInput(saved);
  }, []);

  useEffect(() => {
    return () => { if (meshUrl) URL.revokeObjectURL(meshUrl); };
  }, [meshUrl]);

  function saveUrl() {
    try {
      const service = new URL(urlInput.trim());
      if (service.hostname === "colab.research.google.com") throw new Error("Use the ngrok Public API URL printed by Colab, rather than the notebook link.");
      if (service.protocol !== "https:" && service.hostname !== "localhost") throw new Error("Enter the HTTPS public API URL from Colab.");
      const saved = service.origin;
      setReconstructUrl(saved);
      setUrl(saved);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enter a valid service URL.");
    }
  }

  async function generate() {
    if (!url) return;
    setStage("");
    setAlignment("");
    setQualityWarnings([]);
    setStatus("loading");
    setError(null);
    try {
      const headers = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" };
      const health = await fetch(`${url}/health`, { headers, signal: AbortSignal.timeout(20000) });
      if (!health.ok) throw new Error("Colab service is unavailable. Check the running server cell.");
      const service = await health.json();
      let modelEndpoint = `${url}/reconstruct`;
      if (mode === "photogrammetry") {
        if (!service.modes?.includes("photogrammetry")) throw new Error("Run the new photogrammetry Colab notebook and its image test first.");
        const body = new FormData();
        photos.forEach((photo) => body.append("files", photo));
        body.append("image_urls", JSON.stringify(imageUrls));
        const started = await fetch(`${url}/photogrammetry`, { method: "POST", headers: { "ngrok-skip-browser-warning": "true" }, body, signal: AbortSignal.timeout(120000) });
        if (!started.ok) throw new Error(await started.text());
        const { job_id } = await started.json();
        const deadline = Date.now() + 60 * 60 * 1000;
        let completed = false;
        while (Date.now() < deadline) {
          const check = await fetch(`${url}/jobs/${job_id}`, { headers, signal: AbortSignal.timeout(20000) });
          if (!check.ok) throw new Error("Reconstruction job unavailable. The Colab session may have ended.");
          const job = await check.json();
          setStage(job.stage || "Processing photos");
          if (job.status === "error") throw new Error(job.error);
          if (job.status === "done") {
            setQualityWarnings(job.info.warnings || []);
            setAlignment(`${job.info.registered_images}/${job.info.input_images} photos aligned${job.info.warnings?.length ? ` · ${job.info.warnings.length} photo quality warnings` : ""}`);
            completed = true; break;
          }
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
        if (!completed) throw new Error("Reconstruction timed out. Inspect the Colab log before trying again.");
        modelEndpoint = `${url}/jobs/${job_id}/model`;
      } else if (service.model !== "tencent/Hunyuan3D-2mv" || service.api_version !== 2) {
        throw new Error("This Colab session still runs the old Shap-E model. Load the updated notebook and rerun its setup cells.");
      }
      const res = await fetch(modelEndpoint, {
        method: mode === "photogrammetry" ? "GET" : "POST",
        headers,
        body: mode === "diffusion" ? JSON.stringify({ image_urls: imageUrls, steps: 30 }) : undefined,
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Service returned ${res.status}${text ? `: ${text}` : ""}`);
      }
      if (!res.headers.get("content-type")?.includes("model/gltf-binary")) {
        throw new Error("The service did not return a GLB model. Check the Colab server output.");
      }
      const blob = await res.blob();
      setMeshUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't reach the reconstruction service. Is the Colab notebook running?",
      );
      setStatus("error");
    }
  }

  if (!url) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 overflow-y-auto p-4 text-center">
        <p className="max-w-xs text-sm text-neutral-400">
          Paste the public URL printed by the keplerv diffusion-3D Colab notebook to enable
          this.
        </p>
        {error && <p className="max-w-xs text-xs text-red-400">{error}</p>}
        <div className="flex w-full max-w-xs gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://xxxx.ngrok-free.app"
            className="flex-1 rounded-lg border border-white/[.08] bg-white/[.04] px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={saveUrl}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-white"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  if (status === "done" && meshUrl) {
    return (
      <div className="relative h-full w-full">
        <MeshViewer url={meshUrl} />
        {alignment && <div className="absolute bottom-12 left-3 max-w-xs rounded-lg bg-black/70 px-3 py-2 text-xs text-white">
          <p>{alignment}</p>
          {qualityWarnings.length > 0 && <details className="mt-1"><summary className="cursor-pointer">Photo feedback</summary><ul className="mt-2 max-h-24 overflow-y-auto">{qualityWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
        </div>}
        <div className="absolute right-3 top-3 flex gap-2">
          <button onClick={() => { setStatus("idle"); setMeshUrl(null); }} className="rounded-lg bg-black/70 px-3 py-2 text-xs text-white">Regenerate</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 overflow-y-auto p-4 text-center">
      {status === "loading" ? (
        <>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm text-neutral-400">
            {mode === "photogrammetry" ? `${stage || "Uploading photos"}. Camera alignment and surface reconstruction can take several minutes.` : `Generating geometry from ${imageUrls.length} exterior views…`}
          </p>
        </>
      ) : (
        <>
          {status === "error" && error && (
            <p className="max-w-xs text-xs text-red-400">{error}</p>
          )}
          <div className="flex gap-2" role="group" aria-label="Reconstruction method">
            <button onClick={() => { setMode("photogrammetry"); setError(null); }} aria-pressed={mode === "photogrammetry"} className={`rounded-lg px-3 py-2 text-xs ${mode === "photogrammetry" ? "bg-white text-black" : "bg-white/10 text-white"}`}>Photo reconstruction</button>
            <button onClick={() => { setMode("diffusion"); setError(null); }} aria-pressed={mode === "diffusion"} className={`rounded-lg px-3 py-2 text-xs ${mode === "diffusion" ? "bg-white text-black" : "bg-white/10 text-white"}`}>AI generation</button>
          </div>
          {mode === "photogrammetry" ? <>
            <p className="max-w-sm text-xs text-neutral-400">Photos align automatically; upload order does not matter. Walk around a stationary vehicle with the same camera and zoom, keeping most of the vehicle in each frame. Upload 30–60 overlapping exterior views. Four auction views may not align.</p>
            <label className="cursor-pointer rounded-lg border border-white/20 px-3 py-2 text-xs text-white">
              Choose exterior photos
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => {
                const selected = Array.from(event.target.files || []);
                if (selected.length > 60 || selected.reduce((total, file) => total + file.size, 0) > 40 * 1024 * 1024) { setError("Use at most 60 photos, totaling no more than 40 MB."); return; }
                setPhotos(selected); setError(null);
              }} />
            </label>
            <p className="text-xs text-neutral-500">{photos.length ? `${photos.length} photos selected` : `Using ${imageUrls.length} auction photos unless you upload a set`}</p>
            <a className="text-xs text-neutral-300 underline" href="https://colab.research.google.com/github/ldbtech/Kepler-452b/blob/main/colab/keplerv_photogrammetry.ipynb" target="_blank" rel="noreferrer">Open Colab · test photos before starting the API</a>
          </> : <p className="max-w-xs text-xs text-neutral-500">
            Hunyuan3D reconstructs the vehicle from {imageUrls.length} separate exterior
            views after removing the backgrounds. The result is a gray 3D model; hidden
            details are inferred.
          </p>}
          {(mode === "diffusion" || photos.length === 0) && <div className="grid w-full max-w-sm grid-cols-4 gap-2">
            {imageUrls.map((image, index) => (
              <div key={image} className="text-center">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={image} alt={`Vehicle reference view ${index + 1}`} fill unoptimized className="object-cover" sizes="90px" />
                </div>
                <p className="mt-1 text-[10px] text-neutral-500">{["Reference", "90°", "180°", "270°"][index]}</p>
              </div>
            ))}
          </div>}
          <button
            disabled={mode === "photogrammetry" ? (photos.length || imageUrls.length) < 3 : imageUrls.length === 0}
            onClick={generate}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
          >
            Generate 3D model
          </button>
          <button
            onClick={() => {
              setReconstructUrl("");
              setUrl("");
            }}
            className="text-[11px] text-neutral-600 underline hover:text-neutral-400"
          >
            Change service URL
          </button>
        </>
      )}
    </div>
  );
}
