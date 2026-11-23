"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendUsernameSchema } from "@/lib/validations";

export interface FriendFormState {
  error?: string;
  notice?: string;
}

/** Send a friend request by username. */
export async function sendFriendRequestAction(
  _prev: FriendFormState,
  formData: FormData
): Promise<FriendFormState> {
  const parsed = friendUsernameSchema.safeParse({
    username: formData.get("username"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid username" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", parsed.data.username)
    .maybeSingle();
  if (!target) return { error: `No traveler called “@${parsed.data.username}”` };
  if (target.id === user.id) return { error: "You cannot befriend yourself" };

  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status, requester_id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") return { notice: "You are already friends." };
    if (existing.status === "pending") {
      return {
        notice:
          existing.requester_id === user.id
            ? "Request already pending."
            : "They already requested you — accept it below.",
      };
    }
    if (existing.status === "blocked") return { error: "Unable to send a request." };
    // declined → send a fresh request
    const { error } = await supabase.from("friendships").delete().eq("id", existing.id);
    if (error) return { error: "Could not reset previous request." };
  }

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: target.id });
  if (error) return { error: `Could not send request: ${error.message}` };

  revalidatePath("/friends");
  return { notice: `Request sent to @${target.username}.` };
}

export async function acceptFriendRequestAction(friendshipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  revalidatePath("/friends");
  revalidatePath("/messages");
}

export async function declineFriendRequestAction(friendshipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("friendships")
    .update({ status: "declined" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  revalidatePath("/friends");
}

export async function removeFriendshipAction(friendshipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  revalidatePath("/friends");
}

/** Create (or reuse) the direct conversation with a friend and return its id. */
export async function openDirectConversationAction(
  friendId: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_or_get_direct_conversation", {
    other: friendId,
  });
  if (error) return { error: error.message };
  return { id: data as string };
}

/** Remove the friendship between the caller and friendId (both directions). */
export async function removeFriendshipByPairAction(friendId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(friendId)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`
    );
  revalidatePath("/friends");
}
