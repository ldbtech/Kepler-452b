import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getVehicles } from "@/lib/vehicles";
import { getCurrentDealer } from "@/lib/session";
import { getDealerAiRecommendation, rankVehiclesForDealer } from "@/lib/recommend";
import { formatUsd } from "@/lib/demo";

export default async function AssistantPage() {
  const dealer = await getCurrentDealer();
  const [top] = rankVehiclesForDealer(getVehicles(), dealer);
  const v = top.vehicle;
  const rec = getDealerAiRecommendation(v, dealer);
  const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];

  return (
    <AppShell dealer={dealer}>
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="text-lg font-semibold text-neutral-100">AI Assistant</h1>
        <p className="text-sm text-neutral-500">
          Get clear, actionable insights about any vehicle or auction.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
              {cover && (
                <Image src={cover.file} alt={v.model} fill className="object-cover" sizes="64px" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/auctions/${v.lotNumber}`}
                className="truncate text-sm font-medium text-neutral-100 hover:underline"
              >
                {v.year} {v.make} {v.model}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  LIVE
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-600/10 p-3 text-sm leading-relaxed text-blue-200">
            <div className="mb-1 font-medium text-blue-300">Why this bid?</div>
            {rec.reasoning}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <InsightCard
              icon="📊"
              title="Market Analysis"
              body={`${rec.comparableCount} similar vehicles analyzed`}
            />
            <InsightCard
              icon="🔍"
              title="Condition Assessment"
              body={
                rec.riskLevel === "Low"
                  ? "Minor repairs, low uncertainty"
                  : "Repairs estimated from reported damage"
              }
            />
            <InsightCard
              icon="💰"
              title="Profit Potential"
              body={`${formatUsd(rec.expectedMargin)} (${rec.expectedMarginPct}%) after estimated repairs`}
            />
            <InsightCard
              icon="⚠️"
              title="Risk Evaluation"
              body={`${rec.riskLevel} risk, ${rec.confidence}% confidence`}
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-600">
          Showing the top-recommended vehicle for {dealer.name}. Ask-anything chat isn&apos;t
          wired up in this prototype yet.
        </p>
      </div>
    </AppShell>
  );
}

function InsightCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[.02] p-2.5">
      <div className="mb-1">{icon}</div>
      <div className="font-medium text-neutral-200">{title}</div>
      <div className="mt-0.5 text-neutral-500">{body}</div>
    </div>
  );
}
