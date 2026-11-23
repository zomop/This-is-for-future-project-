import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { PhaseNotice } from "@/components/phase-notice";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <PhaseNotice
        phase={4}
        title="Inventory"
        blurb="Rods, bait, trophies and trinkets you earn in the World — stored server-side, never duplicated, never purchasable with real money."
        includes={[
          "Rod rack with stats (cast, reel, luck)",
          "Bait box and consumables",
          "Trophy shelf for biggest catches",
          "Full catch log with species, weight and rarity",
        ]}
      />
    </AppShell>
  );
}
