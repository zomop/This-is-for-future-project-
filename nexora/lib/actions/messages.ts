"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations";

export interface MessageFormState {
  error?: string;
  notice?: string;
}

export async function sendMessageAction(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const conversationId = String(formData.get("conversationId") ?? "");
  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }
  if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return { error: "Invalid conversation" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: `Could not send: ${error.message}` };

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return {};
}

/** Mark all messages not sent by me as read. Called when the thread mounts. */
export async function markConversationReadAction(conversationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);
  revalidatePath("/messages");
}
