import AppShell from "@/components/AppShell";
import OwnerListingDetail from "@/components/OwnerListingDetail";
import { getCurrentDealer } from "@/lib/session";

export default async function OwnerListingPage({
  params,
}: {
  params: Promise<{ lotNumber: string }>;
}) {
  const { lotNumber } = await params;
  const dealer = await getCurrentDealer();

  return (
    <AppShell dealer={dealer}>
      <OwnerListingDetail dealer={dealer} lotNumber={Number(lotNumber)} />
    </AppShell>
  );
}
