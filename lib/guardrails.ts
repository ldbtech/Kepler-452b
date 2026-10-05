"use client";

// Client-only persistence for editable guardrail overrides — the same
// no-backend prototype pattern as lib/purchases.ts and lib/listings.ts.
// A dealer's base policy (lib/dealers.ts) is fixed; anything a dealer edits
// on /guardrails is layered on top here, per dealer id, and merged back
// into an ordinary Dealer object so every existing consumer (ranking,
// recommendations, live bidding) keeps working without special-casing.
import { useEffect, useState } from "react";
import { DEALERS, type CustomRule, type Dealer, type RiskTolerance } from "@/lib/dealers";

export type GuardrailOverrides = {
  maxBidPerVehicle?: number;
  totalBudgetCap?: number;
  riskTolerance?: RiskTolerance;
  interventionPreference?: string;
  askAboveAmount?: number;
  pausedAutonomy?: boolean;
  customRules?: CustomRule[];
};

export const AUTONOMY_LEVELS = [
  {
    value: "Notify only",
    title: "Notify only",
    description: "The AI surfaces opportunities but never places a bid on its own.",
  },
  {
    value: "Manual approval for all",
    title: "Ask for every bid",
    description: "Nothing goes out without your yes — slowest, safest.",
  },
  {
    value: "Ask above threshold",
    title: "Ask above a threshold",
    description: "Auto-bids under a dollar amount you set; asks above it.",
  },
  {
    value: "Ask for high-value bids",
    title: "Ask for high-value bids",
    description: "Auto-bids on routine inventory; flags anything unusually large.",
  },
  {
    value: "Only if flagged",
    title: "Fully autonomous",
    description: "Trades freely within your guardrails; only interrupts you for real exceptions.",
  },
] as const;

const KEY = "keplerv_guardrails_v1";

function readStore(): Record<string, GuardrailOverrides> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, GuardrailOverrides>) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, GuardrailOverrides>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // private browsing / quota exceeded — losing this is acceptable for a demo
  }
}

export function getGuardrailOverrides(dealerId: string): GuardrailOverrides {
  return readStore()[dealerId] ?? {};
}

export function saveGuardrailOverrides(dealerId: string, overrides: GuardrailOverrides) {
  const store = readStore();
  store[dealerId] = overrides;
  writeStore(store);
}

export function resetGuardrailOverrides(dealerId: string) {
  const store = readStore();
  delete store[dealerId];
  writeStore(store);
}

export function applyOverrides(base: Dealer, overrides: GuardrailOverrides): Dealer {
  return { ...base, ...overrides };
}

// Base dealer, with any saved overrides layered on. Pass straight into any
// component that already accepts a Dealer — nothing else needs to change.
export function getEffectiveDealer(dealer: Dealer): Dealer {
  return applyOverrides(dealer, getGuardrailOverrides(dealer.id));
}

// Reactive version for client components: returns the server-rendered
// dealer on first paint (keeping hydration honest), then swaps in the
// stored overrides once mounted — same deferred-localStorage-read pattern
// used by lib/reconstructSettings.ts and lib/theme.ts.
export function useEffectiveDealer(dealer: Dealer): Dealer {
  const [effective, setEffective] = useState(dealer);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEffective(getEffectiveDealer(dealer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealer.id]);
  return effective;
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  sedan: "SEDAN",
  suv: "SUV",
  pickup: "PICKUP",
  truck: "PICKUP",
  van: "VAN",
  "box truck": "MEDIUM DUTY/BOX TRUCKS",
};

// Lightweight keyword parse of a freeform guardrail instruction into a
// structured rule — the same "deterministic heuristic standing in for a
// real model" approach used by LiveChat's buildReply. Anything it can't
// confidently parse is kept as an advisory note instead of silently
// dropped, and said so in the UI.
export function parseFreeformRule(text: string): CustomRule {
  const lower = text.toLowerCase();
  const id = `rule-${Date.now()}`;
  const negated = /\b(never|no|avoid|don'?t|exclude)\b/.test(lower);
  const capMatch = lower.match(/\$?([\d,]{3,7})/);

  for (const make of DEALERS.flatMap((d) => d.focusMakes)) {
    if (lower.includes(make.toLowerCase())) {
      if (negated) {
        return { id, kind: "exclude-make", make, label: `Never bid on ${make}` };
      }
    }
  }

  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!lower.includes(keyword)) continue;
    if (negated && !capMatch) {
      return { id, kind: "exclude-category", category, label: `Never bid on ${category.toLowerCase()}` };
    }
    if (capMatch) {
      const amount = Number(capMatch[1].replace(/,/g, ""));
      if (amount > 0) {
        return {
          id,
          kind: "cap-category",
          category,
          capAmount: amount,
          label: `Cap ${category.toLowerCase()} at $${amount.toLocaleString()}`,
        };
      }
    }
  }

  return { id, kind: "note", label: text.trim() };
}
