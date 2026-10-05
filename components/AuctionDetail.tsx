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
import AiReconstructPanel from "@/components/AiReconstructPanel";
import { useLiveAuction } from "@/lib/useLiveAuction";
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconCube,
  IconGear,
  IconImage,
  IconSeat,
  IconSparkle,
  IconTrophy,
  IconUsers,
} from "@/components/icons";

const Vehicle3DPhoto = dynamic(() => import("@/components/Vehicle3DPhoto"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-ink-3">
      Loading 3D photo…
    </div>
  ),
});

type ViewTab = "3D View" | "AI 3D (Beta)" | "Photos" | "Interior" | "Mechanical" | "Damage";

const VIEW_TABS: { key: ViewTab; icon: typeof IconCube; category?: ImageCategory }[] = [
  { key: "3D View", icon: IconCube, category: "Exterior" },
  { key: "AI 3D (Beta)", icon: IconSparkle },
  { key: "Photos", icon: IconImage },
  { key: "Interior", icon: IconSeat, category: "Interior" },
  { key: "Mechanical", icon: IconGear, category: "Mechanical" },
  { key: "Damage", icon: IconAlertTriangle, category: "Damage" },
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
  const buckets = imagesByCategory(vehicle);
  const rec = getDealerAiRecommendation(vehicle, dealer);
  const initialAuction = useMemo(
    () => getAuctionState(vehicle, rec.recommendedMaxBid),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehicle.lotNumber],
  );
  const agents = useMemo(() => getBiddingAgents(vehicle), [vehicle]);
  const insights = useMemo(() => getMarketInsights(vehicle), [vehicle]);

  const auction = useLiveAuction({
    dealer,
    lotNumber: vehicle.lotNumber,
    initial: initialAuction,
    agents,
    guardrailMax: dealer.maxBidPerVehicle,
    suggestedMax: rec.recommendedMaxBid,
  });

  const [customBid, setCustomBidRaw] = useState(initialAuction.nextBid);
  const [syncedNextBid, setSyncedNextBid] = useState(initialAuction.nextBid);
  const [showMaxInput, setShowMaxInput] = useState(false);
  // Keep the bid stepper's value following the live next-bid amount, using
  // the render-time "adjust state when a value changes" pattern instead of
  // an effect (no external system involved, so no effect is needed).
  if (auction.nextBid !== syncedNextBid) {
    setSyncedNextBid(auction.nextBid);
    setCustomBidRaw(auction.nextBid);
  }
  const setCustomBid = setCustomBidRaw;
  const bidStep = Math.max(50, Math.round(auction.nextBid * 0.02));

  const activeTab = VIEW_TABS.find((t) => t.key === tab)!;
  const flatImages = activeTab.category ? buckets[activeTab.category] : [];
  const totalPhotoCount = vehicle.images.length;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Main viewer card */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 font-semibold text-white">
                <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> LIVE
              </span>
              <span className="text-ink-3">
                Auction #{initialAuction.auctionId} · Lane {initialAuction.lane}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-right">
              <IconClock className="h-3.5 w-3.5 text-red-400" />
              <div>
                <div className="text-sm font-semibold text-red-400">
                  {formatCountdown(auction.remaining)}
                </div>
                <div className="text-[10px] text-ink-3">Time Remaining</div>
              </div>
            </div>
          </div>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">
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
                  className="rounded-full bg-fill px-2.5 py-1 text-xs text-ink-2"
                >
                  {chip}
                </span>
              ))}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-3">
            <IconUsers className="h-3.5 w-3.5" />
            {initialAuction.bidderCount} bidders online
          </div>

          {/* image / 3D area */}
          <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-900">
            {tab === "3D View" ? (
              <Vehicle3DPhoto vehicle={vehicle} />
            ) : tab === "AI 3D (Beta)" ? (
              <AiReconstructPanel
                imageUrls={vehicle.rotationOrder
                  .map((label) => vehicle.images.find((image) => image.label === label))
                  .filter((image) => image !== undefined)
                  .slice(0, 4)
                  .map((image) => `https://www.keplerv.com${image.file}`)}
              />
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
              <div className="flex h-full w-full items-center justify-center text-sm text-ink-3">
                Not captured for this lot
              </div>
            )}
          </div>

          {/* view tabs */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {VIEW_TABS.map((t) => {
              const count = t.category ? buckets[t.category].length : totalPhotoCount;
              const disabled =
                t.key !== "3D View" &&
                t.key !== "Photos" &&
                t.key !== "AI 3D (Beta)" &&
                count === 0;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  disabled={disabled}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    tab === t.key
                      ? "border-line-strong bg-fill-strong text-ink"
                      : disabled
                        ? "cursor-not-allowed border-line text-ink-3"
                        : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {t.key}
                  {t.key === "Photos" && (
                    <span className="text-ink-3">({totalPhotoCount})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current bid card */}
        <div className="flex flex-col rounded-2xl border border-line bg-surface p-4 xl:col-span-3">
          {auction.ended && auction.result ? (
            <div
              className={`mb-3 rounded-xl border p-3 text-center ${
                auction.result.isUser
                  ? "border-emerald-500/30 bg-emerald-500/[.06]"
                  : "border-line bg-surface"
              }`}
            >
              <div
                className={`flex items-center justify-center gap-1.5 text-sm font-semibold ${
                  auction.result.isUser ? "text-emerald-400" : "text-ink-2"
                }`}
              >
                {auction.result.isUser && <IconTrophy className="h-4 w-4" strokeWidth={1.5} />}
                {auction.result.isUser ? "You Won" : "Auction Ended"}
              </div>
              <div className="mt-1 text-xl font-bold text-ink">
                {formatUsd(auction.result.amount)}
              </div>
              <div className="text-xs text-ink-3">
                {auction.result.isUser ? "Winning bid" : `Won by ${auction.result.winnerName}`}
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs text-ink-3">Current Bid</div>
              <div
                className={`text-3xl font-semibold tracking-tight ${
                  auction.leader.isUser ? "text-accent" : "text-ink"
                }`}
              >
                {formatUsd(auction.currentBid)}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-ink-3">
                <span>{initialAuction.bidderCount} bidders</span>
                <span>·</span>
                <span>{auction.activity.length} bids</span>
                <span>·</span>
                <span className="text-red-400">{formatCountdown(auction.remaining)}</span>
              </div>
              {auction.leader.isUser && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-accent">
                  <IconCheck className="h-3 w-3" strokeWidth={2} /> You&apos;re the high bidder
                </div>
              )}
            </>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setCustomBid((v) => Math.max(auction.nextBid, v - bidStep))}
              disabled={auction.ended}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-lg text-ink-2 hover:bg-fill disabled:opacity-40"
              aria-label="Decrease bid"
            >
              −
            </button>
            <div className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-center text-sm font-semibold text-ink">
              {formatUsd(customBid)}
            </div>
            <button
              onClick={() => setCustomBid((v) => v + bidStep)}
              disabled={auction.ended}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-lg text-ink-2 hover:bg-fill disabled:opacity-40"
              aria-label="Increase bid"
            >
              +
            </button>
          </div>

          <button
            onClick={() => auction.placeBid(customBid)}
            disabled={auction.ended}
            className="mt-3 w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-base transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {auction.ended ? "Auction Ended" : "Place Bid"}
          </button>

          {auction.warning && (
            <p className="mt-2 text-[11px] text-amber-400">{auction.warning}</p>
          )}

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => auction.setAutoBid((v) => !v)}
              disabled={auction.ended}
              className={`rounded-lg border py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                auction.autoBid
                  ? "border-emerald-500/30 bg-emerald-500/[.08] text-emerald-400"
                  : "border-line text-ink-2 hover:bg-fill"
              }`}
            >
              {auction.autoBid && <IconCheck className="mr-1 inline h-3 w-3" strokeWidth={2} />}
              Auto Bid
            </button>
            <button
              onClick={() => setShowMaxInput((v) => !v)}
              disabled={auction.ended}
              className="rounded-lg border border-line py-2 text-xs font-medium text-ink-2 hover:bg-fill disabled:opacity-40"
            >
              Set Max
            </button>
          </div>

          {showMaxInput && !auction.ended && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                defaultValue={auction.maxAutoBid}
                min={auction.nextBid}
                max={dealer.maxBidPerVehicle}
                onBlur={(e) => {
                  auction.updateMaxAutoBid(Number(e.target.value) || auction.maxAutoBid);
                  setShowMaxInput(false);
                }}
                autoFocus
                className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-line-strong focus:outline-none"
              />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-3">
            <span>Minimum next bid: {formatUsd(auction.nextBid)}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-ink-3">
            Auto-bid max: {formatUsd(auction.maxAutoBid)}
          </div>
        </div>

        {/* Live Activity */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Live Activity</span>
            <span className="flex items-center gap-0.5 text-[11px] text-ink-3">
              All Bidders <IconChevronDown className="h-3 w-3" />
            </span>
          </div>
          <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {auction.activity.map((a) => (
              <li key={a.id} className="flex items-center gap-2.5 text-xs">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: a.isUser ? "#2563eb" : colorForName(a.bidder) }}
                >
                  {a.bidder[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate ${a.isUser ? "font-medium text-accent" : "text-ink-2"}`}
                  >
                    {a.isUser ? "You" : a.bidder}
                  </div>
                  <div className="text-[10px] text-ink-3">
                    {formatAgo(Math.max(0, Math.floor((auction.now - a.timestamp) / 1000)))}
                  </div>
                </div>
                <span className="font-semibold text-ink">{formatUsd(a.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vehicle Details */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-4">
          <div className="mb-3 text-sm font-medium text-ink">Vehicle Details</div>
          <Row label="Year" value={String(vehicle.year)} />
          <Row label="Make" value={vehicle.make} />
          <Row label="Model" value={vehicle.model} />
          <Row label="VIN" value="—" />
          <Row
            label="Mileage"
            value={vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : "—"}
          />
          <Row label="Title" value="Clean" valueClass="text-emerald-400" />
          <Row label="Location" value={vehicle.location ?? "—"} />
        </div>

        {/* Condition & AI Analysis */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-4">
          <div className="mb-3 text-sm font-medium text-ink">
            Condition &amp; AI Analysis
          </div>
          <div className="flex items-center gap-3">
            <ConditionGauge score={rec.conditionScore} />
            <div className="flex-1">
              <div className="text-xs text-ink-3">Overall Condition</div>
              <div className="mt-2 text-xs text-ink-3">Estimated Repair Cost</div>
              <div className="text-sm font-semibold text-amber-400">
                {formatUsd(rec.repairCostLow)} – {formatUsd(rec.repairCostHigh)}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-surface p-2.5">
            <div className="text-xs text-ink-3">Estimated Wholesale Value</div>
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
                      <Image
                        src={img.file}
                        alt={label}
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] text-ink-3">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="px-1 py-1 text-center text-[9px] text-ink-3">{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Insights */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Market Insights</span>
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-ink">
              {formatUsd(rec.estimatedMarketValue)}
            </span>
            <span className="text-[11px] text-ink-3">
              vs {formatUsd(insights.points[0].similar)} similar
            </span>
          </div>
          <MarketChart insights={insights} />
        </div>

        {/* Bidding Agents */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-8">
          <div className="mb-3 text-sm font-medium text-ink">
            Bidding Agents <span className="text-ink-3">(Simulated Dealerships)</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => (
              <div
                key={agent.key}
                className="rounded-xl border border-line bg-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: colorForName(agent.label) }}
                  >
                    {agent.key}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-ink">
                      {agent.label}
                    </div>
                    <div className="truncate text-[10px] text-ink-3">
                      {agent.strategyLabel}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
                  {agent.description}
                </p>
                <div className="mt-2 text-xs text-ink-3">Max Bid</div>
                <div className="text-sm font-semibold text-ink">
                  {formatUsd(agent.maxBid)}
                </div>
                <div className="mt-2">
                  <div className="h-1 overflow-hidden rounded-full bg-fill">
                    <div
                      className="h-full rounded-full bg-ink-3"
                      style={{ width: `${agent.aggressiveness}%` }}
                    />
                  </div>
                  <div className="mt-0.5 text-[10px] text-ink-3">
                    Aggressiveness {agent.aggressiveness}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your AI Assistant */}
        <div className="rounded-2xl border border-line bg-surface p-4 xl:col-span-4">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink">
            <IconSparkle className="h-4 w-4" strokeWidth={1.5} />
            Your AI Assistant
          </div>
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-ink-3">Recommended Max Bid</span>
            <span className="font-medium text-ink">
              {formatUsd(rec.recommendedMaxBid)}{" "}
              <span className="text-[10px] text-ink-3">Edit</span>
            </span>
          </div>
          <Row
            label="Expected Margin"
            value={`${formatUsd(rec.expectedMargin)} (${rec.expectedMarginPct}%)`}
            valueClass="text-emerald-400"
          />
          <Row label="Win Probability" value={`${rec.winProbability}%`} />
          <Row label="Risk Level" value={rec.riskLevel} valueClass={RISK_STYLE[rec.riskLevel]} />
          <p className="mt-3 rounded-lg bg-surface p-2.5 text-xs leading-relaxed text-ink-2">
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
      <span className="text-ink-3">{label}</span>
      <span className={`font-medium text-ink ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}
