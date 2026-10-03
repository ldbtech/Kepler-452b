"use client";

// The Colab notebook's ngrok URL is ephemeral — it changes every time the
// notebook is restarted — so it's kept client-side in localStorage rather
// than baked into the deployed site.
const KEY = "keplerv_reconstruct_url";

export function getReconstructUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setReconstructUrl(url: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, url.trim().replace(/\/+$/, ""));
  } catch {
    // ignore
  }
}
