import AppShell from "@/components/AppShell";
import SellForm from "@/components/SellForm";
import { getCurrentDealer } from "@/lib/session";

export default async function SellPage() {
  const dealer = await getCurrentDealer();

  return (
    <AppShell dealer={dealer}>
      <SellForm dealer={dealer} />
    </AppShell>
  );
}
