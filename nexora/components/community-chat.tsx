"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { SendHorizontal, Loader2, Trash2, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  sendCommunityMessageAction,
  deleteCommunityMessageAction,
  type CommunityChatFormState,
} from "@/lib/actions/communities";
import { RoleBadge } from "@/components/ui/badge";
import { FramedAvatar } from "@/components/framed-avatar";
import { cn } from "@/lib/utils";
import type {
  CommunityMessage,
  CommunityMessageWithSender,
  CommunityRole,
  GlobalMessageSender,
} from "@/lib/types";

const initial: CommunityChatFormState = {};
const SENDER_COLS = "id, username, display_name, avatar_url, frame_slug, role";
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const NAME_COLOR: Record<string, string> = {
  owner: "text-gold",
  moderator: "text-[#eccb6f]",
  member: "text-[#9fd8ff]",
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

type Row =
  | { kind: "divider"; id: string; label: string }
  | { kind: "message"; id: string; message: CommunityMessageWithSender; grouped: boolean };

function buildRows(messages: CommunityMessageWithSender[]): Row[] {
  const rows: Row[] = [];
  let lastDay = "";
  let prev: CommunityMessageWithSender | null = null;
  for (const m of messages) {
    const day = new Date(m.created_at).toDateString();
    if (day !== lastDay) {
      rows.push({ kind: "divider", id: `divider-${day}`, label: dayLabel(m.created_at) });
      lastDay = day;
      prev = null;
    }
    const grouped =
      prev !== null &&
      prev.sender_id === m.sender_id &&
      new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;
    rows.push({ kind: "message", id: m.id, message: m, grouped });
    prev = m;
  }
  return rows;
}

export function CommunityChat({
  communityId,
  meId,
  myRole,
  memberRoles,
  initialMessages,
}: {
  communityId: string;
  meId: string;
  /** Viewer's community role — owner/moderators can delete any message. */
  myRole: CommunityRole | null;
  /** Community role of each sender (for name colors). */
  memberRoles: Record<string, CommunityRole>;
  initialMessages: CommunityMessageWithSender[];
}) {
  const [messages, setMessages] = useState<CommunityMessageWithSender[]>(initialMessages);
  const [state, formAction, pending] = useActionState(sendCommunityMessageAction, initial);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bodyLength, setBodyLength] = useState(0);
  const [missed, setMissed] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const canDeleteAny = myRole === "owner" || myRole === "moderator";

  const rows = useMemo(() => buildRows(messages), [messages]);

  const senderCache = useRef(
    new Map<string, GlobalMessageSender>(
      initialMessages
        .map((m) => m.sender)
        .filter((s): s is GlobalMessageSender => s !== null)
        .map((s) => [s.id, s])
    )
  );

  useEffect(() => {
    const supabase = createClient();
    const resolveSender = async (row: CommunityMessage) => {
      let sender = senderCache.current.get(row.sender_id) ?? null;
      if (!sender) {
        const { data } = await supabase
          .from("profiles")
          .select(SENDER_COLS)
          .eq("id", row.sender_id)
          .maybeSingle();
        if (data) {
          sender = data as unknown as GlobalMessageSender;
          senderCache.current.set(sender.id, sender);
        }
      }
      if (sender) {
        setMessages((prev) =>
          prev.map((m) => (m.id === row.id && !m.sender ? { ...m, sender } : m))
        );
      }
    };
    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          const row = payload.new as CommunityMessage;
          const known = senderCache.current.get(row.sender_id) ?? null;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [...prev, { ...row, sender: known }]
          );
          if (!known) void resolveSender(row);
          if (!nearBottomRef.current) setMissed((n) => n + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  // autoscroll when near the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottomRef.current = near;
    if (near) setMissed(0);
  };

  const onDelete = async (id: string) => {
    setDeleteError(null);
    const result = await deleteCommunityMessageAction(id);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* message log */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        className="flex min-h-[280px] flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3 sm:px-4"
      >
        {rows.map((row) =>
          row.kind === "divider" ? (
            <div key={row.id} className="my-2 flex items-center gap-2" aria-hidden>
              <span className="h-px flex-1 bg-line" />
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
                {row.label}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
          ) : (
            <MessageRow
              key={row.id}
              row={row}
              memberRoles={memberRoles}
              canDelete={canDeleteAny || row.message.sender_id === meId}
              onDelete={onDelete}
            />
          )
        )}
      </div>

      {/* jump to latest */}
      {missed > 0 && (
        <div className="flex justify-center pb-1">
          <button
            type="button"
            onClick={() => {
              const el = scrollRef.current;
              if (el) el.scrollTop = el.scrollHeight;
              nearBottomRef.current = true;
              setMissed(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-accentdim bg-[#0d2733] px-3 py-1 text-[10px] font-bold text-accent shadow-lg"
          >
            <ArrowDown size={13} /> {missed} new
          </button>
        </div>
      )}

      {deleteError && (
        <p className="px-4 pb-1 text-[10px] font-semibold text-bad">{deleteError}</p>
      )}

      {/* composer */}
      <form
        ref={formRef}
        action={formAction}
        className="flex items-end gap-2 border-t border-line px-3 py-3 sm:px-4"
      >
        <input type="hidden" name="community_id" value={communityId} />
        <div className="relative min-w-0 flex-1">
          <textarea
            name="body"
            rows={1}
            maxLength={500}
            placeholder="Message this community…"
            aria-label="Message body"
            onChange={(e) => setBodyLength(e.target.value.length)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            className="max-h-28 min-h-[38px] w-full resize-y rounded-xl border border-line bg-panel2 px-3 py-2.5 pr-12 text-[12.5px] text-foreground outline-none placeholder:text-muted focus:border-accentdim"
          />
          <span className="pointer-events-none absolute bottom-1.5 right-2.5 text-[9px] tabular-nums text-muted">
            {bodyLength}/500
          </span>
        </div>
        <button
          type="submit"
          disabled={pending}
          aria-label="Send message"
          className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-[11px] font-extrabold text-[#062630] transition-colors hover:bg-[#67e0fa] disabled:opacity-60"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
          Send
        </button>
        {state.error && (
          <span className="sr-only" aria-live="polite">
            {state.error}
          </span>
        )}
      </form>
    </div>
  );
}

function MessageRow({
  row,
  memberRoles,
  canDelete,
  onDelete,
}: {
  row: Extract<Row, { kind: "message" }>;
  memberRoles: Record<string, CommunityRole>;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const m = row.message;
  const role = memberRoles[m.sender_id] ?? "member";
  return (
    <div className="group relative flex gap-2.5 px-2 py-[3px] hover:bg-white/[0.03]">
      {!row.grouped && m.sender && (
        <FramedAvatar
          src={m.sender.avatar_url}
          alt=""
          size={30}
          frame={m.sender.frame_slug}
          className="mt-0.5 shrink-0 border border-line"
        />
      )}
      {!row.grouped && !m.sender && <div className="w-[30px] shrink-0" />}
      <div className={cn("min-w-0 flex-1", row.grouped && "pl-[38px]")}>
        {!row.grouped && (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn("text-[11.5px] font-bold", NAME_COLOR[role])}>
              {m.sender?.display_name ?? "A traveler"}
            </span>
            {role !== "member" && <RoleBadge role={role === "owner" ? "owner" : "moderator"} />}
            <time className="text-[9px] tabular-nums text-muted">
              {new Date(m.created_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-foreground/95">
          {m.body}
        </p>
      </div>
      {canDelete && (
        <button
          type="button"
          aria-label="Delete message"
          onClick={() => onDelete(m.id)}
          className="absolute right-2 top-1.5 hidden rounded-md border border-line bg-panel2 p-1 text-muted opacity-0 transition-opacity hover:text-bad group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
