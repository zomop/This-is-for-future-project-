import Link from "next/link";
import { Trophy, Map, Pencil, Compass, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { ProfileBannerCard } from "@/components/profile-banner-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getEarnedAchievements } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await requireProfile();
  const earned = await getEarnedAchievements(profile.id);
  const firstName = profile.display_name.split(" ")[0] ?? profile.username;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell profile={profile}>
      {/* header row */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Home</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {greeting}, {firstName}.
          </h1>
        </div>
        <Link href="/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <Pencil size={14} /> Customize profile
        </Link>
      </div>

      <ProfileBannerCard
        profile={profile}
        achievementCount={earned.length}
        action={
          <Link href="/profile" className={cn(buttonVariants({ variant: "gold" }))}>
            Manage Profile
          </Link>
        }
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* achievements */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent achievements</CardTitle>
            <span className="text-[11px] font-semibold text-muted">
              {earned.length} unlocked
            </span>
          </CardHeader>
          {earned.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Trophy size={28} className="mx-auto text-gold" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-foreground">No achievements yet.</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
                Complete your profile — set a bio, a status and show the realm who you are —
                to earn <span className="text-gold">First Steps (+100 XP)</span>.
              </p>
              <Link href="/profile" className={cn(buttonVariants({ variant: "accent", size: "sm" }), "mt-4")}>
                Complete your profile
              </Link>
            </div>
          ) : (
            <ul className="grid gap-px bg-line sm:grid-cols-2">
              {earned.slice(0, 6).map((e) => (
                <li key={e.achievement.slug} className="flex items-start gap-3 bg-panel px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-golddim/50 bg-[#241c0c] text-gold">
                    <Trophy size={17} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold leading-tight text-foreground">
                      {e.achievement.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                      {e.achievement.description}
                    </span>
                    <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-gold">
                      +{e.achievement.xp_reward} XP
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* world teaser */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Link
            href="/world"
            className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-2xl border border-line"
          >
            <div
              className="pixelated absolute inset-0 bg-cover bg-[center_20%] transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: "url('/banners/field.png')" }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/45 to-transparent" aria-hidden />
            <div className="relative p-5">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
                <Map size={12} /> Phase 3
              </p>
              <h2 className="mt-1.5 text-xl font-extrabold leading-tight text-foreground">
                The Field of the
                <br />
                Fallen Sword awaits
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#b8c4d8]">
                Plaza, Beach, Pier, Forest Lake, Garden, Arcade — a shared world where real
                players walk in. Coming in Phase 3.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gold">
                Enter world <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          {/* roadmap card */}
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
              <Compass size={12} /> Season roadmap
            </p>
            <ol className="mt-3 space-y-2 text-[12px] leading-snug text-foreground/85">
              <li><span className="font-bold text-accent">P1</span> — Accounts, profiles, roles (live now)</li>
              <li><span className="font-bold text-accent">P2</span> — Friends &amp; DMs live now; communities &amp; discover next</li>
              <li><span className="font-bold text-muted">P3</span> — The pixel World, multiplayer sync</li>
              <li><span className="font-bold text-muted">P4</span> — Fishing, 25+ species, inventory, coins</li>
              <li><span className="font-bold text-muted">P5</span> — Mini-games, moderation, admin</li>
            </ol>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
