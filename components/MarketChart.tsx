import type { MarketInsights } from "@/lib/demo";

const WIDTH = 280;
const HEIGHT = 110;
const PAD = 8;

function buildPath(values: number[], min: number, max: number): string {
  const step = (WIDTH - PAD * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = PAD + i * step;
      const y = PAD + (1 - (v - min) / (max - min || 1)) * (HEIGHT - PAD * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function MarketChart({ insights }: { insights: MarketInsights }) {
  const { points, trendPct } = insights;
  const all = points.flatMap((p) => [p.thisVehicle, p.similar]);
  const min = Math.min(...all) * 0.97;
  const max = Math.max(...all) * 1.03;

  const thisPath = buildPath(
    points.map((p) => p.thisVehicle),
    min,
    max,
  );
  const similarPath = buildPath(
    points.map((p) => p.similar),
    min,
    max,
  );

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" preserveAspectRatio="none">
        <path d={similarPath} fill="none" stroke="#525252" strokeWidth={2} strokeDasharray="4 3" />
        <path d={thisPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-3">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-ink-2">
          <span className="h-1.5 w-3 rounded-full bg-accent" /> This vehicle
        </span>
        <span className="flex items-center gap-1.5 text-ink-3">
          <span className="h-1.5 w-3 rounded-full bg-ink-3" /> Similar vehicles
        </span>
        <span className={`ml-auto font-medium ${trendPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trendPct >= 0 ? "+" : ""}
          {trendPct}%
        </span>
      </div>
    </div>
  );
}
