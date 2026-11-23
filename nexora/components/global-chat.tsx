"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { SendHorizontal, Loader2, Trash2, Globe, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useTyping } from "@/components/use-typing";
import {
  sendGlobalMessageAction,
  deleteGlobalMessageAction,
  type GlobalChatFormState,
} from "@/lib/actions/global-chat";
import { RoleBadge } from "@/components/ui/badge";
import { FramedAvatar } from "@/components/framed-avatar";
import { cn } from "@/lib/utils";
import type { AppRole, GlobalMessage, GlobalMessageSender, GlobalMessageWithSender } from "@/lib/types";

const initial: GlobalChatFormState = {};
const SENDER_COLS = "id, username, display_name, avatar_url, frame_slug, role";
const STAFF_ROLES: AppRole[] = ["moderator", "admin", "owner"];
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const NAME_COLOR: Record<string, string> = {
  owner: "text-gold",
  admin: "text-[#f5a3cd]",
  moderator: "text-[#eccb6f]",
  contributor: "text-[#7be0a8]",
};

function nameColor(role: AppRole | undefined) {
  return (role && NAME_COLOR[role]) || "text-[#9fd8ff]";
}

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
  | { kind: "message"; id: string; message: GlobalMessageWithSender; grouped: boolean };

function buildRows(messages: GlobalMessageWithSender[]): Row[] {
  const rows: Row[] = [];
  let lastDay = "";
  let prev: GlobalMessageWithSender | null = null;
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

export function GlobalChat({
  meId,
  myName,
  myRole,
  initialMessages,
}: {
  meId: string;
  myName: string;
  myRole: AppRole;
  initialMessages: GlobalMessageWithSender[];
}) {
  const [messages, setMessages] = useState<GlobalMessageWithSender[]>(initialMessages);
  const [state, formAction, pending] = useActionState(sendGlobalMessageAction, initial);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bodyLength, setBodyLength] = useState(0);
  const { typingNames, notifyTyping } = useTyping("global-chat", meId, myName);
  const [missed, setMissed] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const isStaff = STAFF_ROLES.includes(myRole);

  const rows = useMemo(() => buildRows(messages), [messages]);

  // Live sync: INSERT appends, DELETE removes. Staff deletions propagate live.
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
    const resolveSender = async (row: GlobalMessage) => {
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
      .channel("global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_messages" },
        (payload) => {
          const row = payload.new as GlobalMessage;
          const known = senderCache.current.get(row.sender_id) ?? null;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [...prev, { ...row, sender: known }]
          );
          if (!known) void resolveSender(row);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "global_messages" },
        (payload) => {
          const old = payload.old as Partial<GlobalMessage>;
          if (old?.id) setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Scroll policy: follow the latest only when the reader is near the bottom;
  // otherwise surface a "jump to latest" pill with the missed-count.
  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setMissed(0);
  };

  useEffect(() => {
    if (nearBottomRef.current) {
      scrollToBottom(false);
    } else {
      setMissed((n) => n + 1);
    }
  }, [messages.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distance < 140;
    if (nearBottomRef.current && missed > 0) setMissed(0);
  };

  // Clear the composer after a successful send.
  const prevPending = useRef(pending);
  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setBodyLength(0);
    }
    prevPending.current = pending;
  }, [pending, state.error]);

  const onDelete = async (id: string) => {
    setDeleteError(null);
    const result = await deleteGlobalMessageAction(id);
    if (result.error) setDeleteError(result.error);
    else setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <section
      className="relative flex h-[72vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
      aria-label="Global chat"
    >
      {/* channel topic bar */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-panel2/60 px-4">
        <Globe size={14} className="shrink-0 text-accent" aria-hidden />
        <p className="min-w-0 truncate text-[11px] font-semibold text-foreground">
          the-island
          <span className="ml-2 hidden font-normal text-muted sm:inline">
            island-wide chat · keep it friendly · staff moderate
          </span>
        </p>
      </div>

      {/* message list */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="relative flex-1 overflow-y-auto px-2 py-3 sm:px-4"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% -10%, rgba(65,212,244,0.07), transparent 55%), radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 22px 22px",
        }}
      >
        {rows.length === 0 && (
          <div className="pt-20 text-center">
            <Globe size={30} className="mx-auto text-accentdim" strokeWidth={1.4} />
            <p className="mt-3 text-sm font-bold text-foreground">The island is quiet… for now.</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
              Be the first voice in #the-island. Everyone signed in can read this — make it a good one.
            </p>
          </div>
        )}

        {rows.map((row) => {
          if (row.kind === "divider") {
            return (
              <div key={row.id} className="flex items-center gap-3 px-2 py-3" aria-hidden>
                <span className="h-px flex-1 bg-line" />
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted">
                  {row.label}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
            );
          }
          const { message: m, grouped } = row;
          const sender = m.sender;
          const mine = m.sender_id === meId;
          const name = sender?.display_name ?? "Traveler";
          const role = sender?.role;
          const canDelete = mine || isStaff;
          return (
            <div
              key={m.id}
              className={cn(
                "group relative flex gap-2.5 rounded-lg px-2 transition-colors hover:bg-white/[0.035]",
                grouped ? "py-[1px]" : "pb-0.5 pt-2.5"
              )}
            >
              {/* avatar or timestamp gutter */}
              {grouped ? (
                <div className="flex w-9 shrink-0 items-center justify-end">
                  <time
                    className="text-[9px] tabular-nums text-muted opacity-0 transition-opacity group-hover:opacity-100"
                    title={new Date(m.created_at).toLocaleString("en-GB")}
                  >
                    {new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
              ) : (
                <Link
                  href={sender ? `/u/${sender.username}` : "#"}
                  aria-label={sender ? `Open ${name}'s profile` : "Traveler"}
                  className="mt-0.5 shrink-0"
                >
                  <FramedAvatar
                    src={sender?.avatar_url ?? "/avatars/hooded.png"}
                    alt=""
                    size={36}
                    frame={sender?.frame_slug}
                    className="border border-line"
                  />
                </Link>
              )}

              <div className="min-w-0 flex-1">
                {!grouped && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Link
                      href={sender ? `/u/${sender.username}` : "#"}
                      className={cn("text-[12px] font-bold leading-tight hover:underline", nameColor(role))}
                    >
                      {name}
                    </Link>
                    {mine && <span className="text-[9px] font-bold uppercase tracking-wider text-muted">(you)</span>}
                    {role && role !== "member" && role !== "guest" && <RoleBadge role={role} />}
                    <time className="text-[9px] tabular-nums text-muted">
                      {new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words text-[13.5px] leading-snug text-foreground/95">
                  {m.body}
                </p>
              </div>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  aria-label={mine ? "Delete your message" : "Delete message (staff)"}
                  title={mine ? "Delete your message" : "Delete message (staff)"}
                  className="absolute right-2 top-2 rounded-md border border-line bg-panel2 p-1.5 text-muted opacity-0 transition-opacity hover:border-[#4a2323] hover:text-[#ff9d92] focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* jump-to-latest pill */}
      {missed > 0 && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-[#0b2b35] px-3 py-1.5 text-[11px] font-bold text-accent shadow-lg shadow-accent/10 hover:bg-[#10333f]"
        >
          <ArrowDown size={13} /> {missed} new
        </button>
      )}

      {/* composer */}
      <p className="h-5 shrink-0 px-4 pt-1 text-[10px] font-semibold italic text-accent" aria-live="polite">
        {typingNames.length > 0
          ? `${typingNames.join(", ")} ${typingNames.length === 1 ? "is" : "are"} typing…`
          : ""}
      </p>
      <form ref={formRef} action={formAction} className="shrink-0 border-t border-line bg-panel p-2.5 sm:p-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-line bg-panel2 pl-4 pr-2 transition-colors focus-within:border-accent/50"
          )}
        >
          <label htmlFor="global-body" className="sr-only">Global message</label>
          <input
            id="global-body"
            name="body"
            autoComplete="off"
            placeholder="Message #the-island"
            maxLength={500}
            required
            onChange={(e) => {
              setBodyLength(e.target.value.length);
              notifyTyping();
            }}
            className="h-12 min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted"
          />
          <span
            className={cn(
              "text-[10px] font-semibold tabular-nums",
              bodyLength > 450 ? "text-gold" : "text-muted"
            )}
            aria-live="polite"
          >
            {bodyLength}/500
          </span>
          <button
            type="submit"
            disabled={pending}
            aria-label="Send message"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[#052631] transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending ? <Loader2 size={17} className="animate-spin" /> : <SendHorizontal size={17} />}
          </button>
        </div>
      </form>
      {(state.error || deleteError) && (
        <p role="alert" className="shrink-0 border-t border-line bg-panel px-4 py-2 text-xs text-[#ff9d92]">
          {state.error ?? deleteError}
        </p>
      )}
    </section>
  );
}
