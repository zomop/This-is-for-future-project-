"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SendHorizontal, Loader2, Trash2, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  sendGlobalMessageAction,
  deleteGlobalMessageAction,
  type GlobalChatFormState,
} from "@/lib/actions/global-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/ui/badge";
import { FramedAvatar } from "@/components/framed-avatar";
import { cn } from "@/lib/utils";
import type { AppRole, GlobalMessage, GlobalMessageSender, GlobalMessageWithSender } from "@/lib/types";

const initial: GlobalChatFormState = {};
const SENDER_COLS = "id, username, display_name, avatar_url, frame_slug, role";
const STAFF_ROLES: AppRole[] = ["moderator", "admin", "owner"];

export function GlobalChat({
  meId,
  myRole,
  initialMessages,
}: {
  meId: string;
  myRole: AppRole;
  initialMessages: GlobalMessageWithSender[];
}) {
  const [messages, setMessages] = useState<GlobalMessageWithSender[]>(initialMessages);
  const [state, formAction, pending] = useActionState(sendGlobalMessageAction, initial);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStaff = STAFF_ROLES.includes(myRole);

  // Live sync: INSERT appends (fetching the sender lazily when unknown),
  // DELETE removes for everyone — staff deletions propagate instantly.
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

  // Keep the view pinned to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Clear the composer after a successful send.
  const prevPending = useRef(pending);
  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
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
      className="flex h-[68vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      aria-label="Global chat"
    >
      {/* message list */}
      <div
        className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(ellipse_at_bottom,#10151f_0%,#0d1017_70%)] px-4 py-4 sm:px-6"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <div className="pt-16 text-center">
            <Globe size={28} className="mx-auto text-muted" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-foreground">The island is quiet… for now.</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
              Be the first voice in the global channel. Everyone signed in can see this.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          const sender = m.sender;
          const name = sender?.display_name ?? "Traveler";
          const canDelete = mine || isStaff;
          return (
            <div key={m.id} className={cn("group flex items-end gap-2.5", mine && "flex-row-reverse")}>
              {!mine && (
                <FramedAvatar
                  src={sender?.avatar_url ?? "/avatars/hooded.png"}
                  alt=""
                  size={34}
                  frame={sender?.frame_slug}
                  className="border border-line"
                />
              )}
              <div className={cn("flex max-w-[78%] flex-col sm:max-w-[65%]", mine && "items-end")}>
                {!mine && (
                  <span className="mb-0.5 flex items-center gap-1.5 pl-1">
                    <span className="text-[10px] font-bold text-muted">{name}</span>
                    {sender && sender.role !== "member" && sender.role !== "guest" && (
                      <RoleBadge role={sender.role} />
                    )}
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-[13.5px] leading-snug shadow-sm",
                    mine
                      ? "rounded-br-md bg-accent text-[#052631]"
                      : "rounded-bl-md border border-line bg-panel2 text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
                <span className="mt-0.5 flex items-center gap-2 px-1">
                  <time className="text-[9px] font-semibold uppercase tracking-wider text-muted">
                    {new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      aria-label={mine ? "Delete your message" : "Delete message (staff)"}
                      title={mine ? "Delete your message" : "Delete message (staff)"}
                      className="rounded p-0.5 text-muted opacity-0 transition-opacity hover:text-[#ff9d92] focus:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 size={12} strokeWidth={2} />
                    </button>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <form
        ref={formRef}
        action={formAction}
        className="flex items-center gap-2 border-t border-line bg-panel px-3 py-3"
      >
        <Input
          name="body"
          autoComplete="off"
          placeholder="Say something to the island…"
          aria-label="Global message"
          maxLength={500}
          required
          className="h-11 rounded-xl"
        />
        <Button type="submit" variant="accent" size="icon" disabled={pending} aria-label="Send message">
          {pending ? <Loader2 size={17} className="animate-spin" /> : <SendHorizontal size={17} />}
        </Button>
      </form>
      {(state.error || deleteError) && (
        <p role="alert" className="border-t border-line bg-panel px-4 py-2 text-xs text-[#ff9d92]">
          {state.error ?? deleteError}
        </p>
      )}
    </section>
  );
}
