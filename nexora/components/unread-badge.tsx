"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Live unread-DM count for the sidebar. Counts messages addressed to me
 * (RLS scopes the query to my conversations) and bumps on Realtime INSERTs.
 * Re-checks on window focus so reading a thread clears the badge.
 */
export function UnreadBadge({ meId }: { meId: string }) {
  const [count, setCount] = useState(0);
  const uid = useId();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const refresh = () => {
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .neq("sender_id", meId)
        .then(({ count }) => {
          if (active) setCount(count ?? 0);
        });
    };

    refresh();
    window.addEventListener("focus", refresh);

    const channel = supabase
      .channel(`unread-badge:${meId}:${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { sender_id?: string };
          if (msg.sender_id && msg.sender_id !== meId) setCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      supabase.removeChannel(channel);
    };
  }, [meId, uid]);

  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread messages`}
      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-extrabold tabular-nums text-[#062630]"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
