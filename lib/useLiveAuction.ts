"use client";

import { useEffect, useRef, useState } from "react";
import type { Dealer } from "@/lib/dealers";
import type { AuctionState, BiddingAgent } from "@/lib/demo";
import { recordPurchase } from "@/lib/purchases";

export type LiveBidEntry = {
  id: number;
  bidder: string;
  amount: number;
  isUser: boolean;
  timestamp: number;
};

export type AuctionResult = { winnerName: string; amount: number; isUser: boolean } | null;

function weightedPick(candidates: BiddingAgent[]): BiddingAgent {
  const total = candidates.reduce((s, a) => s + a.aggressiveness, 0);
  let r = Math.random() * total;
  for (const c of candidates) {
    r -= c.aggressiveness;
    if (r <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

export function useLiveAuction({
  dealer,
  lotNumber,
  initial,
  agents,
  guardrailMax,
  suggestedMax,
  forceAutoBidOff,
  sellerAutoAcceptAt,
}: {
  dealer: Dealer;
  lotNumber: number;
  initial: AuctionState;
  agents: BiddingAgent[];
  guardrailMax: number;
  suggestedMax: number;
  // Circuit breaker: when true, this dealer's AI never auto-bids here,
  // regardless of the toggle below — set from dealer.pausedAutonomy.
  forceAutoBidOff?: boolean;
  // Seller control: end the auction the moment the bid reaches this
  // amount, instead of waiting out the clock — set from a listing's
  // ownerAutoAcceptAt.
  sellerAutoAcceptAt?: number;
}) {
  const increment = Math.max(50, Math.round((initial.nextBid * 0.04) / 10) * 10) || 50;

  const [remaining, setRemaining] = useState(initial.secondsRemaining);
  const [currentBid, setCurrentBid] = useState(initial.currentBid);
  const [nextBid, setNextBid] = useState(initial.nextBid);
  const [leader, setLeader] = useState<{ name: string; isUser: boolean }>({
    name: initial.activity[0]?.bidder ?? "—",
    isUser: false,
  });
  const [activity, setActivity] = useState<LiveBidEntry[]>(() =>
    initial.activity.map((a, i) => ({
      id: i,
      bidder: a.bidder,
      amount: a.amount,
      isUser: false,
      timestamp: Date.now() - a.secondsAgo * 1000,
    })),
  );
  const [autoBid, setAutoBid] = useState(!forceAutoBidOff);
  const [maxAutoBid, setMaxAutoBid] = useState(Math.min(suggestedMax, guardrailMax));
  const [ended, setEnded] = useState(false);
  const [result, setResult] = useState<AuctionResult>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const endedRef = useRef(false);
  const nextId = useRef(initial.activity.length);

  // 1s countdown + "time ago" clock
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setRemaining((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !endedRef.current) {
      endedRef.current = true;
      setEnded(true);
    }
  }, [remaining]);

  useEffect(() => {
    if (sellerAutoAcceptAt && currentBid >= sellerAutoAcceptAt && !endedRef.current) {
      endedRef.current = true;
      setEnded(true);
    }
  }, [currentBid, sellerAutoAcceptAt]);

  useEffect(() => {
    if (ended && !result) {
      // Persists to localStorage (an external system) and must run exactly
      // once on the ended->true transition, so this has to stay an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult({ winnerName: leader.name, amount: currentBid, isUser: leader.isUser });
      if (leader.isUser) {
        recordPurchase({ lotNumber, dealerId: dealer.id, finalPrice: currentBid, wonAt: Date.now() });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  function pushBid(bidder: string, amount: number, isUser: boolean) {
    setActivity((prev) => [
      { id: nextId.current++, bidder, amount, isUser, timestamp: Date.now() },
      ...prev,
    ]);
    setCurrentBid(amount);
    setNextBid(amount + increment);
    setLeader({ name: bidder, isUser });
  }

  // Self-perpetuating simulation: reschedules whenever the leader/auto-bid
  // settings change, driven by this single effect rather than manual timers.
  useEffect(() => {
    if (ended) return;
    const delay = 1800 + Math.random() * 2400;
    const t = setTimeout(() => {
      if (endedRef.current) return;

      if (leader.isUser) {
        if (Math.random() < 0.6) {
          const candidates = agents.filter((a) => a.maxBid > currentBid);
          if (candidates.length > 0) {
            const chosen = weightedPick(candidates);
            const amt = Math.min(
              chosen.maxBid,
              Math.round((nextBid + Math.random() * increment) / 10) * 10,
            );
            if (amt > currentBid) pushBid(chosen.label, amt, false);
          }
        }
      } else if (autoBid && !forceAutoBidOff && nextBid <= maxAutoBid) {
        pushBid(dealer.name, nextBid, true);
      } else if (Math.random() < 0.4) {
        const candidates = agents.filter(
          (a) => a.maxBid > currentBid && a.label !== leader.name,
        );
        if (candidates.length > 0) {
          const chosen = weightedPick(candidates);
          const amt = Math.min(
            chosen.maxBid,
            Math.round((nextBid + Math.random() * increment) / 10) * 10,
          );
          if (amt > currentBid) pushBid(chosen.label, amt, false);
        }
      }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leader, autoBid, maxAutoBid, ended, currentBid, nextBid]);

  function placeBid(amount: number) {
    if (ended) return;
    let amt = Math.round(amount / 10) * 10;
    if (amt < nextBid) amt = nextBid;
    if (amt > guardrailMax) {
      amt = guardrailMax;
      setWarning(`Capped to your guardrail max bid of $${guardrailMax.toLocaleString()}`);
      setTimeout(() => setWarning(null), 3500);
    }
    if (amt <= currentBid) return;
    pushBid(dealer.name, amt, true);
  }

  function updateMaxAutoBid(amount: number) {
    setMaxAutoBid(Math.max(nextBid, Math.min(amount, guardrailMax)));
  }

  return {
    remaining,
    currentBid,
    nextBid,
    leader,
    activity,
    autoBid,
    setAutoBid,
    maxAutoBid,
    updateMaxAutoBid,
    ended,
    result,
    warning,
    now,
    placeBid,
  };
}
