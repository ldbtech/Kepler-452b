"use client";

import { useEffect, useRef, useState } from "react";
import type { Vehicle } from "@/lib/vehicles";
import type { Dealer } from "@/lib/dealers";
import { formatUsd, getAuctionState } from "@/lib/demo";
import { getDealerAiRecommendation } from "@/lib/recommend";

export type ActivityKind = "bid" | "outbid" | "won" | "lost" | "scan";

export type ActivityEvent = {
  id: number;
  kind: ActivityKind;
  text: string;
  lotNumber: number;
  source: "auction" | "owner";
  timestamp: number;
};

// Ambient, portfolio-wide simulation of "what the AI is doing right now"
// across every monitored vehicle at once — distinct from the per-vehicle
// live-bid engine on the auction detail page (useLiveAuction), which is the
// real interactive experience once you click into a specific lot. This is
// intentionally a separate, simpler simulation: there's no shared backend,
// so perfect state sync between "ambient feed" and "the one auction you
// opened" isn't achievable without one — treat this as illustrating the
// concept (AI working across the whole portfolio continuously), not as a
// literal ledger of the other page's bid state.
export function usePortfolioActivity(vehicles: Vehicle[], dealer: Dealer) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const nextId = useRef(0);
  const remaining = useRef<Record<number, number>>({});

  useEffect(() => {
    remaining.current = Object.fromEntries(
      vehicles.map((v) => [v.lotNumber, getAuctionState(v).secondsRemaining]),
    );
  }, [vehicles]);

  function push(kind: ActivityKind, vehicle: Vehicle, text: string) {
    setEvents((prev) =>
      [
        {
          id: nextId.current++,
          kind,
          lotNumber: vehicle.lotNumber,
          source: vehicle.source ?? "auction",
          text,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 40),
    );
  }

  useEffect(() => {
    if (vehicles.length === 0) return;

    const tick = setInterval(() => {
      const v = vehicles[Math.floor(Math.random() * vehicles.length)];
      const rec = getDealerAiRecommendation(v, dealer);
      const label = `${v.year} ${v.make} ${v.model}`;
      const r = Math.random();

      if (r < 0.3) {
        const amt = Math.round((rec.recommendedMaxBid * (0.4 + Math.random() * 0.4)) / 10) * 10;
        push("bid", v, `Auto-bid placed on ${label} — ${formatUsd(amt)}`);
      } else if (r < 0.55) {
        push("outbid", v, `Outbid on ${label} — re-bidding within your guardrails`);
      } else if (r < 0.8) {
        push(
          "scan",
          v,
          `Re-scored ${label}: ${rec.riskLevel.toLowerCase()} risk, ${rec.confidence}% confidence`,
        );
      } else {
        push("scan", v, `Watching ${label} — comparing against ${rec.comparableCount} recent sales`);
      }
    }, 2600 + Math.random() * 2200);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, dealer]);

  // Separate 1s clock driving countdowns-to-zero -> win/loss events, decoupled
  // from the ambient tick above so the two don't fight over timing.
  useEffect(() => {
    if (vehicles.length === 0) return;

    const clock = setInterval(() => {
      setNow(Date.now());
      for (const v of vehicles) {
        const left = remaining.current[v.lotNumber];
        if (left === undefined) continue;
        if (left <= 0) {
          const score = getDealerAiRecommendation(v, dealer).confidence;
          const won = Math.random() * 100 < Math.max(25, Math.min(75, score - 10));
          const label = `${v.year} ${v.make} ${v.model}`;
          if (won) {
            const amt = getDealerAiRecommendation(v, dealer).recommendedMaxBid;
            push("won", v, `Won ${label} — ${formatUsd(Math.round((amt * 0.85) / 10) * 10)}`);
          } else {
            push("lost", v, `Lost ${label} to a competing bid — staying within budget`);
          }
          // Keep the demo alive: this lot re-enters the rotation shortly.
          remaining.current[v.lotNumber] = 90 + Math.floor(Math.random() * 240);
        } else {
          remaining.current[v.lotNumber] = left - 1;
        }
      }
    }, 1000);

    return () => clearInterval(clock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, dealer]);

  return { events, now };
}
