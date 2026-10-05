"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dealer } from "@/lib/dealers";
import type { Vehicle } from "@/lib/vehicles";
import { getOwnerListing } from "@/lib/listings";
import AuctionDetail from "@/components/AuctionDetail";
import { IconCar } from "@/components/icons";

// Owner listings live only in this browser's localStorage (see
// lib/listings.ts), so — unlike the scraped /auctions/[lotNumber] route —
// this can't be resolved on the server. We look it up after mount instead.
export default function OwnerListingDetail({
  dealer,
  lotNumber,
}: {
  dealer: Dealer;
  lotNumber: number;
}) {
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVehicle(getOwnerListing(lotNumber) ?? null);
  }, [lotNumber]);

  if (vehicle === undefined) return null;

  if (vehicle === null) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fill text-ink-3">
          <IconCar className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-semibold text-ink">Listing not found</h1>
        <p className="max-w-sm text-sm text-ink-3">
          This listing isn&apos;t saved in this browser — owner listings are a prototype
          feature stored locally, so they&apos;re only visible on the device that created
          them.
        </p>
        <Link
          href="/sell"
          className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-base hover:opacity-90"
        >
          List a car
        </Link>
      </div>
    );
  }

  return <AuctionDetail vehicle={vehicle} dealer={dealer} />;
}
