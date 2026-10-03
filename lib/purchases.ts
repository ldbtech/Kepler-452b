"use client";

// Client-only persistence for the demo: when a dealer wins a live auction in
// this browser, we record it here so the Purchased page can show it as a
// real result. There is no backend, so this never syncs across devices —
// that's an accepted limit of a no-backend prototype, not an oversight.
export type PurchaseRecord = {
  lotNumber: number;
  dealerId: string;
  finalPrice: number;
  wonAt: number;
};

const KEY = "keplerv_purchases_v1";

function readAll(): PurchaseRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PurchaseRecord[]) : [];
  } catch {
    return [];
  }
}

export function getPurchasesForDealer(dealerId: string): PurchaseRecord[] {
  return readAll().filter((p) => p.dealerId === dealerId);
}

export function hasPurchase(dealerId: string, lotNumber: number): boolean {
  return readAll().some((p) => p.dealerId === dealerId && p.lotNumber === lotNumber);
}

export function recordPurchase(record: PurchaseRecord) {
  if (typeof window === "undefined") return;
  try {
    const all = readAll();
    if (all.some((p) => p.dealerId === record.dealerId && p.lotNumber === record.lotNumber)) {
      return;
    }
    all.push(record);
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // private browsing / quota exceeded — losing this is acceptable for a demo
  }
}
