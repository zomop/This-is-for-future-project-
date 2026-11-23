import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock, UsersRound, UserPlus } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { FramedAvatar } from "@/components/framed-avatar";
import { PixelBanner } from "@/components/pixel-banner";
import {
  getCommunityBySlug,
  getCommunityMembers,
  getCommunityMessages,
  getCommunityInvites,
} from "@/lib/data";
import { CommunityChat } from "@/components/community-chat";
import {
  CommunityControls,
  InvitePanel,
  MemberRowActions,
} from "./community-controls";
import type { CommunityRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `@${slug} · Communities` };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireProfile();

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const isMember = community.myRole !== null;
  const [members, messages, invites] = await Promise.all([
    getCommunityMembers(community.id),
    isMember ? getCommunityMessages(community.id) : Promise.resolve([]),
    community.canModerate ? getCommunityInvites(community.id) : Promise.resolve([]),
  ]);

  const memberRoles: Record<string, CommunityRole> = Object.fromEntries(
    members.map((m) => [m.profile.id, m.role])
  );

  return (
    <AppShell profile={profile}>
      {/* banner header */}
      <div className="relative">
        <PixelBanner variant={community.banner_variant} className="h-32 sm:h-36" />
        <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-graphite via-graphite/75 to-transparent px-5 pb-3.5 pt-10">
          <Link
            href="/communities"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:underline"
          >
            <ChevronLeft size={12} /> All communities
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel2 text-[16px]">
              {community.emoji}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {community.name}
            </h1>
            {!community.is_public && (
              <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
                <Lock size={10} /> invite-only
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-[11px] text-muted">
            {community.description || "No description yet."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* chat / join */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          {isMember ? (
            <Card className="flex min-h-[480px] flex-col p-0">
              <CardHeader className="flex items-center justify-between rounded-t-2xl border-b border-line">
                <CardTitle className="flex items-center gap-2">
                  <UsersRound size={13} /> Community chat
                </CardTitle>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  live · members only
                </span>
              </CardHeader>
              <CommunityChat
                communityId={community.id}
                meId={profile.id}
                myRole={community.myRole}
                memberRoles={memberRoles}
                initialMessages={messages}
              />
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel2 text-2xl">
                  {community.emoji}
                </span>
                <p className="max-w-sm text-[12px] text-muted">
                  {community.is_public
                    ? "Join this community to see its chat and members."
                    : "This community is invite-only — you need an invite link to join."}
                </p>
                {community.is_public && (
                  <CommunityControls
                    communityId={community.id}
                    myRole={null}
                    slug={community.slug}
                  />
                )}
              </div>
            </Card>
          )}
        </div>

        {/* side rail */}
        <div className="flex flex-col gap-5">
          {/* members */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UsersRound size={13} /> Members
              </CardTitle>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {community.memberCount}
              </span>
            </CardHeader>
            <ul className="divide-y divide-line/60">
              {members.slice(0, 20).map((m) => (
                <li key={m.profile.id} className="flex items-center gap-2.5 px-4 py-2">
                  <Link href={`/u/${m.profile.username}`} className="shrink-0">
                    <FramedAvatar
                      src={m.profile.avatar_url}
                      alt=""
                      size={30}
                      frame={m.profile.frame_slug}
                      className="border border-line"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/u/${m.profile.username}`}
                      className="block truncate text-[11.5px] font-bold text-foreground hover:text-accent"
                    >
                      {m.profile.display_name}
                    </Link>
                    <span className="block truncate text-[9.5px] text-muted">
                      @{m.profile.username}
                    </span>
                  </div>
                  {m.role !== "member" && (
                    <RoleBadge role={m.role === "owner" ? "owner" : "moderator"} />
                  )}
                  {isMember && m.profile.id !== profile.id && (
                    <MemberRowActions
                      communityId={community.id}
                      userId={m.profile.id}
                      targetRole={m.role}
                      myRole={community.myRole}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {/* settings & membership */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={13} /> Membership
              </CardTitle>
            </CardHeader>
            <div className="px-4 pb-4">
              <CommunityControls
                communityId={community.id}
                myRole={community.myRole}
                slug={community.slug}
              />
            </div>
          </Card>

          {/* invites (owner/mod only) */}
          {community.canModerate && (
            <InvitePanel communityId={community.id} invites={invites} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
