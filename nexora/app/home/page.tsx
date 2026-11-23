import Link from "next/link";
import {
  Trophy,
  Map,
  Pencil,
  ChevronRight,
  Globe,
  Coins,
  MessageSquare,
  Users,
  Sparkles,
} from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { FramedAvatar } from "@/components/framed-avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  getEarnedAchievements,
  getGlobalMessages,
  getRealmAchievements,
  getNewestMembers,
  getConversationSummaries,
} from "@/lib/data";
import { levelProgress } from "@/lib/level";
import { cn, timeAgo } from "@/lib/utils";
import type { GlobalMessageWithSender } from "@/lib/types";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await requireProfile();
  const lp = levelProgress(profile.xp);
  const firstName = profile.display_name.split(" ")[0] ?? profile.username;
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const [earned, chatter, unlocks, fresh, party] = await Promise.all([
    getEarnedAchievements(profile.id),
    getGlobalMessages(5),
    getRealmAchievements(5),
    getNewestMembers(6),
    getConversationSummaries().then((s) => s.slice(0, 3)),
  ]);

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell profile={profile}>
      {/* header row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Home</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-[11px] font-medium text-muted">{today} · the island is awake.</p>
        </div>
        <Link href="/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <Pencil size={14} /> Customize profile
        </Link>
      </div>

      {/* compact identity strip — the full showcase lives on /profile */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-panel px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.3)] sm:px-5">
        <FramedAvatar
          src={profile.avatar_url}
          alt="Your avatar"
          size={56}
          frame={profile.frame_slug}
          priority
          className="border border-line"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-extrabold text-foreground">{profile.display_name}</span>
            <RoleBadge role={profile.role} />
          </div>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Level {lp.level} · <span className="tabular-nums">{lp.nextLevelAt - profile.xp} XP</span> to {lp.level + 1}
          </p>
          <div
            className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-panel3"
            role="progressbar"
            aria-valuenow={lp.intoLevel}
            aria-valuemin={0}
            aria-valuemax={lp.needed}
            aria-label="XP progress"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${lp.pct}%` }} />
          </div>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gold">
            <Coins size={13} /> {profile.coins}
          </span>
          <Link href="/profile" className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent hover:underline">
            Manage profile →
          </Link>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-5">
        {/* ===== the island right now (left column, feed) ===== */}
        <div className="space-y-5 lg:col-span-3">
          {/* latest from the island */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe size={13} className="text-accent" /> Latest from the island
              </CardTitle>
              <Link href="/global" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline">
                Open global <ChevronRight size={12} />
              </Link>
            </CardHeader>
            {chatter.length === 0 ? (
              <p className="px-6 py-6 text-center text-xs text-muted">
                The island is quiet. Be the first voice in <Link href="/global" className="text-accent hover:underline">#the-island</Link>.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {[...chatter].reverse().map((m) => (
                  <ChatterRow key={m.id} message={m} />
                ))}
              </ul>
            )}
          </Card>

          {/* realm achievements */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={13} className="text-gold" /> Island unlocks
              </CardTitle>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">realm-wide</span>
            </CardHeader>
            {unlocks.length === 0 ? (
              <p className="px-6 py-6 text-center text-xs text-muted">
                No unlocks yet — complete your profile to earn <span className="text-gold">First Steps</span>.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {unlocks.map((u, i) => (
                  <li key={`${u.earned_at}-${i}`} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                    <Link href={u.profile ? `/u/${u.profile.username}` : "#"} className="shrink-0">
                      <FramedAvatar
                        src={u.profile?.avatar_url ?? "/avatars/hooded.png"}
                        alt=""
                        size={30}
                        frame={u.profile?.frame_slug}
                        className="border border-line"
                      />
                    </Link>
                    <p className="min-w-0 flex-1 truncate text-[12px] leading-snug text-foreground/90">
                      <Link href={u.profile ? `/u/${u.profile.username}` : "#"} className="font-bold text-foreground hover:text-accent">
                        {u.profile?.display_name ?? "A traveler"}
                      </Link>{" "}
                      unlocked <span className="font-semibold text-gold">{u.achievementName}</span>
                    </p>
                    <time className="shrink-0 text-[10px] tabular-nums text-muted">{timeAgo(u.earned_at)}</time>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* your recent achievements */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy size={13} /> Your recent achievements
              </CardTitle>
              <Link href="/profile" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline">
                Shelf <ChevronRight size={12} />
              </Link>
            </CardHeader>
            {earned.length === 0 ? (
              <p className="px-6 py-6 text-center text-xs text-muted">
                Nothing yet — <Link href="/profile" className="text-accent hover:underline">finish your profile</Link> to earn First Steps (+100 XP).
              </p>
            ) : (
              <ul className="flex divide-x divide-line overflow-x-auto">
                {earned.slice(0, 4).map((e) => (
                  <li key={e.achievement.slug} className="flex min-w-[132px] flex-1 flex-col items-center gap-1.5 px-3 py-4 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-golddim/50 bg-[#241c0c] text-gold">
                      <Trophy size={17} strokeWidth={1.8} />
                    </span>
                    <span className="text-[11px] font-bold leading-tight text-foreground">{e.achievement.name}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gold">+{e.achievement.xp_reward} XP</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ===== right column ===== */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* your party — latest DMs */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={13} /> Your party
              </CardTitle>
              <Link href="/messages" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline">
                All messages <ChevronRight size={12} />
              </Link>
            </CardHeader>
            {party.length === 0 ? (
              <div className="px-5 py-5 text-center">
                <p className="text-xs text-muted">No conversations yet.</p>
                <Link href="/friends" className={cn(buttonVariants({ variant: "accent", size: "sm" }), "mt-3")}>
                  <Users size={14} /> Find travelers
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {party.map((c) => (
                  <li key={c.id}>
                    <Link href={`/messages/${c.id}`} className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.03]">
                      <FramedAvatar
                        src={c.peer.avatar_url}
                        alt=""
                        size={32}
                        frame={c.peer.frame_slug}
                        className="border border-line"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold text-foreground">{c.peer.display_name}</span>
                        <span className="block truncate text-[10.5px] text-muted">
                          {c.lastMessage ? c.lastMessage.body : "Say hello…"}
                        </span>
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[9px] font-extrabold text-[#062630]">
                          {c.unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* fresh faces — newest members */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users size={13} /> Fresh faces
              </CardTitle>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">newest members</span>
            </CardHeader>
            <ul className="grid grid-cols-2 gap-px bg-line">
              {fresh.map((p) => (
                <li key={p.id} className="bg-panel">
                  <Link href={`/u/${p.username}`} className="flex flex-col items-center gap-1.5 px-2 py-4 text-center transition-colors hover:bg-white/[0.03]">
                    <FramedAvatar
                      src={p.avatar_url}
                      alt=""
                      size={44}
                      frame={p.frame_slug}
                      className="border border-line"
                    />
                    <span className="max-w-full">
                      <span className="block truncate text-[11px] font-bold text-foreground">{p.display_name}</span>
                      <span className="block truncate text-[9px] text-muted">@{p.username}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* phase teaser — compact */}
          <Link
            href="/world"
            className="group relative flex min-h-[132px] flex-col justify-end overflow-hidden rounded-2xl border border-line"
          >
            <div
              className="pixelated absolute inset-0 bg-cover bg-[center_20%] transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: "url('/banners/field.png')" }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/50 to-transparent" aria-hidden />
            <div className="relative flex items-end justify-between gap-3 p-4">
              <div>
                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
                  <Map size={11} /> Phase 3
                </p>
                <p className="mt-1 text-sm font-extrabold leading-tight text-foreground">
                  The Field of the Fallen Sword awaits
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                Enter <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function ChatterRow({ message: m }: { message: GlobalMessageWithSender }) {
  const sender = m.sender;
  return (
    <li className="flex items-start gap-2.5 px-4 py-2.5 sm:px-5">
      <Link href={sender ? `/u/${sender.username}` : "#"} className="mt-0.5 shrink-0">
        <FramedAvatar
          src={sender?.avatar_url ?? "/avatars/hooded.png"}
          alt=""
          size={28}
          frame={sender?.frame_slug}
          className="border border-line"
        />
      </Link>
      <p className="min-w-0 flex-1 text-[12px] leading-snug text-foreground/90">
        <Link href={sender ? `/u/${sender.username}` : "#"} className="font-bold text-foreground hover:text-accent">
          {sender?.display_name ?? "Traveler"}
        </Link>{" "}
        <span className="text-foreground/85">{m.body}</span>
      </p>
      <time className="shrink-0 pt-0.5 text-[10px] tabular-nums text-muted">{timeAgo(m.created_at)}</time>
    </li>
  );
}
