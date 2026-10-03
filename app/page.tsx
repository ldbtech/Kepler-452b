import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getVehicles } from "@/lib/vehicles";
import { formatCountdown, formatUsd, getAuctionState } from "@/lib/demo";

export default function Home() {
  const vehicles = getVehicles();

  return (
    <AppShell>
      <div className="px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-100">Live Auctions</h1>
            <p className="text-sm text-neutral-500">
              AI is monitoring {vehicles.length} vehicles for you
            </p>
          </div>
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
          <div className="flex flex-col gap-3">
            {vehicles.map((v) => {
              const cover =
                v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
              const auction = getAuctionState(v);
              return (
                <Link
                  key={v.lotNumber}
                  href={`/auctions/${v.lotNumber}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.02] p-3 transition-colors hover:border-white/20 hover:bg-white/[.04]"
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
                    <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold">
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
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-red-400">
                    <span>⏱</span>
                    {formatCountdown(auction.secondsRemaining)}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <span>👤</span>
                    {auction.bidderCount} bidders
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                      Current bid
                    </div>
                    <div className="font-semibold text-emerald-400">
                      {formatUsd(auction.currentBid)}
                    </div>
                  </div>

                  <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                    Join Auction
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
