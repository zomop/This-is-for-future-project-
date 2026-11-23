import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { PhaseNotice } from "@/components/phase-notice";

export const metadata = { title: "World" };

export default async function WorldPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <PhaseNotice
        phase={3}
        title="The Field of the Fallen Sword"
        blurb="A persistent pixel world — multiplayer movement, chat bubbles, region triggers and ambient events, rendered with Phaser and synced over Supabase Realtime."
        includes={[
          "Plaza, Beach, Pier, Forest Lake, Garden and Arcade City",
          "Arrow-key / touch movement with walk animations",
          "Real-time sync of nearby players via presence channels",
          "Region system: step into the Pier and fishing mode opens",
        ]}
      />
    </AppShell>
  );
}
