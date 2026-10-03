"use client";

import { useEffect, useRef, useState } from "react";
import type { Dealer } from "@/lib/dealers";
import { getVehicles } from "@/lib/vehicles";
import { formatUsd } from "@/lib/demo";
import { getDealerAiRecommendation, rankVehiclesForDealer } from "@/lib/recommend";
import { IconChat, IconClose, IconSparkle } from "@/components/icons";

type Message = { id: number; from: "user" | "ai"; text: string };

function buildReply(input: string, dealer: Dealer): string {
  const text = input.toLowerCase();
  const vehicles = getVehicles();
  const ranked = rankVehiclesForDealer(vehicles, dealer);

  if (/recommend|best|top|pick/.test(text)) {
    const top = ranked[0];
    if (!top) return "I don't have any live lots to recommend right now.";
    const rec = getDealerAiRecommendation(top.vehicle, dealer);
    return `My top pick for ${dealer.name} right now is the ${top.vehicle.year} ${top.vehicle.make} ${top.vehicle.model} — recommended max bid ${formatUsd(rec.recommendedMaxBid)}, ${rec.riskLevel.toLowerCase()} risk, ${rec.confidence}% confidence. ${rec.reasoning}`;
  }

  if (/guardrail|budget|max bid|limit/.test(text)) {
    return `Your current guardrails: max bid per vehicle ${formatUsd(dealer.maxBidPerVehicle)}, total budget cap ${formatUsd(dealer.totalBudgetCap)}, risk tolerance "${dealer.riskTolerance}". I won't recommend bids above these unless you change them in Guardrails.`;
  }

  if (/margin|profit/.test(text)) {
    const recs = ranked.map((r) => getDealerAiRecommendation(r.vehicle, dealer));
    const avg = Math.round(recs.reduce((s, r) => s + r.expectedMarginPct, 0) / recs.length);
    return `Across the current live batch, expected margin for ${dealer.name} averages ${avg}% after estimated repair costs. Strong matches tend to run higher — check the Live Auctions page for the ranked list.`;
  }

  if (/risk/.test(text)) {
    return `I score risk from reported damage severity and repair-cost uncertainty. Given your "${dealer.riskTolerance}" tolerance, I'll flag anything above that before recommending a bid.`;
  }

  if (/hello|hi there|^hi$|hey/.test(text)) {
    return `Hey! I'm your AI assistant for ${dealer.name}. Ask me about recommended vehicles, your guardrails, or expected margins.`;
  }

  return `Got it — I'm a simulated assistant for this prototype, so I only know about live auction data, your guardrails, and recommendations. Try asking "what should I bid on?" or "what's my budget?".`;
}

export default function LiveChat({ dealer }: { dealer: Dealer }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "ai",
      text: `Hi, I'm the AI assistant for ${dealer.name}. Ask me about recommended vehicles, guardrails, or margins.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: nextId.current++, from: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(
      () => {
        const reply = buildReply(text, dealer);
        setMessages((m) => [...m, { id: nextId.current++, from: "ai", text: reply }]);
        setTyping(false);
      },
      500 + Math.random() * 500,
    );
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/[.08] bg-neutral-900 shadow-2xl lg:bottom-24 lg:right-6">
          <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[.06] text-neutral-200">
                <IconSparkle className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <div>
                <div className="text-sm font-medium text-neutral-100">AI Assistant</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-500 hover:text-neutral-200"
              aria-label="Close chat"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.from === "user"
                    ? "ml-auto rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm bg-white/[.06] text-neutral-200"
                }`}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="w-fit rounded-2xl rounded-bl-sm bg-white/[.06] px-3 py-2 text-sm text-neutral-500">
                typing…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-white/[.06] p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a vehicle, bid, or guardrail…"
              className="flex-1 rounded-lg border border-white/[.06] bg-white/[.03] px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-white/20 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-white text-neutral-900 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg hover:bg-neutral-200 lg:bottom-6 lg:right-6"
        aria-label="Toggle AI assistant chat"
      >
        {open ? <IconClose className="h-5 w-5" /> : <IconChat className="h-5 w-5" strokeWidth={1.6} />}
      </button>
    </>
  );
}
