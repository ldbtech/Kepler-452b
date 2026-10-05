import type { Vehicle } from "@/lib/vehicles";
import type { CustomRule, Dealer } from "@/lib/dealers";
import { getAiRecommendation, type AiRecommendation } from "@/lib/demo";

// A dealer-taught rule (see lib/guardrails.ts) that excludes this vehicle
// outright — make or category the dealer never wants to bid on.
export function matchingExclusion(vehicle: Vehicle, dealer: Dealer): CustomRule | undefined {
  return dealer.customRules?.find(
    (rule) =>
      (rule.kind === "exclude-make" && rule.make === vehicle.make) ||
      (rule.kind === "exclude-category" && rule.category === vehicle.vehicleCategory),
  );
}

function matchingCap(vehicle: Vehicle, dealer: Dealer): CustomRule | undefined {
  return dealer.customRules?.find(
    (rule) => rule.kind === "cap-category" && rule.category === vehicle.vehicleCategory,
  );
}

// Clamps the generic AI recommendation to this dealer's own guardrail —
// their numeric max bid, plus any custom rules they've taught the AI — so
// the "Recommended max bid" never contradicts the policy shown right below
// it.
export function getDealerAiRecommendation(vehicle: Vehicle, dealer: Dealer): AiRecommendation {
  const rec = getAiRecommendation(vehicle);

  const exclusion = matchingExclusion(vehicle, dealer);
  if (exclusion) {
    return {
      ...rec,
      recommendedMaxBid: 0,
      expectedMargin: 0,
      expectedMarginPct: 0,
      riskLevel: "High",
      confidence: 95,
      winProbability: 0,
      reasoning: `Excluded by your guardrail: "${exclusion.label}". The AI will not bid on this vehicle.`,
    };
  }

  const cap = matchingCap(vehicle, dealer);
  const ceiling = cap ? Math.min(dealer.maxBidPerVehicle, cap.capAmount ?? dealer.maxBidPerVehicle) : dealer.maxBidPerVehicle;
  if (rec.recommendedMaxBid <= ceiling) return rec;

  const recommendedMaxBid = ceiling;
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
    reasoning: cap
      ? `${rec.reasoning} Capped to $${recommendedMaxBid.toLocaleString()} by your rule: "${cap.label}".`
      : `${rec.reasoning} Capped to your $${recommendedMaxBid.toLocaleString()} max bid guardrail.`,
  };
}

// True when the AI's unclamped recommendation wanted to bid more than this
// dealer's guardrail allows — i.e. a real decision the guardrail suppressed,
// worth surfacing for human review rather than silently capping forever. An
// outright exclusion isn't ambiguous like that — the dealer already settled
// it — so it's not an escalation.
export function wasCappedByGuardrail(vehicle: Vehicle, dealer: Dealer): boolean {
  if (matchingExclusion(vehicle, dealer)) return false;
  return getAiRecommendation(vehicle).recommendedMaxBid > dealer.maxBidPerVehicle;
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
  const exclusion = matchingExclusion(vehicle, dealer);
  if (exclusion) {
    return { vehicle, score: 0, matchReasons: [`Excluded by your rule: "${exclusion.label}"`] };
  }

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
