import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { PhaseNotice } from "@/components/phase-notice";

export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <PhaseNotice
        phase={2}
        title="Friends"
        blurb="Friend requests, a living friends list and presence — who else from your party is online right now, inside the NEXORA world."
        includes={[
          "Send / accept / decline friend requests",
          "Friends list with online presence via Supabase Realtime",
          "Recently played together, XP comparison at a glance",
          "Block & report flow backed by the staff console",
        ]}
      />
    </AppShell>
  );
}
