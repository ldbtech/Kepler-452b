"use client";

// Client-only persistence for owner-submitted listings — the direct-owner
// counterpart to the scraped auction inventory in data/vehicles.json. There
// is no backend, so a listing created here is only ever visible in the
// browser that created it (same accepted prototype limit as purchases.ts).
// Each listing is built as a full Vehicle so it can flow through the exact
// same AI recommendation, ranking, and live-bidding engine as scraped lots.
import type { MechanicalIssue, Vehicle } from "@/lib/vehicles";

export type NewListingInput = {
  sellerName: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  color: string;
  odometer: number | null;
  location: string;
  vehicleCategory: string;
  bodyStyle: string;
  description: string;
  images: string[];
  mechanicalIssues: MechanicalIssue[];
  pricingMode: "manual" | "ai";
  minBid?: number;
};

const KEY = "keplerv_owner_listings_v1";

function readAll(): Vehicle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Vehicle[]) : [];
  } catch {
    return [];
  }
}

function writeAll(all: Vehicle[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    throw new Error(
      e instanceof DOMException && e.name === "QuotaExceededError"
        ? "This browser's storage is full — try removing a few photos and listing again."
        : "Couldn't save this listing in your browser.",
    );
  }
}

export function getOwnerListings(): Vehicle[] {
  return readAll();
}

export function getOwnerListing(lotNumber: number): Vehicle | undefined {
  return readAll().find((v) => v.lotNumber === lotNumber);
}

export function createOwnerListing(input: NewListingInput): Vehicle {
  const lotNumber = Date.now();
  const images = input.images.map((file, i) => ({ label: `PHOTO${i + 1}`, file }));

  const vehicle: Vehicle = {
    lotNumber,
    year: input.year,
    make: input.make.trim().toUpperCase(),
    model: input.model.trim().toUpperCase(),
    trim: input.trim.trim() || null,
    color: input.color.trim() || null,
    condition:
      input.mechanicalIssues.length > 0
        ? "Owner disclosed issues — see Mechanical Issues"
        : "Owner reports no known mechanical issues",
    damage: input.mechanicalIssues.length > 0 ? "OWNER REPORTED ISSUES" : "NORMAL WEAR",
    odometer: input.odometer,
    location: input.location.trim() || null,
    bodyStyle: input.bodyStyle || null,
    vehicleCategory: input.vehicleCategory || null,
    images,
    rotationOrder: images.slice(0, 4).map((img) => img.label),
    fetchedAt: new Date().toISOString(),
    source: "owner",
    sellerName: input.sellerName.trim() || "Private seller",
    description: input.description.trim(),
    mechanicalIssues: input.mechanicalIssues,
    ownerPricingMode: input.pricingMode,
    ownerMinBid: input.pricingMode === "manual" ? input.minBid : undefined,
  };

  const all = readAll();
  all.unshift(vehicle);
  writeAll(all);
  return vehicle;
}

// Seller control from the listing detail page: sell the moment a bid
// reaches this amount, instead of waiting out the clock. `amount` of
// `undefined` turns auto-accept back off.
export function updateOwnerAutoAccept(lotNumber: number, amount: number | undefined) {
  const all = readAll();
  const next = all.map((v) =>
    v.lotNumber === lotNumber ? { ...v, ownerAutoAcceptAt: amount } : v,
  );
  writeAll(next);
}
