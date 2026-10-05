"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getVehicle } from "@/lib/vehicles";
import { formatUsd } from "@/lib/demo";
import { getPurchasesForDealer, type PurchaseRecord } from "@/lib/purchases";
import { IconTrophy } from "@/components/icons";

export default function LiveWins({ dealerId }: { dealerId: string }) {
  const [wins, setWins] = useState<PurchaseRecord[]>([]);

  useEffect(() => {
    // localStorage isn't available during SSR, so wins only exist after
    // mount — deliberately deferred past the first client render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWins(getPurchasesForDealer(dealerId).sort((a, b) => b.wonAt - a.wonAt));
  }, [dealerId]);

  if (wins.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 text-sm font-medium text-ink-2">Just won this session</div>
      <div className="flex flex-col gap-3">
        {wins.map((w) => {
          const v = getVehicle(w.lotNumber);
          if (!v) return null;
          const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];
          return (
            <Link
              key={w.lotNumber}
              href={`/auctions/${v.lotNumber}`}
              className="flex items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[.05] p-3 hover:border-emerald-500/50"
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
                  <IconTrophy className="h-3.5 w-3.5" strokeWidth={1.5} />
                  You Won
                </div>
                <h2 className="truncate font-medium text-ink">
                  {v.year} {v.make} {v.model} {v.trim ?? ""}
                </h2>
                <p className="text-xs text-ink-3">
                  Won {new Date(w.wonAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide text-ink-3">
                  Final price
                </div>
                <div className="font-semibold text-emerald-400">{formatUsd(w.finalPrice)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
