import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { PhaseNotice } from "@/components/phase-notice";

export const metadata = { title: "Communities" };

export default async function CommunitiesPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <PhaseNotice
        phase={2}
        title="Communities"
        blurb="Public and private clubs: guilds of anglers, game nights, fan art, event squads — each with its own chat and membership rules."
        includes={[
          "Create public or private communities (private = invite link)",
          "Community chat rooms with real-time messages",
          "Roles inside a community: owner, moderator, member",
          "Member list with presence and activity",
        ]}
      />
    </AppShell>
  );
}
