import { createClient } from "@/lib/supabase/server";
import type {
  Achievement,
  AuditEntry,
  ConversationSummary,
  EarnedAchievement,
  Message,
  Profile,
} from "@/lib/types";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, status, avatar_url, banner_url, privacy, role, xp, coins, created_at"
    )
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return (data as Profile | null) ?? null;
}

export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, status, avatar_url, banner_url, privacy, role, xp, coins, created_at"
    )
    .ilike("username", username)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return (data as Profile | null) ?? null;
}

export async function getEarnedAchievements(
  userId: string
): Promise<EarnedAchievement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_achievements")
    .select("earned_at, achievement:achievements(slug, name, description, xp_reward)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) throw new Error(`Failed to load achievements: ${error.message}`);
  return ((data ?? []) as unknown as { earned_at: string; achievement: Achievement }[]).map(
    (row) => ({ earned_at: row.earned_at, achievement: row.achievement })
  );
}

export async function getAuditLog(limit = 50): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, target, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load audit log: ${error.message}`);
  return (data ?? []) as AuditEntry[];
}

export function memberMonths(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44)));
}

// ============ P2: friends & messages ============

const PROFILE_COLS =
  "id, username, display_name, bio, status, avatar_url, banner_url, privacy, role, xp, coins, created_at";

export interface FriendsOverview {
  /** Accepted friends with their profiles. */
  accepted: Profile[];
  /** Incoming pending requests (someone -> me), with the requester's profile. */
  incoming: { friendshipId: string; profile: Profile }[];
  /** Outgoing pending requests (me -> someone), with the addressee's profile. */
  outgoing: { friendshipId: string; profile: Profile }[];
}

export async function getFriendsOverview(): Promise<FriendsOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { accepted: [], incoming: [], outgoing: [] };

  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .neq("status", "declined")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load friendships: ${error.message}`);

  const otherIds = [
    ...new Set(
      (rows ?? []).map((r) =>
        r.requester_id === user.id ? r.addressee_id : r.requester_id
      )
    ),
  ];
  let profiles = new Map<string, Profile>();
  if (otherIds.length > 0) {
    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .in("id", otherIds);
    if (pErr) throw new Error(`Failed to load friend profiles: ${pErr.message}`);
    profiles = new Map((profs ?? []).map((p) => [p.id, p as Profile]));
  }

  const accepted: Profile[] = [];
  const incoming: { friendshipId: string; profile: Profile }[] = [];
  const outgoing: { friendshipId: string; profile: Profile }[] = [];

  for (const r of rows ?? []) {
    const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
    const profile = profiles.get(otherId);
    if (!profile) continue; // blocked users who hid profiles / RLS edge
    if (r.status === "accepted") accepted.push(profile);
    else if (r.status === "pending" && r.addressee_id === user.id)
      incoming.push({ friendshipId: r.id, profile });
    else if (r.status === "pending" && r.requester_id === user.id)
      outgoing.push({ friendshipId: r.id, profile });
  }
  return { accepted, incoming, outgoing };
}

export async function getConversationSummaries(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error: mErr } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", user.id);
  if (mErr) throw new Error(`Failed to load conversations: ${mErr.message}`);
  const conversationIds = (memberships ?? []).map((m) => m.conversation_id);
  if (conversationIds.length === 0) return [];

  const [{ data: convs }, { data: members }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, last_message_at")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds),
  ]);

  const peerIdByConversation = new Map<string, string>();
  for (const m of members ?? []) {
    if (m.user_id !== user.id) peerIdByConversation.set(m.conversation_id, m.user_id);
  }
  const peerIds = [...new Set(peerIdByConversation.values())];
  const { data: peers } = peerIds.length
    ? await supabase.from("profiles").select(PROFILE_COLS).in("id", peerIds)
    : { data: [] };
  const peerById = new Map((peers ?? []).map((p) => [p.id, p as Profile]));

  const { data: unread } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .is("read_at", null)
    .neq("sender_id", user.id);
  const unreadByConversation = new Map<string, number>();
  for (const u of unread ?? [])
    unreadByConversation.set(u.conversation_id, (unreadByConversation.get(u.conversation_id) ?? 0) + 1);

  const { data: recent } = await supabase
    .from("messages")
    .select("conversation_id, body, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(conversationIds.length * 3);
  const lastByConversation = new Map<string, ConversationSummary["lastMessage"]>();
  for (const msg of recent ?? []) {
    if (!lastByConversation.has(msg.conversation_id))
      lastByConversation.set(msg.conversation_id, msg);
  }

  const summaries: ConversationSummary[] = [];
  for (const c of convs ?? []) {
    const peerId = peerIdByConversation.get(c.id);
    const peer = peerId ? peerById.get(peerId) : undefined;
    if (!peer) continue;
    summaries.push({
      id: c.id,
      last_message_at: c.last_message_at,
      peer,
      lastMessage: lastByConversation.get(c.id) ?? null,
      unreadCount: unreadByConversation.get(c.id) ?? 0,
    });
  }
  return summaries;
}

export interface ConversationDetail {
  id: string;
  peer: Profile;
  messages: Message[];
}

export async function getConversation(
  conversationId: string
): Promise<ConversationDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return null; // RLS hides non-member conversations

  const { data: members } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);
  const peerId = (members ?? []).map((m) => m.user_id).find((id) => id !== user.id);
  if (!peerId) return null;
  const { data: peer } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("id", peerId)
    .maybeSingle();
  if (!peer) return null;

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(`Failed to load messages: ${error.message}`);

  return { id: conversationId, peer: peer as Profile, messages: (messages ?? []) as Message[] };
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("slug, name, description, xp_reward")
    .order("xp_reward", { ascending: true });
  if (error) throw new Error(`Failed to load achievements: ${error.message}`);
  return (data ?? []) as Achievement[];
}
