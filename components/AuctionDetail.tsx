"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { Vehicle } from "@/lib/vehicles";
import type { Dealer } from "@/lib/dealers";
import { imagesByCategory, type ImageCategory } from "@/lib/imageCategories";
import {
  formatAgo,
  formatCountdown,
  formatUsd,
  getAuctionState,
  getBiddingAgents,
  getMarketInsights,
} from "@/lib/demo";
import { getDealerAiRecommendation } from "@/lib/recommend";
import ConditionGauge from "@/components/ConditionGauge";
import MarketChart from "@/components/MarketChart";

const Vehicle3DPhoto = dynamic(() => import("@/components/Vehicle3DPhoto"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-neutral-600">
      Loading 3D photo…
    </div>
  ),
});

type ViewTab = "3D View" | "Photos" | "Interior" | "Mechanical" | "Damage";

const VIEW_TABS: { key: ViewTab; icon: string; category?: ImageCategory }[] = [
  { key: "3D View", icon: "🧊", category: "Exterior" },
  { key: "Photos", icon: "🖼️" },
  { key: "Interior", icon: "🪑", category: "Interior" },
  { key: "Mechanical", icon: "⚙️", category: "Mechanical" },
  { key: "Damage", icon: "⚠️", category: "Damage" },
];

const RISK_STYLE: Record<string, string> = {
  Low: "text-emerald-400",
  Moderate: "text-amber-400",
  High: "text-red-400",
};

