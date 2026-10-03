import AppShell from "@/components/AppShell";
import { getCurrentDealer } from "@/lib/session";
import { formatUsd } from "@/lib/demo";

export default async function GuardrailsPage() {
  const dealer = await getCurrentDealer();

  return (
    <AppShell dealer={dealer}>
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="text-lg font-semibold text-neutral-100">Guardrails Settings</h1>
        <p className="text-sm text-neutral-500">
          Set your parameters and let AI handle the rest.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card label="Max bid per vehicle">
            <div className="text-2xl font-semibold text-neutral-100">
              {formatUsd(dealer.maxBidPerVehicle)}
            </div>
            <input
              type="range"
              min={1000}
              max={50000}
              step={500}
              defaultValue={dealer.maxBidPerVehicle}
              disabled
              className="mt-3 w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-xs text-neutral-600">
              <span>$1,000</span>
              <span>$50,000</span>
            </div>
          </Card>

          <Card label="Total budget cap">
            <div className="text-2xl font-semibold text-neutral-100">
              {formatUsd(dealer.totalBudgetCap)}
            </div>
            <input
              type="range"
              min={10000}
              max={500000}
              step={5000}
              defaultValue={dealer.totalBudgetCap}
              disabled
              className="mt-3 w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-xs text-neutral-600">
              <span>$10,000</span>
              <span>$500,000</span>
            </div>
          </Card>

          <Card label="Risk tolerance">
            <div className="flex gap-2">
              {(["Low", "Moderate", "Moderate – High"] as const).map((level) => (
                <span
                  key={level}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    dealer.riskTolerance.includes(level)
                      ? "bg-blue-600 text-white"
                      : "bg-white/[.04] text-neutral-500"
                  }`}
                >
                  {level}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              {dealer.riskTolerance === "Low"
                ? "Focus on reliable, lower-risk vehicles with strong margins."
                : "Accepts moderate repair uncertainty for better margins."}
            </p>
          </Card>

          <Card label="Intervention preference">
            <div className="flex flex-col gap-2 text-sm text-neutral-300">
              {["Only if flagged", "Ask for high-value bids", "Manual approval for all"].map(
                (opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        dealer.interventionPreference === opt
                          ? "border-blue-500"
                          : "border-white/20"
                      }`}
                    >
                      {dealer.interventionPreference === opt && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </span>
                    {opt}
                  </label>
                ),
              )}
            </div>
          </Card>
        </div>

        <p className="mt-6 text-xs text-neutral-600">
          Prototype note: guardrails are fixed per demo dealer account — editing isn&apos;t
          wired up yet.
        </p>
      </div>
    </AppShell>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4">
      <div className="mb-3 text-sm text-neutral-500">{label}</div>
      {children}
    </div>
  );
}
