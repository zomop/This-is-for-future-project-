import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/guard";
import { AppShell } from "@/components/app-shell";
import { getConversation } from "@/lib/data";
import { ChatThread } from "@/components/chat-thread";

export const metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const detail = await getConversation(id);
  if (!detail) notFound();

  return (
    <AppShell profile={profile}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/messages" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground">
          <ChevronLeft size={14} /> Messages
        </Link>
        <Link href={`/u/${detail.peer.username}`} className="flex items-center gap-2.5">
          <span className="text-right">
            <span className="block text-[13px] font-bold leading-tight text-foreground">{detail.peer.display_name}</span>
            <span className="block text-[11px] text-muted">@{detail.peer.username}</span>
          </span>
          <Image
            src={detail.peer.avatar_url}
            alt=""
            width={42}
            height={42}
            className="pixelated h-[42px] w-[42px] rounded-full border border-line object-cover"
          />
        </Link>
      </div>

      <ChatThread
        conversationId={detail.id}
        meId={profile.id}
        peerName={detail.peer.display_name}
        initialMessages={detail.messages}
      />
    </AppShell>
  );
}
