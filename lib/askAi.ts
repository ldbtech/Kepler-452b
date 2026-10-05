"use client";

// Hands a question to the AI Assistant chat widget from anywhere in the app
// (see the matching listener in components/LiveChat.tsx).
export function askAi(text: string) {
  if (typeof window === "undefined" || !text.trim()) return;
  window.dispatchEvent(new CustomEvent("keplerv:ask", { detail: text.trim() }));
}
