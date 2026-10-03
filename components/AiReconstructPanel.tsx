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
    setStatus("loading");
    setError(null);
    try {
      const headers = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" };
      const health = await fetch(`${url}/health`, { headers, signal: AbortSignal.timeout(20000) });
      if (!health.ok) throw new Error("Colab service is unavailable. Check the running server cell.");
      const service = await health.json();
      if (service.model !== "tencent/Hunyuan3D-2mv" || service.api_version !== 2) {
        throw new Error("This Colab session still runs the old Shap-E model. Load the updated notebook and rerun its setup cells.");
      }
      const res = await fetch(`${url}/reconstruct`, {
        method: "POST",
        headers,
        body: JSON.stringify({ image_urls: imageUrls, steps: 30 }),
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
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
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
        <div className="absolute right-3 top-3 flex gap-2">
          <a href={meshUrl} download="vehicle.glb" className="rounded-lg bg-black/70 px-3 py-2 text-xs text-white">Download GLB</a>
          <button onClick={() => { setStatus("idle"); setMeshUrl(null); }} className="rounded-lg bg-black/70 px-3 py-2 text-xs text-white">Regenerate</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      {status === "loading" ? (
        <>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm text-neutral-400">
            Isolating the vehicle in {imageUrls.length} views and generating its geometry on Colab. This may take several minutes…
          </p>
        </>
      ) : (
        <>
          {status === "error" && error && (
            <p className="max-w-xs text-xs text-red-400">{error}</p>
          )}
          <p className="max-w-xs text-xs text-neutral-500">
            Hunyuan3D reconstructs the vehicle from {imageUrls.length} separate exterior
            views after removing the backgrounds. The result is a gray 3D model; hidden
            details are inferred.
          </p>
          <div className="grid w-full max-w-sm grid-cols-4 gap-2">
            {imageUrls.map((image, index) => (
              <div key={image} className="text-center">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={image} alt={`Vehicle reference view ${index + 1}`} fill unoptimized className="object-cover" sizes="90px" />
                </div>
                <p className="mt-1 text-[10px] text-neutral-500">{["Reference", "90°", "180°", "270°"][index]}</p>
              </div>
            ))}
          </div>
          <button
            disabled={imageUrls.length === 0}
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
