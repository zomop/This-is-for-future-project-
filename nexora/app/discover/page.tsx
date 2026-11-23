import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { PhaseNotice } from "@/components/phase-notice";

export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <PhaseNotice
        phase={2}
        title="Discover"
        blurb="Find travelers worth knowing — trending profiles, newest members and community picks for you."
        includes={[
          "Trending this week by XP earned",
          "Newest members of the realm",
          "Suggested communities by interest",
          "Search people by username or display name",
        ]}
      />
    </AppShell>
  );
}
