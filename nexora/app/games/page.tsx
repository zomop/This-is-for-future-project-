import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { PhaseNotice } from "@/components/phase-notice";

export const metadata = { title: "Games" };

export default async function GamesPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <PhaseNotice
        phase={4}
        title="Games"
        blurb="Fishing is the crown jewel: 25+ species, rarity tiers, rods, bait, a pier at sunset — plus quick arcade mini-games for coins and XP."
        includes={[
          "Fishing: cast, bite, reel — timing-based catches at the Pier",
          "Rarity tiers from Common to Mythic (no pay-to-win, no gambling)",
          "Inventory for rods, bait and your catch log",
          "Mini-games hub: coin-earning arcade cabinets in Arcade City",
        ]}
      />
    </AppShell>
  );
}
