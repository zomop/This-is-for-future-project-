import Image from "next/image";
import { Coins, CalendarDays, Flame } from "lucide-react";
import { FramedAvatar } from "@/components/framed-avatar";
import { cn } from "@/lib/utils";
import { levelProgress } from "@/lib/level";
import { RoleBadge } from "@/components/ui/badge";
import { memberMonths } from "@/lib/data";
import type { Profile } from "@/lib/types";

/**
 * The NEXORA profile showcase card — banner, overlapping avatar, level pill,
 * stat strip — modelled on the reference game-profile layout.
 */
export function ProfileBannerCard({
  profile,
  achievementCount,
  action,
}: {
  profile: Profile;
  achievementCount: number;
  action?: React.ReactNode;
}) {
  const lp = levelProgress(profile.xp);
  const months = memberMonths(profile.created_at);
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const stats = [
    { label: "exp", value: profile.xp.toLocaleString() },
    { label: "achievements", value: String(achievementCount) },
    { label: "months", value: String(months) },
    { label: "coins", value: String(profile.coins) },
  ];

  return (
    <section
      className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      aria-label={`Profile of ${profile.display_name}`}
    >
      {/* banner */}
      <div className="relative h-40 sm:h-48">
        <Image
          src={profile.banner_url}
          alt="Profile banner artwork"
          fill
          sizes="(max-width: 768px) 100vw, 960px"
          className="pixelated object-cover object-[center_30%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/35 to-transparent" />
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffd98a] backdrop-blur-sm">
          <Flame size={11} strokeWidth={2} /> Lvl. {lp.level}
        </span>
      </div>

      {/* identity */}
      <div className="relative px-5 pb-5 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <span className="-mt-12 sm:-mt-14">
              <FramedAvatar
                src={profile.avatar_url}
                alt="Avatar"
                size={104}
                frame={profile.frame_slug}
                priority
                className="border-4 border-panel bg-panel2"
              />
            </span>
            <div className="pb-1">
              <h1 className="text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
                {profile.display_name}
              </h1>
              <p className="text-xs font-medium tabular-nums text-muted">@{profile.username}</p>
              <div className="mt-1.5">
                <RoleBadge role={profile.role} />
              </div>
            </div>
          </div>
          {action && <div className="pb-1">{action}</div>}
        </div>

        {profile.status && (
          <p className="mt-3 max-w-md text-sm italic leading-snug text-foreground/85">
            “{profile.status}”
          </p>
        )}
        {profile.bio && (
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">{profile.bio}</p>
        )}

        {/* stat strip — divided like the reference */}
        <dl className="mt-5 flex divide-x divide-line overflow-hidden rounded-xl border border-line bg-panel2/60">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-1 flex-col items-center gap-0.5 px-2 py-3"
            >
              <dt className="order-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
                {s.label}
              </dt>
              <dd className="order-1 text-base font-extrabold tabular-nums text-foreground sm:text-lg">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={12} /> Joined {joinDate}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Coins size={12} className="text-gold" /> {profile.coins} coins
          </span>
        </div>
      </div>

      {/* XP bar across the bottom */}
      <div
        className={cn(
          "flex items-center gap-3 border-t border-line bg-panel2/40 px-5 py-2.5 sm:px-7"
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Lvl {lp.level}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel3">
          <div className="h-full rounded-full bg-accent" style={{ width: `${lp.pct}%` }} />
        </div>
        <span className="text-[10px] tabular-nums text-muted">
          {lp.nextLevelAt - profile.xp} XP to Lvl {lp.level + 1}
        </span>
      </div>
    </section>
  );
}
