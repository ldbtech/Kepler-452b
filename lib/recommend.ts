import type { Vehicle } from "@/lib/vehicles";
import type { Dealer } from "@/lib/dealers";
import { getAiRecommendation, type AiRecommendation } from "@/lib/demo";

// Clamps the generic AI recommendation to this dealer's own guardrail, so
// the "Recommended max bid" never contradicts their stated max bid per
// vehicle shown right below it.
export function getDealerAiRecommendation(vehicle: Vehicle, dealer: Dealer): AiRecommendation {
  const rec = getAiRecommendation(vehicle);
  if (rec.recommendedMaxBid <= dealer.maxBidPerVehicle) return rec;

  const recommendedMaxBid = dealer.maxBidPerVehicle;
  const expectedMargin = rec.estimatedMarketValue - recommendedMaxBid;
  const expectedMarginPct = Math.max(
    0,
    Math.min(60, Math.round((expectedMargin / rec.estimatedMarketValue) * 100)),
  );

  return {
    ...rec,
    recommendedMaxBid,
    expectedMargin,
    expectedMarginPct,
    confidence: Math.max(40, rec.confidence - 15),
    reasoning: `${rec.reasoning} Capped to your $${recommendedMaxBid.toLocaleString()} max bid guardrail.`,
  };
}

export type ScoredVehicle = {
  vehicle: Vehicle;
  score: number;
  matchReasons: string[];
};

const RISK_RANK: Record<string, number> = { Low: 0, Moderate: 1, High: 2 };
const DEALER_RISK_RANK: Record<string, number> = {
  Low: 0,
  "Low – Moderate": 0.5,
  Moderate: 1,
  "Moderate – High": 1.5,
};

export function scoreVehicleForDealer(vehicle: Vehicle, dealer: Dealer): ScoredVehicle {
  const rec = getAiRecommendation(vehicle);
  let score = 50;
  const reasons: string[] = [];

  if (dealer.focusMakes.includes(vehicle.make)) {
    score += 25;
    reasons.push(`${vehicle.make} matches your buying focus`);
  }
  if (vehicle.vehicleCategory && dealer.focusCategories.includes(vehicle.vehicleCategory)) {
    score += 20;
    reasons.push(`${vehicle.vehicleCategory.toLowerCase()} fits your inventory mix`);
  }

  if (rec.recommendedMaxBid <= dealer.maxBidPerVehicle) {
    score += 15;
    reasons.push("within your max bid per vehicle");
  } else {
    score -= 20;
  }

  const riskGap = RISK_RANK[rec.riskLevel] - DEALER_RISK_RANK[dealer.riskTolerance];
  if (riskGap <= 0) {
    score += 10;
  } else {
    score -= riskGap * 15;
  }

  if (reasons.length === 0) {
    reasons.push("close match on price and condition");
  }

  return {
    vehicle,
    score: Math.max(0, Math.min(100, Math.round(score))),
    matchReasons: reasons.slice(0, 2),
  };
}

export function rankVehiclesForDealer(vehicles: Vehicle[], dealer: Dealer): ScoredVehicle[] {
  return vehicles
    .map((v) => scoreVehicleForDealer(v, dealer))
    .sort((a, b) => b.score - a.score);
}
