"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SendHorizontal, Loader2, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction, markConversationReadAction, type MessageFormState } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

const initial: MessageFormState = {};

export function ChatThread({
  conversationId,
  meId,
  peerName,
  initialMessages,
}: {
  conversationId: string;
  meId: string;
  peerName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [state, formAction, pending] = useActionState(sendMessageAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Live delivery: subscribe to INSERTs on messages for this conversation.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Mark peer's messages as read on mount and when new ones arrive.
  useEffect(() => {
    markConversationReadAction(conversationId);
  }, [conversationId, messages.length]);

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

  return (
    <section
      className="flex h-[68vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      aria-label={`Conversation with ${peerName}`}
    >
      {/* message list */}
      <div
        className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(ellipse_at_bottom,#10151f_0%,#0d1017_70%)] px-4 py-4 sm:px-6"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <p className="pt-16 text-center text-sm text-muted">
            No messages yet. Break the ice — {peerName} can&apos;t see a draft, only what you send.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2 text-[13.5px] leading-snug shadow-sm sm:max-w-[65%]",
                  mine
                    ? "rounded-br-md bg-accent text-[#052631]"
                    : "rounded-bl-md border border-line bg-panel2 text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1.5 text-[9px] font-semibold uppercase tracking-wider",
                    mine ? "text-[#0a4a5e]" : "text-muted"
                  )}
                >
                  {new Date(m.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {mine && (
                    <CheckCheck
                      size={12}
                      strokeWidth={2.2}
                      aria-label={m.read_at ? "Read" : "Sent"}
                      className={m.read_at ? "text-[#063a4d]" : "text-[#0a4a5e]/60"}
                    />
                  )}
                </p>
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
        <input type="hidden" name="conversationId" value={conversationId} />
        <Input
          name="body"
          autoComplete="off"
          placeholder={`Message ${peerName}…`}
          aria-label="Message"
          maxLength={2000}
          required
          className="h-11 rounded-xl"
        />
        <Button type="submit" variant="accent" size="icon" disabled={pending} aria-label="Send message">
          {pending ? <Loader2 size={17} className="animate-spin" /> : <SendHorizontal size={17} />}
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="border-t border-line bg-panel px-4 py-2 text-xs text-[#ff9d92]">
          {state.error}
        </p>
      )}
    </section>
  );
}
