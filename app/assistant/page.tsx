import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getVehicles } from "@/lib/vehicles";
import { getCurrentDealer } from "@/lib/session";
import { getDealerAiRecommendation, rankVehiclesForDealer } from "@/lib/recommend";
import { formatUsd } from "@/lib/demo";
import { IconAlertTriangle, IconChart, IconDollar, IconSearch } from "@/components/icons";

export default async function AssistantPage() {
  const dealer = await getCurrentDealer();
  const [top] = rankVehiclesForDealer(getVehicles(), dealer);
  const v = top.vehicle;
  const rec = getDealerAiRecommendation(v, dealer);
  const cover = v.images.find((img) => img.label === v.rotationOrder[0]) ?? v.images[0];

  return (
    <AppShell dealer={dealer}>
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="text-lg font-semibold text-ink">AI Assistant</h1>
        <p className="text-sm text-ink-3">
          Get clear, actionable insights about any vehicle or auction.
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
              {cover && (
                <Image src={cover.file} alt={v.model} fill className="object-cover" sizes="64px" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/auctions/${v.lotNumber}`}
                className="truncate text-sm font-medium text-ink hover:underline"
              >
                {v.year} {v.make} {v.model}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-ink-3">
                <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  LIVE
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-surface p-3 text-sm leading-relaxed text-ink-2">
            <div className="mb-1 font-medium text-ink">Why this bid?</div>
            {rec.reasoning}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <InsightCard
              icon={IconSearch}
              title="Market Analysis"
              body={`${rec.comparableCount} similar vehicles analyzed`}
            />
            <InsightCard
              icon={IconChart}
              title="Condition Assessment"
              body={
                rec.riskLevel === "Low"
                  ? "Minor repairs, low uncertainty"
                  : "Repairs estimated from reported damage"
              }
            />
            <InsightCard
              icon={IconDollar}
              title="Profit Potential"
              body={`${formatUsd(rec.expectedMargin)} (${rec.expectedMarginPct}%) after estimated repairs`}
            />
            <InsightCard
              icon={IconAlertTriangle}
              title="Risk Evaluation"
              body={`${rec.riskLevel} risk, ${rec.confidence}% confidence`}
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-3">
          Showing the top-recommended vehicle for {dealer.name}. For an ask-anything chat, use
          the assistant bubble in the bottom corner on any page.
        </p>
      </div>
    </AppShell>
  );
}

function InsightCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof IconChart;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <Icon className="mb-1.5 h-4 w-4 text-ink-3" strokeWidth={1.5} />
      <div className="font-medium text-ink">{title}</div>
      <div className="mt-0.5 text-ink-3">{body}</div>
    </div>
  );
}
