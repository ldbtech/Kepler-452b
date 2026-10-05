import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getVehicles } from "@/lib/vehicles";
import { getCurrentDealer } from "@/lib/session";
import { getDealerAiRecommendation, rankVehiclesForDealer } from "@/lib/recommend";
import { formatUsd } from "@/lib/demo";
import { IconHeart } from "@/components/icons";

export default async function WatchlistPage() {
  const dealer = await getCurrentDealer();
  const ranked = rankVehiclesForDealer(getVehicles(), dealer);
  // Deterministic "starred" subset for the demo: top matches this dealer
  // would plausibly be tracking.
  const watchlist = ranked.filter((v) => v.score >= 65).slice(0, 5);

  return (
    <AppShell dealer={dealer}>
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="text-lg font-semibold text-ink">Watchlist</h1>
        <p className="text-sm text-ink-3">
          {watchlist.length} vehicles {dealer.name} is tracking
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlist.map(({ vehicle: v }) => {
            const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
            const rec = getDealerAiRecommendation(v, dealer);
            return (
              <Link
                key={v.lotNumber}
                href={`/auctions/${v.lotNumber}`}
                className="overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong"
              >
                <div className="relative aspect-[4/3] bg-neutral-900">
                  {cover && (
                    <Image
                      src={cover.file}
                      alt={`${v.year} ${v.make} ${v.model}`}
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  )}
                  <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-red-400 backdrop-blur">
                    <IconHeart className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  </span>
                </div>
                <div className="p-3">
                  <h2 className="truncate text-sm font-medium text-ink">
                    {v.year} {v.make} {v.model}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-3">
                    Recommended max {formatUsd(rec.recommendedMaxBid)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {watchlist.length === 0 && (
          <p className="mt-6 text-sm text-ink-3">
            No strong matches in the current batch — check Live Auctions for the full list.
          </p>
        )}
      </div>
    </AppShell>
  );
}
