import AppShell from "@/components/AppShell";
import GuardrailsPanel from "@/components/GuardrailsPanel";
import { getCurrentDealer } from "@/lib/session";

export default async function GuardrailsPage() {
  const dealer = await getCurrentDealer();

  return (
    <AppShell dealer={dealer}>
      <GuardrailsPanel dealer={dealer} />
    </AppShell>
  );
}
