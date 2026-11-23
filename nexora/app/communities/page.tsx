import Link from "next/link";
import { UsersRound, Plus, Sparkles, Lock, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PixelBanner } from "@/components/pixel-banner";
import { getMyCommunities, getDiscoverCommunities } from "@/lib/data";
import { CreateCommunityForm } from "./create-community-form";
import type { CommunityWithMeta } from "@/lib/types";

export const metadata = { title: "Communities" };
export const dynamic = "force-dynamic";

function CommunityRow({ c }: { c: CommunityWithMeta }) {
  return (
    <li>
      <Link
        href={`/communities/${c.slug}`}
        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03] sm:px-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-panel2 text-[15px]">
          {c.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[12.5px] font-bold text-foreground">{c.name}</span>
            {!c.is_public && <Lock size={11} className="shrink-0 text-muted" />}
            {c.myRole === "owner" && (
              <span className="rounded-full border border-golddim/60 bg-[#241c0c] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold">
                owner
              </span>
            )}
            {c.myRole === "moderator" && (
              <span className="rounded-full border border-line px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-muted">
                mod
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] text-muted">
            {c.description || "No description yet."}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold tabular-nums text-muted">
          <UsersRound size={11} /> {c.memberCount}
        </span>
        <ChevronRight size={13} className="shrink-0 text-muted" />
      </Link>
    </li>
  );
}

export default async function CommunitiesPage() {
  const profile = await requireProfile();
  const [mine, discover] = await Promise.all([getMyCommunities(), getDiscoverCommunities(8)]);

  return (
    <AppShell profile={profile}>
      {/* header with animated pixel banner */}
      <div className="relative">
        <PixelBanner variant="island" className="h-28 sm:h-32" />
        <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-graphite via-graphite/70 to-transparent px-5 pb-3.5 pt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            Communities
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-foreground">
            Find your people.
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* my communities */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersRound size={13} /> Your communities
            </CardTitle>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {mine.length} joined
            </span>
          </CardHeader>
          {mine.length === 0 ? (
            <p className="px-6 py-5 text-center text-xs text-muted">
              You haven&apos;t joined any communities yet — join one below or create your own.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {mine.map((c) => (
                <CommunityRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </Card>

        {/* discover public communities */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={13} /> Open to everyone
            </CardTitle>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              public communities
            </span>
          </CardHeader>
          {discover.length === 0 ? (
            <p className="px-6 py-5 text-center text-xs text-muted">
              No public communities to discover yet — be the first to make one.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {discover.map((c) => (
                <CommunityRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </Card>

        {/* create */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={13} /> Create a community
            </CardTitle>
          </CardHeader>
          <div className="px-4 pb-5 sm:px-5">
            <CreateCommunityForm />
          </div>
        </Card>

        <p className="text-[10px] leading-relaxed text-muted">
          Private communities stay hidden until you join through an invite link. Every community
          has its own live chat, moderators and invite links.{" "}
          <Link href="/global" className="text-accent hover:underline">
            The island-wide chat
          </Link>{" "}
          is still there for everyone.
        </p>
      </div>
    </AppShell>
  );
}
