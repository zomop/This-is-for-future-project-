"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string;
  read_at: string | null;
  created_at: string;
  actor: { display_name: string; username: string; avatar_url: string } | null;
}

export interface NotificationsResult {
  count: number;
  items: NotificationItem[];
}

/** Latest notifications + unread count for the signed-in user. */
export async function getNotificationsAction(): Promise<NotificationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { count: 0, items: [] };

  const [{ count }, { data: rows }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    supabase
      .from("notifications")
      .select("id, kind, title, body, link, read_at, created_at, actor_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const actorIds = [...new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", actorIds)
    : { data: [] };
  const actorById = new Map((actors ?? []).map((a) => [a.id, a]));

  return {
    count: count ?? 0,
    items: (rows ?? []).map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body,
      link: r.link,
      read_at: r.read_at,
      created_at: r.created_at,
      actor: r.actor_id
        ? (() => {
            const a = actorById.get(r.actor_id);
            return a
              ? { display_name: a.display_name, username: a.username, avatar_url: a.avatar_url }
              : null;
          })()
        : null,
    })),
  };
}

/** Mark every notification read. RLS limits the update to the caller's rows. */
export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
}
