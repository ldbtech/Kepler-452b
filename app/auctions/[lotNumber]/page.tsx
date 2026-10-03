import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import AuctionDetail from "@/components/AuctionDetail";
import { getVehicle, getVehicles } from "@/lib/vehicles";

export function generateStaticParams() {
  return getVehicles().map((v) => ({ lotNumber: String(v.lotNumber) }));
}

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ lotNumber: string }>;
}) {
  const { lotNumber } = await params;
  const vehicle = getVehicle(Number(lotNumber));
  if (!vehicle) notFound();

  return (
    <AppShell>
      <AuctionDetail vehicle={vehicle} />
    </AppShell>
  );
}
