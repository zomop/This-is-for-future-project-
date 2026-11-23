"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TyperEntry {
  name: string;
  at: number;
}

const TYPING_TTL_MS = 3500;
const SEND_THROTTLE_MS = 1200;

/**
 * Typing indicator over Supabase Realtime broadcast.
 *
 * `useTyping(topic, meId, myName)` joins the same topic the chat's data channel
 * uses and exchanges ephemeral `{userId, name}` "typing" pings. Names vanish
 * after TYPING_TTL_MS of silence. Returns:
 *   - typingNames: other people currently typing (for the UI line)
 *   - notifyTyping(): call on composer input (throttled internally)
 */
export function useTyping(topic: string, meId: string, myName: string) {
  const [typers, setTypers] = useState<Record<string, TyperEntry>>({});
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const lastSentRef = useRef(0);

  // Join the broadcast channel and prune stale typers.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`${topic}:typing`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { userId, name } = (payload ?? {}) as { userId?: string; name?: string };
        if (!userId || userId === meId || !name) return;
        setTypers((prev) => ({ ...prev, [userId]: { name, at: Date.now() } }));
      })
      .subscribe();
    channelRef.current = channel;

    const prune = setInterval(() => {
      setTypers((prev) => {
        const now = Date.now();
        const next: Record<string, TyperEntry> = {};
        let changed = false;
        for (const [id, entry] of Object.entries(prev)) {
          if (now - entry.at < TYPING_TTL_MS) next[id] = entry;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1500);

    return () => {
      clearInterval(prune);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [topic, meId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < SEND_THROTTLE_MS) return;
    lastSentRef.current = now;
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: meId, name: myName },
    });
  }, [meId, myName]);

  const typingNames = Object.values(typers).map((t) => t.name);

  return { typingNames, notifyTyping };
}
