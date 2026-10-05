import vehiclesData from "@/data/vehicles.json";

export type VehicleImage = { label: string; file: string; depthFile?: string };

export const MECHANICAL_ISSUE_LOCATIONS = [
  "Engine",
  "Transmission",
  "Electrical",
  "Brakes & Suspension",
  "Body & Paint",
  "Interior",
  "Exhaust",
  "Other",
] as const;

export type MechanicalIssueLocation = (typeof MECHANICAL_ISSUE_LOCATIONS)[number];

export type MechanicalIssue = {
  id: string;
  location: MechanicalIssueLocation;
  title: string;
  description: string;
  photo?: string;
};

export type Vehicle = {
  lotNumber: number;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  condition: string | null;
  damage: string | null;
  odometer: number | null;
  location: string | null;
  bodyStyle: string | null;
  vehicleCategory: string | null;
  images: VehicleImage[];
  rotationOrder: string[];
  fetchedAt: string;
  // Present only for vehicles listed directly by an owner through /sell
  // (stored client-side in localStorage — see lib/listings.ts) rather than
  // scraped auction inventory. Scraped vehicles simply omit these fields.
  source?: "auction" | "owner";
  sellerName?: string;
  description?: string;
  mechanicalIssues?: MechanicalIssue[];
  ownerPricingMode?: "manual" | "ai";
  ownerMinBid?: number;
  // Seller control (see /listings/[lotNumber]): end the auction the moment
  // a bid reaches this amount, rather than waiting out the clock.
  ownerAutoAcceptAt?: number;
};

export function getVehicles(): Vehicle[] {
  return vehiclesData as Vehicle[];
}

export function getVehicle(lotNumber: number): Vehicle | undefined {
  return getVehicles().find((v) => v.lotNumber === lotNumber);
}
