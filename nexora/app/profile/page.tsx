import Link from "next/link";
import { ExternalLink, Trophy, Lock, Frame, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { ProfileBannerCard } from "@/components/profile-banner-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { getEarnedAchievements, getAllAchievements } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [earned, all] = await Promise.all([
    getEarnedAchievements(profile.id),
    getAllAchievements(),
  ]);
  const earnedSlugs = new Set(earned.map((e) => e.achievement.slug));

  return (
    <AppShell profile={profile}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Profile</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            Your legend, your page.
          </h1>
        </div>
        <Link
          href={`/u/${profile.username}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          View public page <ExternalLink size={13} />
        </Link>
      </div>

      <ProfileBannerCard profile={profile} achievementCount={earned.length} />

      <Card className="mt-5">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Frame size={13} /> Look &amp; style</CardTitle>
          <span className="text-[11px] font-semibold text-muted">Accent · banner · frame</span>
        </CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="text-sm text-muted">
            Accent color, profile banner and profile frames all live in the design
            center — change them however you like, one tap to apply.
          </p>
          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-accentdim bg-[#0d2733] px-4 py-2 text-sm font-bold text-accent hover:bg-[#123242]"
          >
            Open design center <ChevronRight size={15} />
          </Link>
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Edit your profile</CardTitle>
        </CardHeader>
        <div className="p-5 sm:p-6">
          <ProfileForm profile={profile} />
        </div>
      </Card>

      {/* achievement shelf */}
      <Card className="mt-5">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Trophy size={13} /> Achievement shelf</CardTitle>
          <span className="text-[11px] font-semibold text-muted">
            {earned.length} / {all.length} unlocked
          </span>
        </CardHeader>
        <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {all.map((a) => {
            const unlocked = earnedSlugs.has(a.slug);
            return (
              <li
                key={a.slug}
                className={cn(
                  "flex flex-col items-center bg-panel px-3 py-5 text-center",
                  !unlocked && "opacity-45 saturate-0"
                )}
                title={unlocked ? `${a.name} — earned` : `${a.name} — locked`}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border",
                    unlocked
                      ? "border-golddim/60 bg-[#241c0c] text-gold"
                      : "border-line bg-panel2 text-muted"
                  )}
                >
                  {unlocked ? <Trophy size={20} /> : <Lock size={18} />}
                </span>
                <span className="mt-2.5 text-[11px] font-bold leading-tight text-foreground">
                  {a.name}
                </span>
                <span className="mt-1 text-[9px] leading-snug text-muted">{a.description}</span>
                <span
                  className={cn(
                    "mt-1.5 text-[9px] font-bold uppercase tracking-wider",
                    unlocked ? "text-gold" : "text-muted"
                  )}
                >
                  +{a.xp_reward} XP
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </AppShell>
  );
}
