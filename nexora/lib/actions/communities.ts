"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  communityMessageSchema,
  communitySchema,
  inviteCodeSchema,
} from "@/lib/validations";

export interface CommunityFormState {
  error?: string;
  notice?: string;
}

/** Server-side rate limit: max 30 chat messages per rolling minute (all channels). */
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX = 30;

function randomInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable 0/O/1/I
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function createCommunityAction(
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    emoji: formData.get("emoji") ?? "🏝️",
    banner_variant: formData.get("banner_variant") ?? "island",
    is_public: formData.get("is_public") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { data: taken } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (taken) return { error: "That address is taken — try another." };

  const { data: created, error } = await supabase
    .from("communities")
    .insert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      emoji: parsed.data.emoji,
      banner_variant: parsed.data.banner_variant,
      is_public: parsed.data.is_public,
      created_by: user.id,
    })
    .select("slug")
    .single();
  if (error) {
    if (error.message.toLowerCase().includes("row-level security")) {
      return { error: "Your account can't create communities yet." };
    }
    return { error: error.message };
  }

  revalidatePath("/communities");
  redirect(`/communities/${created.slug}`);
}

export async function joinCommunityAction(communityId: string): Promise<CommunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: user.id, role: "member" });
  if (error) {
    if (error.code === "23505") return { notice: "You are already a member." };
    return { error: "Could not join — it may be invite-only." };
  }
  revalidatePath("/communities");
  return { notice: "Welcome aboard!" };
}

export async function joinViaInviteAction(
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const parsed = inviteCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "Invite codes are 8 letters/digits." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { data: communityId, error } = await supabase.rpc("join_community_with_invite", {
    p_code: parsed.data.code,
  });
  if (error) return { error: error.message.replace(/^.*: /, "") };

  const { data: community } = await supabase
    .from("communities")
    .select("slug")
    .eq("id", communityId)
    .maybeSingle();
  revalidatePath("/communities");
  if (community?.slug) redirect(`/communities/${community.slug}`);
  return { notice: "Joined!" };
}

export async function leaveCommunityAction(communityId: string): Promise<CommunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);
  if (error) return { error: "Owners can't leave — delete the community instead." };
  revalidatePath("/communities");
  return { notice: "You left the community." };
}

export interface CommunityChatFormState {
  error?: string;
}

export async function sendCommunityMessageAction(
  _prev: CommunityChatFormState,
  formData: FormData
): Promise<CommunityChatFormState> {
  const parsed = communityMessageSchema.safeParse({ body: formData.get("body") });
  const communityId = formData.get("community_id");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (typeof communityId !== "string" || communityId.length === 0) {
    return { error: "Missing community." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const since = new Date(Date.now() - RATE_WINDOW_SECONDS * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("community_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .gte("created_at", since);
  if (countError) return { error: countError.message };
  if ((count ?? 0) >= RATE_MAX) {
    return { error: "Easy, traveler — 30 messages per minute. Take a breath." };
  }

  const { error } = await supabase.from("community_messages").insert({
    community_id: communityId,
    sender_id: user.id,
    body: parsed.data.body,
  });
  if (error) {
    if (error.message.toLowerCase().includes("row-level security")) {
      return { error: "Join the community to chat in it." };
    }
    return { error: error.message };
  }
  return {};
}

export interface CommunityDeleteResult {
  error?: string;
  deletedId?: string;
}

export async function deleteCommunityMessageAction(
  messageId: string
): Promise<CommunityDeleteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error } = await supabase.from("community_messages").delete().eq("id", messageId);
  if (error) return { error: "Only the sender or a community moderator can delete." };
  return { deletedId: messageId };
}

export interface InviteResult {
  error?: string;
  code?: string;
}

export async function createInviteAction(communityId: string): Promise<InviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = randomInviteCode();
    const { error } = await supabase
      .from("community_invites")
      .insert({ code, community_id: communityId, created_by: user.id });
    if (!error) {
      revalidatePath(`/communities`);
      return { code };
    }
    if (error.code !== "23505") return { error: "Only owners and moderators can invite." };
  }
  return { error: "Could not mint an invite code — try again." };
}

export async function revokeInviteAction(code: string): Promise<CommunityFormState> {
  const parsed = inviteCodeSchema.safeParse({ code });
  if (!parsed.success) return { error: "Invalid invite code." };
  const supabase = await createClient();
  const { error } = await supabase.from("community_invites").delete().eq("code", parsed.data.code);
  if (error) return { error: "Only owners and moderators can revoke invites." };
  return { notice: "Invite revoked." };
}

export async function kickMemberAction(
  communityId: string,
  userId: string
): Promise<CommunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);
  if (error) return { error: "You can't remove this member." };
  revalidatePath(`/communities`);
  return { notice: "Member removed." };
}

export async function setMemberRoleAction(
  communityId: string,
  userId: string,
  role: "moderator" | "member"
): Promise<CommunityFormState> {
  if (role !== "moderator" && role !== "member") return { error: "Invalid role." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error } = await supabase
    .from("community_members")
    .update({ role })
    .eq("community_id", communityId)
    .eq("user_id", userId);
  if (error) return { error: "Only the owner can change roles." };
  revalidatePath(`/communities`);
  return { notice: role === "moderator" ? "Promoted to moderator." : "Demoted to member." };
}

export async function deleteCommunityAction(communityId: string): Promise<CommunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error } = await supabase.from("communities").delete().eq("id", communityId);
  if (error) return { error: "Only the owner (or platform staff) can delete a community." };
  revalidatePath("/communities");
  redirect("/communities");
}
