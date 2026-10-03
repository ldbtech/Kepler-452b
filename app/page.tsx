import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LiveCountdown from "@/components/LiveCountdown";
import { getVehicles } from "@/lib/vehicles";
import { formatUsd, getAuctionState } from "@/lib/demo";
import {
  getDealerAiRecommendation,
  rankVehiclesForDealer,
  type ScoredVehicle,
} from "@/lib/recommend";
import type { Dealer } from "@/lib/dealers";
import { getCurrentDealer } from "@/lib/session";
import { IconSparkle, IconUsers } from "@/components/icons";

export default async function Home() {
  const dealer = await getCurrentDealer();
  const vehicles = getVehicles();
  const ranked = rankVehiclesForDealer(vehicles, dealer);
  const recommended = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <AppShell dealer={dealer}>
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-neutral-100">Live Auctions</h1>
          <p className="text-sm text-neutral-500">
            AI is monitoring {vehicles.length} vehicles for {dealer.name}
          </p>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-zinc-500">
            No vehicles loaded — run{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
              npm run fetch:copart
            </code>{" "}
            then{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
              npm run gen:depth
            </code>
            .
          </p>
        ) : (
          <>
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-neutral-300">
                <IconSparkle className="h-4 w-4" strokeWidth={1.5} />
                Recommended for {dealer.name}
              </div>
              <div className="flex flex-col gap-3">
                {recommended.map((item) => (
                  <AuctionRow key={item.vehicle.lotNumber} item={item} dealer={dealer} highlight />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 text-sm font-medium text-neutral-500">
                Other live auctions
              </div>
              <div className="flex flex-col gap-3">
                {rest.map((item) => (
                  <AuctionRow key={item.vehicle.lotNumber} item={item} dealer={dealer} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function AuctionRow({
  item,
  dealer,
  highlight,
}: {
  item: ScoredVehicle;
  dealer: Dealer;
  highlight?: boolean;
}) {
  const v = item.vehicle;
  const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
  const rec = getDealerAiRecommendation(v, dealer);
  const auction = getAuctionState(v, rec.recommendedMaxBid);

  return (
    <Link
      href={`/auctions/${v.lotNumber}`}
      className={`group flex flex-col gap-3 rounded-2xl border p-3 transition-colors sm:flex-row sm:items-center ${
        highlight
          ? "border-white/[.1] bg-white/[.03] hover:border-white/20"
          : "border-white/[.08] bg-white/[.015] hover:border-white/[.16] hover:bg-white/[.03]"
      }`}
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-neutral-900 sm:h-20 sm:w-28">
        {cover && (
          <Image
            src={cover.file}
            alt={`${v.year} ${v.make} ${v.model}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 112px"
          />
        )}
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <span className="h-1 w-1 rounded-full bg-white" />
          LIVE
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Lane {auction.lane}</span>
          <span>·</span>
          <span>#{auction.auctionId}</span>
        </div>
        <h2 className="truncate font-medium text-neutral-100">
          {v.year} {v.make} {v.model} {v.trim ?? ""}
        </h2>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
          <span>{v.odometer ? `${v.odometer.toLocaleString()} mi` : "— mi"}</span>
          <span>{v.condition ?? "—"}</span>
          <span>{v.location ?? "—"}</span>
        </div>
        {highlight && (
          <div className="mt-1 text-xs text-neutral-400">{item.matchReasons.join(" · ")}</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:contents">
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-red-400">
            <LiveCountdown initialSeconds={auction.secondsRemaining} />
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <IconUsers className="h-3.5 w-3.5" />
            {auction.bidderCount}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Current bid
          </div>
          <div className="font-semibold text-neutral-100">{formatUsd(auction.currentBid)}</div>
        </div>
      </div>

      <span className="rounded-lg bg-neutral-100 px-4 py-2 text-center text-sm font-medium text-neutral-900 transition-colors group-hover:bg-white">
        Join Auction
      </span>
    </Link>
  );
}
