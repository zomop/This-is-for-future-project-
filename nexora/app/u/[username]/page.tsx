import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Lock, Trophy } from "lucide-react";
import { getUser, getEarnedAchievements, getProfileByUsername } from "@/lib/data";
import { ProfileBannerCard } from "@/components/profile-banner-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/guard";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [viewer, target] = await Promise.all([
    getUser(),
    getProfileByUsername(username),
  ]);

  // privacy gate: members-only profiles require a signed-in viewer
  const locked =
    target && target.privacy === "friends" && !viewer;
  const privateLocked =
    target &&
    target.privacy === "private" &&
    (!viewer || (viewer.id !== target.id));

  if (target && (locked || privateLocked)) {
    const mine = viewer ? await requireProfile() : null;
    const staff = mine && ["owner", "admin", "moderator"].includes(mine.role);
    if (!staff && viewer?.id !== target.id) {
      return (
        <Shell profile={mine}>
          <LockScreen username={username} membersOnly={target.privacy === "friends"} />
        </Shell>
      );
    }
  }

  if (!target) notFound();

  const [earned, mine] = await Promise.all([
    getEarnedAchievements(target.id),
    viewer ? requireProfile() : Promise.resolve(null),
  ]);
  const isSelf = viewer?.id === target.id;

  return (
    <Shell profile={mine}>
      <div className="mb-5">
        <Link href={isSelf ? "/profile" : "/home"} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground">
          <ChevronLeft size={14} /> Back
        </Link>
      </div>

      <ProfileBannerCard
        profile={target}
        achievementCount={earned.length}
        action={
          isSelf ? (
            <Link href="/profile" className={cn(buttonVariants({ variant: "gold" }))}>
              Edit Profile
            </Link>
          ) : undefined
        }
      />

      <Card className="mt-5">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Achievements</CardTitle>
          <span className="text-[11px] font-semibold text-muted">{earned.length} unlocked</span>
        </CardHeader>
        {earned.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted">No achievements yet.</p>
        ) : (
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((e) => (
              <li key={e.achievement.slug} className="flex flex-col items-center bg-panel px-4 py-5 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-golddim/50 bg-[#241c0c] text-gold">
                  <Trophy size={20} />
                </span>
                <span className="mt-2.5 text-[12px] font-bold leading-tight text-foreground">
                  {e.achievement.name}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                  +{e.achievement.xp_reward} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}

function Shell({
  profile,
  children,
}: {
  profile: Awaited<ReturnType<typeof requireProfile>> | null;
  children: React.ReactNode;
}) {
  if (!profile) {
    // Logged-out viewer of a public profile: minimal chrome, no app sidebar.
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </div>
    );
  }
  return <AppShell profile={profile}>{children}</AppShell>;
}

function LockScreen({ username, membersOnly }: { username: string; membersOnly: boolean }) {
  return (
    <Card className="mx-auto max-w-md px-6 py-12 text-center">
      <Lock size={30} className="mx-auto text-muted" strokeWidth={1.5} />
      <h1 className="mt-4 text-xl font-extrabold text-foreground">This profile is {membersOnly ? "members-only" : "private"}.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        @{username} chose to share their page with {membersOnly ? "signed-in members" : "nobody but themselves"}.
      </p>
      <Link href="/login" className={cn(buttonVariants({ variant: "accent" }), "mt-5")}>
        Sign in to continue
      </Link>
    </Card>
  );
}
