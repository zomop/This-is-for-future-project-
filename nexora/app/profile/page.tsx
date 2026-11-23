import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { ProfileBannerCard } from "@/components/profile-banner-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { getEarnedAchievements } from "@/lib/data";

export const metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const earned = await getEarnedAchievements(profile.id);

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
        <CardHeader>
          <CardTitle>Edit your profile</CardTitle>
        </CardHeader>
        <div className="p-5 sm:p-6">
          <ProfileForm profile={profile} />
        </div>
      </Card>
    </AppShell>
  );
}
