import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { PhaseNotice } from "@/components/phase-notice";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <PhaseNotice
        phase={2}
        title="Messages"
        blurb="Direct messages with real-time delivery, typing indicators and read receipts — built on Supabase Realtime channels and Postgres row-level security."
        includes={[
          "1-on-1 conversations with any friend",
          "Realtime delivery + unread badges in the sidebar",
          "Typing indicators over presence channels",
          "Message history stored with RLS — only participants can read",
        ]}
      />
    </AppShell>
  );
}
