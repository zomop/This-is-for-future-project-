"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, UserPlus, MessageCircle, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  type NotificationItem,
} from "@/lib/actions/notifications";
import { FramedAvatar } from "@/components/framed-avatar";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<string, typeof Bell> = {
  friend_request: UserPlus,
  dm: MessageCircle,
  community_invite: Inbox,
  achievement: CheckCheck,
  system: Inbox,
};

/**
 * Notifications bell — unread count, a dropdown feed, mark-all-read, and live
 * updates over Supabase Realtime (rows are written by DB triggers only; RLS
 * lets each user read and clear their own).
 */
export function NotificationsBell({ meId, className }: { meId: string; className?: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    const res = await getNotificationsAction();
    setItems(res.items);
    setCount(res.count);
    setLoading(false);
  }, []);

  // Initial load.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void refresh();
  }, [refresh]);

  // Live updates: any notification row change for me refreshes the feed.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${meId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${meId}` },
        () => {
          void refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [meId, refresh]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        className="relative rounded-xl border border-line bg-panel2 p-2 text-foreground transition-colors hover:border-panel3 hover:bg-panel3/50"
      >
        <Bell size={17} strokeWidth={1.9} />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#e5484d] px-1 text-[9px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-[300px] overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
                Notifications
              </p>
              {count > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await markAllNotificationsReadAction();
                    await refresh();
                    setBusy(false);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:underline disabled:opacity-50"
                >
                  {busy ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[340px] overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-center text-xs text-muted">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted">
                  Nothing yet — friend requests and messages will show up here.
                </p>
              ) : (
                items.map((n) => {
                  const Icon = KIND_ICON[n.kind] ?? Inbox;
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-start gap-2.5 border-b border-line/60 px-4 py-3 transition-colors hover:bg-panel2/70",
                        !n.read_at && "bg-accent/[0.06]"
                      )}
                    >
                      {n.actor ? (
                        <FramedAvatar
                          src={n.actor.avatar_url}
                          alt=""
                          size={30}
                          className="border border-line"
                        />
                      ) : (
                        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-line bg-panel2 text-accent">
                          <Icon size={14} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-semibold leading-tight text-foreground">
                          {n.title}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[9px] uppercase tracking-wider text-muted">
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                      {!n.read_at && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
