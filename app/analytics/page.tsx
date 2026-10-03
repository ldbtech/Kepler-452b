import AppShell from "@/components/AppShell";
import { getVehicles } from "@/lib/vehicles";
import { getCurrentDealer } from "@/lib/session";
import { getDealerAiRecommendation, rankVehiclesForDealer } from "@/lib/recommend";
import { formatUsd } from "@/lib/demo";

export default async function AnalyticsPage() {
  const dealer = await getCurrentDealer();
  const ranked = rankVehiclesForDealer(getVehicles(), dealer);

  const recs = ranked.map(({ vehicle }) => getDealerAiRecommendation(vehicle, dealer));
  const avgMargin = Math.round(
    recs.reduce((sum, r) => sum + r.expectedMarginPct, 0) / recs.length,
  );
  const avgConfidence = Math.round(
    recs.reduce((sum, r) => sum + r.confidence, 0) / recs.length,
  );
  const strongMatches = ranked.filter((v) => v.score >= 65).length;
  const totalEstValue = recs.reduce((sum, r) => sum + r.estimatedMarketValue, 0);

  return (
    <AppShell dealer={dealer}>
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="text-lg font-semibold text-neutral-100">Analytics</h1>
        <p className="text-sm text-neutral-500">
          Portfolio snapshot across the current live batch, for {dealer.name}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Strong matches" value={String(strongMatches)} hint="of 10 live lots" />
          <Stat label="Avg. expected margin" value={`${avgMargin}%`} hint="across recommendations" />
          <Stat label="Avg. AI confidence" value={`${avgConfidence}%`} />
          <Stat label="Est. combined market value" value={formatUsd(totalEstValue)} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/[.08] bg-white/[.02] p-4">
          <div className="mb-3 text-sm font-medium text-neutral-200">Match score by vehicle</div>
          <div className="flex flex-col gap-2">
            {ranked.map(({ vehicle, score }) => (
              <div key={vehicle.lotNumber} className="flex items-center gap-3 text-xs">
                <span className="w-40 truncate text-neutral-400">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.06]">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                  />
                </div>
                <span className="w-8 text-right text-neutral-500">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-neutral-100">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-neutral-600">{hint}</div>}
    </div>
  );
}