const AVATAR_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];
function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function AuctionDetail({
  vehicle,
  dealer,
}: {
  vehicle: Vehicle;
  dealer: Dealer;
}) {
  const [tab, setTab] = useState<ViewTab>("3D View");
  const [autoBid, setAutoBid] = useState(true);
  const buckets = imagesByCategory(vehicle);
  const rec = getDealerAiRecommendation(vehicle, dealer);
  const auction = getAuctionState(vehicle, rec.recommendedMaxBid);
  const agents = useMemo(() => getBiddingAgents(vehicle), [vehicle]);
  const insights = useMemo(() => getMarketInsights(vehicle), [vehicle]);

  const [customBid, setCustomBid] = useState(auction.nextBid);
  const bidStep = Math.max(50, Math.round(auction.nextBid * 0.02));

  const activeTab = VIEW_TABS.find((t) => t.key === tab)!;
  const flatImages = activeTab.category ? buckets[activeTab.category] : [];
  const totalPhotoCount = vehicle.images.length;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Main viewer card */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.03] to-white/[.01] p-4 xl:col-span-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 font-bold text-white">
                <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> LIVE
              </span>
              <span className="text-neutral-500">
                Auction #{auction.auctionId} · Lane {auction.lane}
              </span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-semibold text-red-400">
                ⏱ {formatCountdown(auction.secondsRemaining)}
              </div>
              <div className="text-[10px] text-neutral-500">Time Remaining</div>
            </div>
          </div>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-neutral-100">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim ?? ""}
          </h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : null,
              vehicle.condition,
              vehicle.color,
              "Clean Title",
            ]
              .filter(Boolean)
              .map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/[.06] px-2.5 py-1 text-xs text-neutral-300"
                >
                  {chip}
                </span>
              ))}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            👥 {auction.bidderCount} bidders online
          </div>

          {/* image / 3D area */}
          <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-900">
            {tab === "3D View" ? (
              <Vehicle3DPhoto vehicle={vehicle} />
            ) : tab === "Photos" ? (
              <div className="grid h-full grid-cols-3 gap-1 overflow-y-auto p-1">
                {vehicle.images.map((img) => (
                  <div
                    key={img.label}
                    className="relative aspect-square overflow-hidden rounded-md bg-neutral-800"
                  >
                    <Image
                      src={img.file}
                      alt={img.label}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ))}
              </div>
            ) : flatImages.length > 0 ? (
              <Image
                src={flatImages[0].file}
                alt={`${tab} photo`}
                fill
                className="object-contain"
                sizes="640px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-neutral-600">
                Not captured for this lot
              </div>
            )}
          </div>

          {/* view tabs */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {VIEW_TABS.map((t) => {
              const count = t.category ? buckets[t.category].length : totalPhotoCount;
              const disabled = t.key !== "3D View" && t.key !== "Photos" && count === 0;
              return (
                <button
                  key={t.key}
                  disabled={disabled}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    tab === t.key
                      ? "border-blue-500 bg-blue-600/15 text-blue-400"
                      : disabled
                        ? "cursor-not-allowed border-white/5 text-neutral-700"
                        : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.key}
                  {t.key === "Photos" && (
                    <span className="text-neutral-500">({totalPhotoCount})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current bid card */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.03] to-white/[.01] p-4 xl:col-span-3">
          <div className="text-xs text-neutral-500">Current Bid</div>
          <div className="text-3xl font-bold tracking-tight text-emerald-400">
            {formatUsd(auction.currentBid)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
            <span>{auction.bidderCount} bidders</span>
            <span>·</span>
            <span>{auction.activity.length} bids</span>
            <span>·</span>
            <span className="text-red-400">{formatCountdown(auction.secondsRemaining)}</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setCustomBid((v) => Math.max(auction.nextBid, v - bidStep))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lg text-neutral-300 hover:bg-white/5"
              aria-label="Decrease bid"
            >
              −
            </button>
            <div className="flex-1 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-center text-sm font-semibold text-neutral-100">
              {formatUsd(customBid)}
            </div>
            <button
              onClick={() => setCustomBid((v) => v + bidStep)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lg text-neutral-300 hover:bg-white/5"
              aria-label="Increase bid"
            >
              +
            </button>
          </div>

          <button className="mt-3 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500">
            Place Bid
          </button>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setAutoBid((v) => !v)}
              className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                autoBid
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 text-neutral-400 hover:bg-white/5"
              }`}
            >
              {autoBid ? "✓ " : ""}Auto Bid
            </button>
            <button className="rounded-lg border border-white/10 py-2 text-xs font-medium text-neutral-400 hover:bg-white/5">
              Set Max
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-600">
            <span>Minimum next bid: {formatUsd(auction.nextBid)}</span>
          </div>
        </div>

        {/* Live Activity */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.03] to-white/[.01] p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-200">Live Activity</span>
            <span className="text-[11px] text-neutral-600">All Bidders ⌄</span>
          </div>
          <ul className="flex flex-col gap-3">
            {auction.activity.map((a, i) => (
              <li key={i} className="flex items-center gap-2.5 text-xs">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: colorForName(a.bidder) }}
                >
                  {a.bidder[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-neutral-300">{a.bidder}</div>
                  <div className="text-[10px] text-neutral-600">{formatAgo(a.secondsAgo)}</div>
                </div>
                <span className="font-semibold text-neutral-100">{formatUsd(a.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vehicle Details */}
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 xl:col-span-4">
          <div className="mb-3 text-sm font-medium text-neutral-200">Vehicle Details</div>
          <Row label="Year" value={String(vehicle.year)} />
          <Row label="Make" value={vehicle.make} />
          <Row label="Model" value={vehicle.model} />
          <Row label="VIN" value="—" />
          <Row label="Mileage" value={vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : "—"} />
          <Row label="Title" value="Clean" valueClass="text-emerald-400" />
          <Row label="Location" value={vehicle.location ?? "—"} />
        </div>

        {/* Condition & AI Analysis */}
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 xl:col-span-4">
          <div className="mb-3 text-sm font-medium text-neutral-200">Condition &amp; AI Analysis</div>
          <div className="flex items-center gap-3">
            <ConditionGauge score={rec.conditionScore} />
            <div className="flex-1">
              <div className="text-xs text-neutral-500">Overall Condition</div>
              <div className="mt-2 text-xs text-neutral-500">Estimated Repair Cost</div>
              <div className="text-sm font-semibold text-amber-400">
                {formatUsd(rec.repairCostLow)} – {formatUsd(rec.repairCostHigh)}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-white/[.03] p-2.5">
            <div className="text-xs text-neutral-500">Estimated Wholesale Value</div>
            <div className="text-sm font-semibold text-emerald-400">
              {formatUsd(rec.wholesaleValueLow)} – {formatUsd(rec.wholesaleValueHigh)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {["Damage", "Mechanical", "Interior"].map((label) => {
              const img =
                label === "Damage"
                  ? buckets.Damage[0]
                  : label === "Mechanical"
                    ? buckets.Mechanical[0]
                    : buckets.Interior[0];
              return (
                <div key={label} className="overflow-hidden rounded-lg bg-neutral-900">
                  <div className="relative aspect-square">
                    {img ? (
                      <Image src={img.file} alt={label} fill className="object-cover" sizes="100px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] text-neutral-700">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="px-1 py-1 text-center text-[9px] text-neutral-500">{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Insights */}
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-200">Market Insights</span>
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-neutral-100">
              {formatUsd(rec.estimatedMarketValue)}
            </span>
            <span className="text-[11px] text-neutral-500">
              vs {formatUsd(insights.points[0].similar)} similar
            </span>
          </div>
          <MarketChart insights={insights} />
        </div>

        {/* Bidding Agents */}
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 xl:col-span-8">
          <div className="mb-3 text-sm font-medium text-neutral-200">
            Bidding Agents <span className="text-neutral-600">(Simulated Dealerships)</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => (
              <div key={agent.key} className="rounded-xl border border-white/10 bg-white/[.02] p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: colorForName(agent.label) }}
                  >
                    {agent.key}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-neutral-200">
                      {agent.label}
                    </div>
                    <div className="truncate text-[10px] text-neutral-500">
                      {agent.strategyLabel}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                  {agent.description}
                </p>
                <div className="mt-2 text-xs text-neutral-500">Max Bid</div>
                <div className="text-sm font-semibold text-neutral-100">
                  {formatUsd(agent.maxBid)}
                </div>
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${agent.aggressiveness}%` }}
                    />
                  </div>
                  <div className="mt-0.5 text-[10px] text-neutral-600">
                    Aggressiveness {agent.aggressiveness}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your AI Assistant */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-600/[.06] to-white/[.01] p-4 xl:col-span-4">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-blue-400">
            ✨ Your AI Assistant
          </div>
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-neutral-500">Recommended Max Bid</span>
            <span className="font-medium text-neutral-200">
              {formatUsd(rec.recommendedMaxBid)}{" "}
              <span className="text-[10px] text-blue-400">Edit</span>
            </span>
          </div>
          <Row
            label="Expected Margin"
            value={`${formatUsd(rec.expectedMargin)} (${rec.expectedMarginPct}%)`}
            valueClass="text-emerald-400"
          />
          <Row label="Win Probability" value={`${rec.winProbability}%`} />
          <Row label="Risk Level" value={rec.riskLevel} valueClass={RISK_STYLE[rec.riskLevel]} />
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-xs leading-relaxed text-emerald-200">
            <span className="mt-0.5">●</span>
            {rec.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-medium text-neutral-200 ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}
