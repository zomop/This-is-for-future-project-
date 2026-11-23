import Link from "next/link";
import Image from "next/image";
import { Users, Inbox, Send, UserX } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getFriendsOverview } from "@/lib/data";
import { AddFriendForm } from "./add-friend-form";
import { FriendActions } from "./friend-actions";

export const metadata = { title: "Friends" };
export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const profile = await requireProfile();
  const { accepted, incoming, outgoing } = await getFriendsOverview();

  return (
    <AppShell profile={profile}>
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Friends</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Your party, your people.
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Add a traveler by username</CardTitle></CardHeader>
        <div className="p-5 sm:p-6">
          <AddFriendForm />
        </div>
      </Card>

      {/* incoming requests */}
      {incoming.length > 0 && (
        <Card className="mt-5">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Inbox size={13} /> Incoming requests</CardTitle>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">{incoming.length}</span>
          </CardHeader>
          <ul className="divide-y divide-line">
            {incoming.map(({ friendshipId, profile: p }) => (
              <li key={friendshipId} className="flex items-center gap-3 px-5 py-4">
                <Person profile={p} />
                <FriendActions friendshipId={friendshipId} mode="incoming" />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* outgoing requests */}
      {outgoing.length > 0 && (
        <Card className="mt-5">
          <CardHeader className="flex items-center gap-2"><Send size={13} /><CardTitle>Sent</CardTitle></CardHeader>
          <ul className="divide-y divide-line">
            {outgoing.map(({ friendshipId, profile: p }) => (
              <li key={friendshipId} className="flex items-center gap-3 px-5 py-4">
                <Person profile={p} />
                <FriendActions friendshipId={friendshipId} mode="outgoing" />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* accepted friends */}
      <Card className="mt-5">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Users size={13} /> Friends</CardTitle>
          <span className="text-[11px] font-semibold text-muted">{accepted.length}</span>
        </CardHeader>
        {accepted.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Users size={26} className="mx-auto text-muted" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-foreground">No friends yet.</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
              Search a username above — when they accept, you can message each other
              and (in Phase 3) walk the world together.
            </p>
          </div>
        ) : (
          <ul className="grid gap-px bg-line sm:grid-cols-2">
            {accepted.map((p) => (
              <li key={p.id} className="flex items-center gap-3 bg-panel px-5 py-4">
                <Person profile={p} />
                <FriendActions friendshipId="" mode="none" friendId={p.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-4 inline-flex items-center gap-2 text-[11px] text-muted">
        <UserX size={13} /> Need to remove someone? Use the remove action on their row — it deletes the friendship both ways.
      </p>
    </AppShell>
  );
}

function Person({ profile: p }: { profile: import("@/lib/types").Profile }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Link href={`/u/${p.username}`} aria-label={`Open ${p.display_name}'s profile`}>
        <Image
          src={p.avatar_url}
          alt=""
          width={44}
          height={44}
          className="pixelated h-11 w-11 rounded-full border border-line object-cover"
        />
      </Link>
      <div className="min-w-0">
        <Link href={`/u/${p.username}`} className="block truncate text-sm font-bold text-foreground hover:text-accent">
          {p.display_name}
        </Link>
        <p className="truncate text-[11px] text-muted">@{p.username}</p>
      </div>
    </div>
  );
}
