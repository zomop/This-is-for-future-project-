import Link from "next/link";
import Image from "next/image";
import { MessageSquare, Users, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getConversationSummaries } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const profile = await requireProfile();
  const conversations = await getConversationSummaries();

  return (
    <AppShell profile={profile}>
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Messages</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Direct lines to your party.
        </h1>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><MessageSquare size={13} /> Conversations</CardTitle>
          <span className="text-[11px] font-semibold text-muted">{conversations.length}</span>
        </CardHeader>
        {conversations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MessageSquare size={26} className="mx-auto text-muted" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-foreground">No conversations yet.</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
              Messages are friends-only. Add a traveler on the Friends page, then hit
              <span className="text-accent"> Message</span> on their row.
            </p>
            <Link href="/friends" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              <Users size={15} /> Go to Friends
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03]"
                >
                  <Image
                    src={c.peer.avatar_url}
                    alt=""
                    width={48}
                    height={48}
                    className="pixelated h-12 w-12 rounded-full border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-bold text-foreground">{c.peer.display_name}</span>
                      {c.last_message_at && (
                        <time className="shrink-0 text-[10px] tabular-nums text-muted">
                          {new Date(c.last_message_at).toLocaleString("en-GB", {
                            day: "2-digit", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </time>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {c.lastMessage
                        ? `${c.lastMessage.sender_id === profile.id ? "You: " : ""}${c.lastMessage.body}`
                        : "Say hello — your party awaits."}
                    </p>
                  </div>
                  {c.unreadCount > 0 ? (
                    <span
                      aria-label={`${c.unreadCount} unread messages`}
                      className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-extrabold text-[#062630]"
                    >
                      {c.unreadCount}
                    </span>
                  ) : (
                    <ChevronRight size={17} className="shrink-0 text-muted" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className={cn("mt-4 text-[11px] text-muted")}>
        Messages are delivered live over Supabase Realtime and stored with row-level
        security — only the two of you can read them.
      </p>
    </AppShell>
  );
}
