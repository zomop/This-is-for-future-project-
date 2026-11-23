import Link from "next/link";
import { Compass, Search, TrendingUp, Users, Clock, Check, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { FramedAvatar } from "@/components/framed-avatar";
import { buttonVariants } from "@/components/ui/button";
import { getNewestMembers, getWeeklyXpMovers, searchPeople } from "@/lib/data";
import { xpToLevel } from "@/lib/level";
import { cn } from "@/lib/utils";
import type { PersonHit } from "@/lib/data";
import { AddFriendButton } from "./add-friend-button";
import { FriendActions } from "../friends/friend-actions";

export const metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

/** Right-hand action chip for a search result, honest about the real relation. */
function RelationAction({ hit }: { hit: PersonHit }) {
  switch (hit.relation) {
    case "friend":
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted">
          <Check size={13} /> Friends
        </span>
      );
    case "requested":
      return (
        <Link
          href="/friends"
          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-accent"
          title="Manage the pending request on the Friends page"
        >
          <Clock size={13} /> Requested
        </Link>
      );
    case "incoming":
      return <FriendActions friendshipId={hit.friendshipId ?? ""} mode="incoming" />;
    default:
      return <AddFriendButton username={hit.profile.username} />;
  }
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireProfile();
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 40);
  const isSearch = q.length > 0;

  const [hits, movers, fresh] = await Promise.all([
    isSearch ? searchPeople(q) : Promise.resolve([]),
    getWeeklyXpMovers(6),
    getNewestMembers(6),
  ]);

  return (
    <AppShell profile={profile}>
      {/* header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Discover</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Find travelers worth knowing.
        </h1>
        <p className="mt-1 text-[11px] font-medium text-muted">
          Search the realm, see who&apos;s on fire this week, meet the newest arrivals.
        </p>
      </div>

      {/* search */}
      <form
        action="/discover"
        method="get"
        role="search"
        className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-panel p-2 shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
      >
        <Search size={16} className="ml-2 shrink-0 text-muted" aria-hidden />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by username or display name…"
          maxLength={40}
          autoComplete="off"
          aria-label="Search people"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "accent", size: "sm" }), "shrink-0")}
        >
          Search
        </button>
      </form>
      <p className="mt-1.5 text-[10px] text-muted">
        Private profiles never appear here. Wildcards: use <code className="text-foreground/70">*</code> to match any run of characters.
      </p>

      <div className="flex flex-col gap-5">
        {/* search results */}
        {isSearch && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Compass size={13} /> Results for “{q}”
              </CardTitle>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {hits.length} found
              </span>
            </CardHeader>
            {hits.length === 0 ? (
              <p className="px-6 py-6 text-center text-xs text-muted">
                No travelers match that name. Try a different spelling or search their display name.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {hits.map((hit) => (
                  <li key={hit.profile.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                    <Link href={`/u/${hit.profile.username}`} className="shrink-0">
                      <FramedAvatar
                        src={hit.profile.avatar_url}
                        alt=""
                        size={38}
                        frame={hit.profile.frame_slug}
                        className="border border-line"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                          href={`/u/${hit.profile.username}`}
                          className="truncate text-[12.5px] font-bold text-foreground hover:text-accent"
                        >
                          {hit.profile.display_name}
                        </Link>
                        <span className="truncate text-[10.5px] text-muted">@{hit.profile.username}</span>
                        <RoleBadge role={hit.profile.role} />
                        <span className="rounded-full border border-line px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-muted">
                          Lv {xpToLevel(hit.profile.xp)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10.5px] text-muted">
                        {hit.profile.status || hit.profile.bio || "No status yet."}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <RelationAction hit={hit} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {/* trending this week */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={13} /> Trending this week
            </CardTitle>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              XP earned · last 7 days
            </span>
          </CardHeader>
          {movers.length === 0 ? (
            <p className="px-6 py-6 text-center text-xs text-muted">
              No XP earned anywhere in the realm this week yet — unlock an achievement and claim the top spot.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {movers.map((m, i) => (
                <li key={m.profile.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <span
                    className={cn(
                      "w-7 shrink-0 text-center text-[13px] font-extrabold tabular-nums",
                      i === 0 ? "text-gold" : i < 3 ? "text-accent" : "text-muted"
                    )}
                  >
                    {i + 1}
                  </span>
                  <Link href={`/u/${m.profile.username}`} className="shrink-0">
                    <FramedAvatar
                      src={m.profile.avatar_url}
                      alt=""
                      size={34}
                      frame={m.profile.frame_slug}
                      className="border border-line"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <Link
                        href={`/u/${m.profile.username}`}
                        className="truncate text-[12px] font-bold text-foreground hover:text-accent"
                      >
                        {m.profile.display_name}
                      </Link>
                      <span className="truncate text-[10px] text-muted">@{m.profile.username}</span>
                    </div>
                    <p className="text-[10px] text-muted">Level {xpToLevel(m.profile.xp)}</p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-golddim/50 bg-[#241c0c] px-2 py-1 text-[10.5px] font-extrabold tabular-nums text-gold">
                    +{m.weeklyXp} XP
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* newest members */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users size={13} /> Newest members
            </CardTitle>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              fresh faces
            </span>
          </CardHeader>
          {fresh.length === 0 ? (
            <p className="px-6 py-6 text-center text-xs text-muted">No one has arrived yet.</p>
          ) : (
            <ul className="grid grid-cols-1 divide-y divide-line/60 sm:grid-cols-2 sm:divide-y-0">
              {fresh.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <Link href={`/u/${p.username}`} className="shrink-0">
                    <FramedAvatar
                      src={p.avatar_url}
                      alt=""
                      size={34}
                      frame={p.frame_slug}
                      className="border border-line"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/u/${p.username}`}
                      className="block truncate text-[12px] font-bold text-foreground hover:text-accent"
                    >
                      {p.display_name}
                    </Link>
                    <span className="block truncate text-[10px] text-muted">@{p.username}</span>
                  </div>
                  <Link
                    href={`/u/${p.username}`}
                    className="inline-flex items-center gap-1 shrink-0 text-[10px] font-bold text-accent hover:underline"
                  >
                    View <ChevronRight size={11} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
