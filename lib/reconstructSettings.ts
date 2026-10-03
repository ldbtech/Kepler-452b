"use client";

// Use the account's stable ngrok domain by default. A browser override is
// available if the reconstruction service moves to another host.
const KEY = "keplerv_reconstruct_url";

export const DEFAULT_RECONSTRUCT_URL = "https://aloha-anytime-zodiac.ngrok-free.dev";

export function getReconstructUrl(): string {
  if (typeof window === "undefined") return DEFAULT_RECONSTRUCT_URL;
  try {
    const saved = window.localStorage.getItem(KEY);
    return saved ? new URL(saved).origin : DEFAULT_RECONSTRUCT_URL;
  } catch {
    return DEFAULT_RECONSTRUCT_URL;
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
