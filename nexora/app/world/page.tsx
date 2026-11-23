import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { WorldClient } from "@/components/world-client";
import { getAccent } from "@/lib/design";

export const metadata = { title: "World" };

export default async function WorldPage() {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile}>
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-wide text-foreground">
          The Field of the Fallen Sword
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] text-muted">
          A persistent pixel world — walk the Plaza now; multiplayer movement, the other
          five zones and chat bubbles arrive slice by slice. Rendered with Phaser, drawn
          entirely in code. You are seeing the real build — there are no fake players.
        </p>
      </header>

      <WorldClient displayName={profile.display_name} accent={getAccent(profile.accent_theme).accent} />
    </AppShell>
  );
}
