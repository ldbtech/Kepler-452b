// Everything here is presentation-layer simulation for the pitch demo: there
// is no live auction feed and no trained pricing/repair-cost model yet. Each
// value is deterministically derived from the real scraped vehicle (so the
// UI is stable across renders/pages) using simple, explainable heuristics —
// not a claim of real bidding data or ML output.
import type { Vehicle } from "@/lib/vehicles";

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(vehicle: Vehicle) {
  return mulberry32(seedFromString(String(vehicle.lotNumber)));
}

const DAMAGE_RISK: Record<string, "Low" | "Moderate" | "High"> = {
  "FRONT END": "Moderate",
  "REAR END": "Moderate",
  "SIDE": "Moderate",
  "ALL OVER": "High",
  "BURN": "High",
  "FLOOD": "High",
  "UNDERCARRIAGE": "High",
  "NORMAL WEAR": "Low",
  "MECHANICAL": "Low",
};

export type AgentStep = { label: string; done: boolean };

export type AiRecommendation = {
  estimatedMarketValue: number;
  recommendedMaxBid: number;
  expectedMargin: number;
  expectedMarginPct: number;
  riskLevel: "Low" | "Moderate" | "High";
  confidence: number;
  reasoning: string;
  comparableCount: number;
};

export type BidActivity = { bidder: string; amount: number; secondsAgo: number; isAi: boolean };

export type AuctionState = {
  currentBid: number;
  nextBid: number;
  bidderCount: number;
  secondsRemaining: number;
  lane: number;
  auctionId: string;
  activity: BidActivity[];
};

const DEALER_NAMES = [
  "AutoBid AI",
  "Dealer Pro",
  "BlueLine Motors",
  "Coastal Auto",
  "Heartland Dealer",
  "Metro Cars",
  "Ridgeway Auto",
  "Summit Motors",
  "Valley Auto",
];

function baseValue(vehicle: Vehicle, rng: () => number): number {
  const age = Math.max(0, 2026 - vehicle.year);
  const odo = vehicle.odometer ?? 90000;
  // Rough, explainable starting point — not a real valuation model.
  // Multiplicative depreciation (vs. linear) avoids collapsing toward zero
  // for older/high-mileage lots, which produced nonsensical bid numbers.
  const ageFactor = Math.pow(0.92, age);
  const mileageFactor = Math.max(0.25, Math.min(1, 1 - odo / 280000));
  let value = 28000 * ageFactor * mileageFactor;
  value *= 0.85 + rng() * 0.3;
  return Math.max(2000, Math.round(value / 50) * 50);
}

export function getAiRecommendation(vehicle: Vehicle): AiRecommendation {
  const rng = rngFor(vehicle);
  const marketValue = baseValue(vehicle, rng);

  const damageKey = Object.keys(DAMAGE_RISK).find((k) =>
    (vehicle.damage ?? "").toUpperCase().includes(k),
  );
  const riskLevel = damageKey ? DAMAGE_RISK[damageKey] : "Moderate";

  const repairCostPct = riskLevel === "High" ? 0.4 : riskLevel === "Moderate" ? 0.22 : 0.08;
  const repairCost = Math.round((marketValue * repairCostPct) / 50) * 50;
  const targetProfitPct = 0.15;

  const recommendedMaxBid = Math.max(
    Math.round(marketValue * 0.2),
    Math.round((marketValue * (1 - targetProfitPct) - repairCost) / 50) * 50,
  );
  const expectedMargin = marketValue - recommendedMaxBid - repairCost;
  const expectedMarginPct = Math.max(
    5,
    Math.min(60, Math.round((expectedMargin / marketValue) * 100)),
  );

  const confidence = Math.round(
    (riskLevel === "Low" ? 90 : riskLevel === "Moderate" ? 82 : 68) + rng() * 6,
  );
  const comparableCount = 6 + Math.floor(rng() * 14);

  const reasoning =
    riskLevel === "High"
      ? `Damage profile ("${vehicle.damage ?? "unknown"}") carries meaningful repair uncertainty, so I'm bidding conservatively against ${comparableCount} comparable listings.`
      : riskLevel === "Moderate"
        ? `Repair scope looks contained for a "${vehicle.damage ?? "reported"}" loss, and similar vehicles are trading near this range across ${comparableCount} comparables.`
        : `Minimal reported damage and consistent odometer history against ${comparableCount} comparables support a more confident bid.`;

  return {
    estimatedMarketValue: marketValue,
    recommendedMaxBid: Math.round(recommendedMaxBid / 50) * 50,
    expectedMargin: Math.round(expectedMargin / 50) * 50,
    expectedMarginPct,
    riskLevel,
    confidence: Math.min(97, confidence),
    reasoning,
    comparableCount,
  };
}

export function getAgentSteps(): AgentStep[] {
  return [
    { label: "Inspection analyzed", done: true },
    { label: "Repair estimate prepared", done: true },
    { label: "Market comps matched", done: true },
    { label: "Bidding strategy active", done: true },
  ];
}

export function getAuctionState(
  vehicle: Vehicle,
  recommendedMaxBidOverride?: number,
): AuctionState {
  const rng = rngFor(vehicle);
  const recommendedMaxBid =
    recommendedMaxBidOverride ?? getAiRecommendation(vehicle).recommendedMaxBid;
  const bidderCount = 6 + Math.floor(rng() * 24);
  const lane = 1 + Math.floor(rng() * 8);
  const auctionId = `AUC-${90000 + Math.floor(rng() * 9999)}`;
  const secondsRemaining = 20 + Math.floor(rng() * 400);

  const steps = 3 + Math.floor(rng() * 5);
  const increment = Math.max(50, Math.round((recommendedMaxBid * 0.04) / 10) * 10);
  let bid = Math.round(recommendedMaxBid * 0.35);
  const bidCeiling = Math.round(recommendedMaxBid * 0.92);
  const activity: BidActivity[] = [];
  let elapsed = 0;
  for (let i = 0; i < steps; i++) {
    const name = DEALER_NAMES[Math.floor(rng() * DEALER_NAMES.length)];
    bid = Math.min(bidCeiling, bid + Math.round((increment * (0.6 + rng())) / 10) * 10);
    elapsed += Math.floor(5 + rng() * 120);
    activity.push({ bidder: name, amount: bid, secondsAgo: elapsed, isAi: name === "AutoBid AI" });
  }
  activity.reverse();

  return {
    currentBid: bid,
    nextBid: bid + 200,
    bidderCount,
    secondsRemaining,
    lane,
    auctionId,
    activity,
  };
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
