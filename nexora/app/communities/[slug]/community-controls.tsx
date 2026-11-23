"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  LogOut,
  Trash2,
  Link2,
  Copy,
  Check,
  ShieldOff,
  ShieldCheck,
  UserMinus,
  Loader2,
} from "lucide-react";
import {
  joinCommunityAction,
  leaveCommunityAction,
  deleteCommunityAction,
  createInviteAction,
  revokeInviteAction,
  kickMemberAction,
  setMemberRoleAction,
} from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";
import type { CommunityInvite, CommunityRole } from "@/lib/types";

/** Join / leave / delete controls for a community. */
export function CommunityControls({
  communityId,
  myRole,
  slug,
}: {
  communityId: string;
  myRole: CommunityRole | null;
  slug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (myRole === null) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <Button
          size="sm"
          variant="accent"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const r = await joinCommunityAction(communityId);
              if (r.error) setError(r.error);
              else router.refresh();
            })
          }
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />} Join
          community
        </Button>
        {error && <span className="text-[10px] font-semibold text-bad">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel2 px-3 py-2">
        <span className="text-[11px] text-muted">
          You are{" "}
          <span className="font-bold text-foreground">
            {myRole === "owner" ? "the owner" : myRole === "moderator" ? "a moderator" : "a member"}
          </span>
        </span>
      </div>
      {myRole !== "owner" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const r = await leaveCommunityAction(communityId);
              if (r.error) setError(r.error);
              else {
                router.push("/communities");
                router.refresh();
              }
            })
          }
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} Leave
        </Button>
      )}
      {myRole === "owner" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          className="text-bad hover:border-bad/50"
          onClick={() =>
            startTransition(async () => {
              if (!window.confirm(`Delete @${slug} for everyone? This cannot be undone.`)) return;
              setError(null);
              const r = await deleteCommunityAction(communityId);
              if (r.error) setError(r.error);
            })
          }
        >
          <Trash2 size={14} /> Delete community
        </Button>
      )}
      {error && <span className="text-[10px] font-semibold text-bad">{error}</span>}
    </div>
  );
}

/** Per-member moderation actions (owner: kick + promote; moderator: kick members). */
export function MemberRowActions({
  communityId,
  userId,
  targetRole,
  myRole,
}: {
  communityId: string;
  userId: string;
  targetRole: CommunityRole;
  myRole: CommunityRole | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isOwner = myRole === "owner";
  const canKick =
    myRole === "owner" || (myRole === "moderator" && targetRole === "member");
  const canPromote = isOwner && targetRole !== "owner";
  if (!canKick && !canPromote) return null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {canPromote && (
        <button
          type="button"
          disabled={pending}
          title={targetRole === "moderator" ? "Demote to member" : "Make moderator"}
          aria-label={targetRole === "moderator" ? "Demote to member" : "Make moderator"}
          onClick={() =>
            startTransition(async () => {
              await setMemberRoleAction(
                communityId,
                userId,
                targetRole === "moderator" ? "member" : "moderator"
              );
              router.refresh();
            })
          }
          className="rounded-md border border-line bg-panel2 p-1 text-muted hover:text-accent disabled:opacity-50"
        >
          {targetRole === "moderator" ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
        </button>
      )}
      {canKick && (
        <button
          type="button"
          disabled={pending}
          title="Remove from community"
          aria-label="Remove from community"
          onClick={() =>
            startTransition(async () => {
              if (!window.confirm("Remove this member?")) return;
              await kickMemberAction(communityId, userId);
              router.refresh();
            })
          }
          className="rounded-md border border-line bg-panel2 p-1 text-muted hover:text-bad disabled:opacity-50"
        >
          <UserMinus size={12} />
        </button>
      )}
    </div>
  );
}

/** Invite links panel — owner/moderators mint and revoke /join/<code> links. */
export function InvitePanel({
  communityId,
  invites,
}: {
  communityId: string;
  invites: CommunityInvite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const inviteUrl = (code: string) =>
    `${window.location.origin}/join/${code}`;

  return (
    <div className="rounded-2xl border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <h3 className="flex items-center gap-2 text-[12px] font-extrabold text-foreground">
          <Link2 size={13} /> Invite links
        </h3>
        <Button
          size="sm"
          variant="accent"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const r = await createInviteAction(communityId);
              if (r.error) setError(r.error);
              router.refresh();
            })
          }
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />} New link
        </Button>
      </div>
      <ul className="mt-2 divide-y divide-line/60">
        {invites.length === 0 && (
          <li className="px-4 py-3 text-[10.5px] text-muted">
            No invite links yet — mint one to bring people in.
          </li>
        )}
        {invites.map((inv) => (
          <li key={inv.code} className="flex items-center gap-2 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[11px] font-bold text-accent">/{inv.code}</p>
              <p className="text-[9px] tabular-nums text-muted">
                {inv.uses} used{inv.max_uses ? ` of ${inv.max_uses}` : ""}
              </p>
            </div>
            <button
              type="button"
              title="Copy invite link"
              aria-label="Copy invite link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl(inv.code));
                  setCopied(inv.code);
                  setTimeout(() => setCopied(null), 1500);
                } catch {
                  setError("Could not copy — copy the code manually.");
                }
              }}
              className="rounded-md border border-line bg-panel2 p-1 text-muted hover:text-accent"
            >
              {copied === inv.code ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <button
              type="button"
              title="Revoke invite"
              aria-label="Revoke invite"
              onClick={() =>
                startTransition(async () => {
                  await revokeInviteAction(inv.code);
                  router.refresh();
                })
              }
              className="rounded-md border border-line bg-panel2 p-1 text-muted hover:text-bad"
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="px-4 pb-3 text-[10px] font-semibold text-bad">{error}</p>}
    </div>
  );
}
