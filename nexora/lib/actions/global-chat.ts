"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { globalMessageSchema } from "@/lib/validations";

export interface GlobalChatFormState {
  error?: string;
}

/** Server-side rate limit: max 30 global messages per rolling minute. */
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX = 30;
const STAFF_ROLES = ["moderator", "admin", "owner"] as const;

export async function sendGlobalMessageAction(
  _prev: GlobalChatFormState,
  formData: FormData
): Promise<GlobalChatFormState> {
  const parsed = globalMessageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const since = new Date(Date.now() - RATE_WINDOW_SECONDS * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("global_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .gte("created_at", since);
  if (countError) return { error: countError.message };
  if ((count ?? 0) >= RATE_MAX) {
    return { error: "Easy, traveler — 30 messages per minute. Take a breath." };
  }

  const { error } = await supabase.from("global_messages").insert({
    sender_id: user.id,
    body: parsed.data.body,
  });
  if (error) {
    if (error.message.toLowerCase().includes("row-level security")) {
      return { error: "Your account can't post in the global chat yet." };
    }
    return { error: error.message };
  }
  return {};
}

export interface GlobalChatDeleteResult {
  error?: string;
  deletedId?: string;
}

export async function deleteGlobalMessageAction(
  messageId: string
): Promise<GlobalChatDeleteResult> {
  const id = String(messageId ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid message id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  // RLS enforces sender-or-staff; fetch for a friendly error either way.
  const { data: target } = await supabase
    .from("global_messages")
    .select("id, sender_id")
    .eq("id", id)
    .maybeSingle();
  if (!target) return { error: "Message not found." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isStaff = STAFF_ROLES.includes((me?.role ?? "member") as (typeof STAFF_ROLES)[number]);
  if (target.sender_id !== user.id && !isStaff) {
    return { error: "You can only delete your own messages." };
  }

  const { error } = await supabase.from("global_messages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/global");
  return { deletedId: id };
}
