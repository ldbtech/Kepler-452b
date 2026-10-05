import AppShell from "@/components/AppShell";
import CommandCenter from "@/components/CommandCenter";
import { getVehicles } from "@/lib/vehicles";
import { getCurrentDealer } from "@/lib/session";

export default async function Home() {
  const dealer = await getCurrentDealer();
  const vehicles = getVehicles();

  return (
    <AppShell dealer={dealer}>
      {vehicles.length === 0 ? (
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <p className="text-ink-3">
            No vehicles loaded — run{" "}
            <code className="rounded bg-fill px-1.5 py-0.5 text-xs">npm run fetch:copart</code>{" "}
            then{" "}
            <code className="rounded bg-fill px-1.5 py-0.5 text-xs">npm run gen:depth</code>.
          </p>
        </div>
      ) : (
        <CommandCenter dealer={dealer} vehicles={vehicles} />
      )}
    </AppShell>
  );
}
