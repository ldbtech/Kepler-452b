"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getReconstructUrl, setReconstructUrl } from "@/lib/reconstructSettings";

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
  const [url, setUrl] = useState("");
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

  function saveUrl() {
    setReconstructUrl(urlInput);
    setUrl(urlInput.trim().replace(/\/+$/, ""));
  }

  async function generate() {
    if (!url) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`${url}/reconstruct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_urls: imageUrls, steps: 64 }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Service returned ${res.status}${text ? `: ${text}` : ""}`);
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
    return <MeshViewer url={meshUrl} />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      {status === "loading" ? (
        <>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm text-neutral-400">
            Preparing {imageUrls.length} reference photos and generating a 3D mesh on Colab…
          </p>
        </>
      ) : (
        <>
          {status === "error" && error && (
            <p className="max-w-xs text-xs text-red-400">{error}</p>
          )}
          <p className="max-w-xs text-xs text-neutral-500">
            Uses up to six exterior photos as a multi-view reference board for Shap-E, then
            returns an orbitable 3D mesh. This is an experimental reconstruction, not a
            dimensionally accurate scan.
          </p>
          <button
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
