"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Vehicle } from "@/lib/vehicles";
import type { Dealer } from "@/lib/dealers";
import { formatAgo, formatUsd, getAuctionState } from "@/lib/demo";
import {
  getDealerAiRecommendation,
  rankVehiclesForDealer,
  wasCappedByGuardrail,
  type ScoredVehicle,
} from "@/lib/recommend";
import { usePortfolioActivity, type ActivityEvent } from "@/lib/usePortfolioActivity";
import { askAi } from "@/lib/askAi";
import LiveCountdown from "@/components/LiveCountdown";
import {
  IconAlertTriangle,
  IconChat,
  IconDollar,
  IconSearch,
  IconSparkle,
  IconTrophy,
  IconUsers,
} from "@/components/icons";

const EVENT_STYLE: Record<ActivityEvent["kind"], { icon: typeof IconDollar; color: string }> = {
  bid: { icon: IconDollar, color: "text-accent" },
  outbid: { icon: IconAlertTriangle, color: "text-amber-400" },
  won: { icon: IconTrophy, color: "text-emerald-400" },
  lost: { icon: IconAlertTriangle, color: "text-ink-3" },
  scan: { icon: IconSearch, color: "text-ink-3" },
};

export default function CommandCenter({
  dealer,
  vehicles,
}: {
  dealer: Dealer;
  vehicles: Vehicle[];
}) {
  const ranked = rankVehiclesForDealer(vehicles, dealer);
  const { events, now } = usePortfolioActivity(vehicles, dealer);
  const [command, setCommand] = useState("");

  const escalations = vehicles.filter((v) => wasCappedByGuardrail(v, dealer)).slice(0, 2);
  const strongMatches = ranked.filter((v) => v.score >= 65).length;
  const activeAutoBids = Math.min(vehicles.length, 3 + (events.length % 4));

  function submitCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return;
    askAi(command);
    setCommand("");
  }

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      {/* Autopilot header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-ink">Autopilot active</span>
          <span className="text-sm text-ink-3">
            — watching {vehicles.length} auctions for {dealer.name}
          </span>
        </div>
        <div className="flex gap-2">
          <Stat value={String(activeAutoBids)} label="Active auto-bids" />
          <Stat value={String(strongMatches)} label="Strong matches" />
          <Stat value={formatUsd(dealer.totalBudgetCap)} label="Budget available" />
        </div>
      </div>

      {/* Command bar */}
      <form onSubmit={submitCommand} className="mb-6">
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 focus-within:border-line-strong">
          <IconSparkle className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Tell your AI what to look for — e.g. &ldquo;only bid on trucks under $15k&rdquo;"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-base hover:opacity-90"
          >
            <IconChat className="h-3.5 w-3.5" strokeWidth={1.6} />
            Ask
          </button>
        </div>
      </form>

      {/* Escalations */}
      {escalations.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {escalations.map((v) => {
            const rawRec = getDealerAiRecommendation(v, dealer);
            return (
              <Link
                key={v.lotNumber}
                href={`/auctions/${v.lotNumber}`}
                className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[.06] px-4 py-3 hover:border-amber-500/50"
              >
                <IconAlertTriangle className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.5} />
                <p className="min-w-0 flex-1 truncate text-sm text-ink-2">
                  <span className="font-medium text-ink">Needs your review</span> — the AI
                  wanted to bid more than your {formatUsd(dealer.maxBidPerVehicle)} guardrail on
                  the {v.year} {v.make} {v.model}, capped at {formatUsd(rawRec.recommendedMaxBid)}
                </p>
                <span className="shrink-0 text-xs text-amber-400">Review →</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Live activity feed */}
        <div className="lg:col-span-3">
          <div className="mb-3 text-sm font-medium text-ink-3">Live activity</div>
          <div className="flex h-[520px] flex-col gap-1 overflow-y-auto rounded-2xl border border-line bg-surface p-3">
            {events.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-ink-3">
                Watching the market…
              </div>
            ) : (
              events.map((e, i) => {
                const style = EVENT_STYLE[e.kind];
                const Icon = style.icon;
                return (
                  <Link
                    key={e.id}
                    href={`/auctions/${e.lotNumber}`}
                    className={`flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-fill ${
                      i === 0 ? "animate-[fadein_.4s_ease]" : ""
                    }`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.color}`} strokeWidth={1.5} />
                    <span className="min-w-0 flex-1 text-ink-2">{e.text}</span>
                    <span className="shrink-0 text-xs text-ink-3">
                      {formatAgo(Math.max(0, Math.floor((now - e.timestamp) / 1000)))}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Top pick, kept compact beside the feed */}
        <div className="lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-ink-3">Top pick right now</div>
          {ranked[0] && <CompactCard item={ranked[0]} dealer={dealer} />}

          <div className="mt-6 mb-3 text-sm font-medium text-ink-3">Browse all auctions</div>
          <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
            {ranked.slice(1).map((item) => (
              <MiniRow key={item.vehicle.lotNumber} item={item} dealer={dealer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-1.5 text-center">
      <div className="text-sm font-semibold text-ink">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-ink-3">{label}</div>
    </div>
  );
}

function CompactCard({ item, dealer }: { item: ScoredVehicle; dealer: Dealer }) {
  const v = item.vehicle;
  const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
  const rec = getDealerAiRecommendation(v, dealer);
  const auction = getAuctionState(v, rec.recommendedMaxBid);

  return (
    <Link
      href={`/auctions/${v.lotNumber}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface hover:border-line-strong"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900">
        {cover && (
          <Image
            src={cover.file}
            alt={`${v.year} ${v.make} ${v.model}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="420px"
          />
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <span className="h-1 w-1 rounded-full bg-white" /> LIVE
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-ink">
          {v.year} {v.make} {v.model}
        </h3>
        <p className="mt-1 text-xs text-ink-2">{item.matchReasons.join(" · ")}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-3">Current bid</div>
            <div className="font-semibold text-ink">{formatUsd(auction.currentBid)}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <LiveCountdown initialSeconds={auction.secondsRemaining} />
            <span className="flex items-center gap-1">
              <IconUsers className="h-3.5 w-3.5" />
              {auction.bidderCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MiniRow({ item, dealer }: { item: ScoredVehicle; dealer: Dealer }) {
  const v = item.vehicle;
  const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
  const rec = getDealerAiRecommendation(v, dealer);
  const auction = getAuctionState(v, rec.recommendedMaxBid);

  return (
    <Link
      href={`/auctions/${v.lotNumber}`}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 hover:border-line-strong"
    >
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
        {cover && (
          <Image src={cover.file} alt={v.model} fill className="object-cover" sizes="64px" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {v.year} {v.make} {v.model}
        </div>
        <div className="text-xs text-ink-3">
          <LiveCountdown initialSeconds={auction.secondsRemaining} /> · {v.location ?? "—"}
        </div>
      </div>
      <div className="shrink-0 text-right text-sm font-semibold text-ink">
        {formatUsd(auction.currentBid)}
      </div>
    </Link>
  );
}
