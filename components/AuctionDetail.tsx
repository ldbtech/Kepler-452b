"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { Vehicle } from "@/lib/vehicles";
import { imagesByCategory, type ImageCategory } from "@/lib/imageCategories";
import {
  formatAgo,
  formatCountdown,
  formatUsd,
  getAgentSteps,
  getAiRecommendation,
  getAuctionState,
} from "@/lib/demo";

const Vehicle3DPhoto = dynamic(() => import("@/components/Vehicle3DPhoto"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-neutral-600">
      Loading 3D photo…
    </div>
  ),
});

const CATEGORIES: { key: ImageCategory; icon: string }[] = [
  { key: "Exterior", icon: "🚘" },
  { key: "Interior", icon: "🪑" },
  { key: "Undercarriage", icon: "🔧" },
  { key: "Mechanical", icon: "⚙️" },
  { key: "Damage", icon: "⚠️" },
];

const RISK_STYLE: Record<string, string> = {
  Low: "text-emerald-400",
  Moderate: "text-amber-400",
  High: "text-red-400",
};

export default function AuctionDetail({ vehicle }: { vehicle: Vehicle }) {
  const [category, setCategory] = useState<ImageCategory>("Exterior");
  const [autoBid, setAutoBid] = useState(true);
  const buckets = imagesByCategory(vehicle);
  const rec = getAiRecommendation(vehicle);
  const auction = getAuctionState(vehicle);
  const steps = getAgentSteps();

  const flatImages = buckets[category];

  return (
    <div className="px-6 py-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        {/* Main viewer card */}
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 font-bold text-white">
                <span className="h-1 w-1 rounded-full bg-white" /> LIVE
              </span>
              <span className="text-neutral-500">
                Lane {auction.lane} · Auction #{auction.auctionId}
              </span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-semibold text-red-400">
                ⏱ {formatCountdown(auction.secondsRemaining)}
              </div>
              <div className="text-[10px] text-neutral-500">Time Remaining</div>
            </div>
          </div>

          <h1 className="mt-3 text-xl font-semibold text-neutral-100">
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

          <div className="mt-4 flex gap-3">
            {/* category tabs */}
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map((c) => {
                const count = buckets[c.key].length;
                const disabled = count === 0;
                return (
                  <button
                    key={c.key}
                    disabled={disabled}
                    onClick={() => setCategory(c.key)}
                    className={`flex w-24 flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] transition-colors ${
                      category === c.key
                        ? "border-blue-500 bg-blue-600/15 text-blue-400"
                        : disabled
                          ? "cursor-not-allowed border-white/5 text-neutral-700"
                          : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                    }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    {c.key}
                  </button>
                );
              })}
            </div>

            {/* image / 3D area */}
            <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-xl bg-neutral-900">
              {category === "Exterior" ? (
                <Vehicle3DPhoto vehicle={vehicle} />
              ) : flatImages.length > 0 ? (
                <div className="relative h-full w-full">
                  <Image
                    src={flatImages[0].file}
                    alt={`${category} photo`}
                    fill
                    className="object-contain"
                    sizes="640px"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-neutral-600">
                  Not captured for this lot
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right rail: bid card + recommendation */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
            <div className="text-xs text-neutral-500">Current Bid</div>
            <div className="text-2xl font-semibold text-emerald-400">
              {formatUsd(auction.currentBid)}
            </div>
            <div className="mt-0.5 text-xs text-neutral-500">
              Next bid: {formatUsd(auction.nextBid)}
            </div>
            <button className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500">
              Bid {formatUsd(auction.nextBid)}
            </button>
            <label className="mt-3 flex items-center justify-between rounded-lg bg-white/[.03] px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 text-neutral-300">
                ✅ Auto-bid {autoBid ? "ON" : "OFF"}
              </span>
              <button
                onClick={() => setAutoBid((v) => !v)}
                className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                  autoBid ? "bg-emerald-500" : "bg-neutral-700"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                    autoBid ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-200">Recommendation</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                High Confidence
              </span>
            </div>
            <Row label="Recommended max bid" value={formatUsd(rec.recommendedMaxBid)} />
            <Row
              label="Expected margin"
              value={`${formatUsd(rec.expectedMargin)} (${rec.expectedMarginPct}%)`}
              valueClass="text-emerald-400"
            />
            <Row
              label="Risk level"
              value={rec.riskLevel}
              valueClass={RISK_STYLE[rec.riskLevel]}
            />
            <Row label="Confidence" value={`${rec.confidence}%`} />
            <p className="mt-3 rounded-lg bg-blue-600/10 p-2.5 text-xs leading-relaxed text-blue-200">
              ✨ {rec.reasoning}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
            <div className="mb-2 text-sm font-medium text-neutral-200">
              Live Auction Activity
            </div>
            <ul className="flex flex-col gap-2 text-xs">
              {auction.activity.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">
                    {a.bidder[0]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-neutral-300">
                    {a.bidder}
                  </span>
                  <span className="font-medium text-neutral-100">{formatUsd(a.amount)}</span>
                  <span className="shrink-0 text-neutral-600">{formatAgo(a.secondsAgo)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* bottom strip */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-blue-400">
            ✨ AI Agent is handling this auction
          </div>
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.label} className="flex flex-1 flex-col items-center text-center">
                <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  ✓
                </span>
                <span className="text-[11px] text-neutral-400">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-200">
              Your Guardrails <span className="text-emerald-400">(Active)</span>
            </span>
          </div>
          <Row label="Max bid per vehicle" value="$18,500" />
          <Row label="Total budget cap" value="$100,000" />
          <Row label="Risk tolerance" value="Low – Moderate" />
          <Row label="Intervene" value="Only if flagged" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
          <div className="mb-1 text-sm font-medium text-neutral-200">Market Context</div>
          <p className="text-xs text-neutral-500">
            Similar vehicles · {rec.comparableCount} in last 30 days
          </p>
          <div className="mt-3 text-2xl font-semibold text-neutral-100">
            {formatUsd(rec.estimatedMarketValue)}
          </div>
          <div className="text-xs text-neutral-500">Estimated market value</div>
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
