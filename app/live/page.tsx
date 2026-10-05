import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LiveCountdown from "@/components/LiveCountdown";
import { getVehicles } from "@/lib/vehicles";
import { formatUsd, getAuctionState } from "@/lib/demo";
import { getDealerAiRecommendation, rankVehiclesForDealer, type ScoredVehicle } from "@/lib/recommend";
import type { Dealer } from "@/lib/dealers";
import { getCurrentDealer } from "@/lib/session";
import { IconSparkle, IconUsers } from "@/components/icons";

export default async function Home() {
  const dealer = await getCurrentDealer();
  const vehicles = getVehicles();
  const ranked = rankVehiclesForDealer(vehicles, dealer);
  const [featured, ...others] = ranked;
  const recommended = others.slice(0, 2);
  const rest = others.slice(2);
  const strongMatches = ranked.filter((v) => v.score >= 65).length;
  const avgConfidence = Math.round(
    ranked.reduce((sum, r) => sum + getDealerAiRecommendation(r.vehicle, dealer).confidence, 0) /
      (ranked.length || 1),
  );

  return (
    <AppShell dealer={dealer}>
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Live Auctions</h1>
            <p className="text-sm text-ink-3">
              Your AI is watching {vehicles.length} live auctions for {dealer.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Stat value={String(vehicles.length)} label="Live now" />
            <Stat value={String(strongMatches)} label="Strong matches" />
            <Stat value={`${avgConfidence}%`} label="Avg. confidence" />
          </div>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-ink-3">
            No vehicles loaded — run{" "}
            <code className="rounded bg-fill px-1.5 py-0.5 text-xs">npm run fetch:copart</code>{" "}
            then{" "}
            <code className="rounded bg-fill px-1.5 py-0.5 text-xs">npm run gen:depth</code>.
          </p>
        ) : (
          <>
            {featured && (
              <section className="mb-8">
                <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink-2">
                  <IconSparkle className="h-4 w-4" strokeWidth={1.5} />
                  Top pick for {dealer.name}
                </div>
                <FeaturedCard item={featured} dealer={dealer} />
              </section>
            )}

            {recommended.length > 0 && (
              <section className="mb-10">
                <div className="mb-3 text-sm font-medium text-ink-3">Also recommended</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {recommended.map((item) => (
                    <AuctionCard key={item.vehicle.lotNumber} item={item} dealer={dealer} showReason />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                <div className="mb-3 text-sm font-medium text-ink-3">Other live auctions</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {rest.map((item) => (
                    <AuctionCard key={item.vehicle.lotNumber} item={item} dealer={dealer} compact />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-2 text-center">
      <div className="text-lg font-semibold text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-3">{label}</div>
    </div>
  );
}

function FeaturedCard({ item, dealer }: { item: ScoredVehicle; dealer: Dealer }) {
  const v = item.vehicle;
  const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
  const rec = getDealerAiRecommendation(v, dealer);
  const auction = getAuctionState(v, rec.recommendedMaxBid);

  return (
    <Link
      href={`/auctions/${v.lotNumber}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong sm:flex-row"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-neutral-900 sm:aspect-auto sm:w-80">
        {cover && (
          <Image
            src={cover.file}
            alt={`${v.year} ${v.make} ${v.model}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 320px"
          />
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <span className="h-1 w-1 rounded-full bg-white" />
          LIVE
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <span>Lane {auction.lane}</span>
            <span>·</span>
            <span>#{auction.auctionId}</span>
          </div>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            {v.year} {v.make} {v.model} {v.trim ?? ""}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ink-3">
            <span>{v.odometer ? `${v.odometer.toLocaleString()} mi` : "— mi"}</span>
            <span>{v.condition ?? "—"}</span>
            <span>{v.location ?? "—"}</span>
          </div>
          <p className="mt-3 max-w-md rounded-lg bg-fill p-3 text-sm leading-relaxed text-ink-2">
            {rec.reasoning}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-ink-3">Current bid</div>
              <div className="text-2xl font-semibold text-ink">{formatUsd(auction.currentBid)}</div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-400">
              <LiveCountdown initialSeconds={auction.secondsRemaining} />
            </div>
            <div className="flex items-center gap-1 text-sm text-ink-3">
              <IconUsers className="h-4 w-4" />
              {auction.bidderCount}
            </div>
          </div>
          <span className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-base transition-colors group-hover:opacity-90">
            Join Auction
          </span>
        </div>
      </div>
    </Link>
  );
}

function AuctionCard({
  item,
  dealer,
  compact,
  showReason,
}: {
  item: ScoredVehicle;
  dealer: Dealer;
  compact?: boolean;
  showReason?: boolean;
}) {
  const v = item.vehicle;
  const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
  const rec = getDealerAiRecommendation(v, dealer);
  const auction = getAuctionState(v, rec.recommendedMaxBid);

  return (
    <Link
      href={`/auctions/${v.lotNumber}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
        {cover && (
          <Image
            src={cover.file}
            alt={`${v.year} ${v.make} ${v.model}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={compact ? "220px" : "360px"}
          />
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <span className="h-1 w-1 rounded-full bg-white" />
          LIVE
        </span>
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          <LiveCountdown initialSeconds={auction.secondsRemaining} />
        </span>
      </div>

      <div className={compact ? "p-3" : "p-4"}>
        <h3 className={`truncate font-medium text-ink ${compact ? "text-sm" : ""}`}>
          {v.year} {v.make} {v.model}
        </h3>
        <div className={`mt-0.5 flex items-center gap-1 text-ink-3 ${compact ? "text-[11px]" : "text-xs"}`}>
          <IconUsers className="h-3 w-3" />
          {auction.bidderCount} bidders
          {!compact && (
            <>
              <span>·</span>
              <span className="truncate">{v.location ?? "—"}</span>
            </>
          )}
        </div>
        {showReason && (
          <div className="mt-1.5 text-xs text-ink-2">{item.matchReasons.join(" · ")}</div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-wide text-ink-3">Current bid</div>
            <div className={`font-semibold text-ink ${compact ? "text-sm" : ""}`}>
              {formatUsd(auction.currentBid)}
            </div>
          </div>
          <span
            className={`rounded-full bg-ink font-medium text-base transition-colors group-hover:opacity-90 ${
              compact ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-xs"
            }`}
          >
            Join
          </span>
        </div>
      </div>
    </Link>
  );
}
