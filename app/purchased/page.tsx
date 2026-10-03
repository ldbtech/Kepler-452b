import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getVehicles } from "@/lib/vehicles";
import { getCurrentDealer } from "@/lib/session";
import { getDealerAiRecommendation, rankVehiclesForDealer } from "@/lib/recommend";
import { formatUsd } from "@/lib/demo";

export default async function PurchasedPage() {
  const dealer = await getCurrentDealer();
  const ranked = rankVehiclesForDealer(getVehicles(), dealer);
  // Deterministic fake purchase history for the demo: this dealer's two
  // best-matching vehicles, "won" slightly below their AI max bid.
  const purchased = ranked.slice(0, 2);

  return (
    <AppShell dealer={dealer}>
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="text-lg font-semibold text-neutral-100">Purchased</h1>
        <p className="text-sm text-neutral-500">
          Auctions {dealer.name} has won
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {purchased.map(({ vehicle: v }, i) => {
            const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
            const rec = getDealerAiRecommendation(v, dealer);
            const finalPrice = Math.round((rec.recommendedMaxBid * (0.82 - i * 0.05)) / 10) * 10;
            return (
              <Link
                key={v.lotNumber}
                href={`/auctions/${v.lotNumber}`}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.02] p-3 hover:border-white/20"
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
                  {cover && (
                    <Image
                      src={cover.file}
                      alt={`${v.year} ${v.make} ${v.model}`}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    🏆 You Won
                  </div>
                  <h2 className="truncate font-medium text-neutral-100">
                    {v.year} {v.make} {v.model} {v.trim ?? ""}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Your max bid {formatUsd(rec.recommendedMaxBid)} · AI confidence{" "}
                    {rec.confidence}%
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    Final price
                  </div>
                  <div className="font-semibold text-emerald-400">{formatUsd(finalPrice)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
