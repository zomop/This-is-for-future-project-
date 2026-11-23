import { createClient } from "@/lib/supabase/server";
import { escapeLikePattern, friendRelation } from "@/lib/utils";
import type {
  Achievement,
  AuditEntry,
  Community,
  CommunityInvite,
  CommunityMemberRow,
  CommunityMessage,
  CommunityMessageWithSender,
  CommunityRole,
  CommunityWithMeta,
  ConversationSummary,
  EarnedAchievement,
  FriendStatus,
  GlobalMessage,
  GlobalMessageSender,
  GlobalMessageWithSender,
  Message,
  PersonRelation,
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
      "id, username, display_name, bio, status, avatar_url, banner_url, frame_slug, privacy, role, xp, coins, created_at"
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
      "id, username, display_name, bio, status, avatar_url, banner_url, frame_slug, privacy, role, xp, coins, created_at"
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
  "id, username, display_name, bio, status, avatar_url, banner_url, frame_slug, privacy, role, xp, coins, created_at";

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

// ============ Global chat ============

const GLOBAL_SENDER_COLS = "id, username, display_name, avatar_url, frame_slug, role";

export async function getGlobalMessages(limit = 120): Promise<GlobalMessageWithSender[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("global_messages")
    .select("id, sender_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load global chat: ${error.message}`);
  const messages = ((rows ?? []) as GlobalMessage[]).reverse();

  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  let senderById = new Map<string, GlobalMessageSender>();
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from("profiles")
      .select(GLOBAL_SENDER_COLS)
      .in("id", senderIds);
    senderById = new Map(
      (senders ?? []).map((p) => [p.id as string, p as unknown as GlobalMessageSender])
    );
  }
  return messages.map((m) => ({ ...m, sender: senderById.get(m.sender_id) ?? null }));
}

// ============ Home feed ============

const FEED_PROFILE_COLS = PROFILE_COLS;

/** Newest realm members (non-private), for the home feed. */
export async function getNewestMembers(limit = 6): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(FEED_PROFILE_COLS)
    .neq("privacy", "private")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load newest members: ${error.message}`);
  return (data ?? []) as Profile[];
}

export interface RealmUnlock {
  earned_at: string;
  achievementSlug: string;
  achievementName: string;
  xpReward: number;
  /** Null when the earner's profile is hidden by privacy. */
  profile: Profile | null;
}

/** Latest achievements unlocked anywhere in the realm (public feed). */
export async function getRealmAchievements(limit = 6): Promise<RealmUnlock[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("user_achievements")
    .select("user_id, earned_at, achievement:achievements(slug, name, xp_reward)")
    .order("earned_at", { ascending: false })
    .limit(limit * 3); // some rows may be filtered out by privacy below
  if (error) throw new Error(`Failed to load realm achievements: ${error.message}`);

  type Row = {
    user_id: string;
    earned_at: string;
    achievement: { slug: string; name: string; xp_reward: number } | null;
  };
  const parsed = ((rows ?? []) as unknown as Row[]).filter((r) => r.achievement);

  const ids = [...new Set(parsed.map((r) => r.user_id))];
  let profileById = new Map<string, Profile>();
  if (ids.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select(FEED_PROFILE_COLS)
      .in("id", ids)
      .neq("privacy", "private");
    profileById = new Map((profs ?? []).map((p) => [p.id as string, p as Profile]));
  }

  const unlocks: RealmUnlock[] = [];
  for (const r of parsed) {
    const profile = profileById.get(r.user_id) ?? null;
    if (!profile) continue; // private earner — skip rather than leak
    unlocks.push({
      earned_at: r.earned_at,
      achievementSlug: r.achievement!.slug,
      achievementName: r.achievement!.name,
      xpReward: r.achievement!.xp_reward,
      profile,
    });
    if (unlocks.length >= limit) break;
  }
  return unlocks;
}

/** Staff roster (moderator+), shown in the global chat rail. */
export async function getStaffMembers(limit = 8): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(FEED_PROFILE_COLS)
    .in("role", ["owner", "admin", "moderator"])
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Failed to load staff: ${error.message}`);
  const rank = { owner: 0, admin: 1, moderator: 2 } as const;
  return ((data ?? []) as Profile[]).sort(
    (a, b) => rank[a.role as keyof typeof rank] - rank[b.role as keyof typeof rank]
  );
}

// ============ Discover ============

export interface XpMover {
  /** XP earned from achievements in the last 7 days. */
  weeklyXp: number;
  profile: Profile;
}

/**
 * Travelers who earned the most XP in the last 7 days.
 * Weekly XP is derived from achievement awards (user_achievements.earned_at) —
 * the only source of XP in the game — so it reflects real activity.
 * Private profiles are skipped rather than leaked.
 */
export async function getWeeklyXpMovers(limit = 6): Promise<XpMover[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await supabase
    .from("user_achievements")
    .select("user_id, achievement:achievements(xp_reward)")
    .gte("earned_at", since)
    .limit(2000); // week's awards across the realm; aggregated below
  if (error) throw new Error(`Failed to load weekly XP: ${error.message}`);

  type Row = { user_id: string; achievement: { xp_reward: number } | null };
  const totals = new Map<string, number>();
  for (const r of (rows ?? []) as unknown as Row[]) {
    if (!r.achievement) continue;
    totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + r.achievement.xp_reward);
  }

  const ids = [...totals.keys()];
  if (ids.length === 0) return [];

  const { data: profs } = await supabase
    .from("profiles")
    .select(FEED_PROFILE_COLS)
    .in("id", ids)
    .neq("privacy", "private");
  const profileById = new Map((profs ?? []).map((p) => [p.id as string, p as Profile]));

  return ids
    .map((id) => ({ weeklyXp: totals.get(id) ?? 0, profile: profileById.get(id) }))
    .filter((m): m is XpMover => Boolean(m.profile))
    .sort(
      (a, b) =>
        b.weeklyXp - a.weeklyXp || a.profile.username.localeCompare(b.profile.username)
    )
    .slice(0, limit);
}

export interface PersonHit {
  profile: Profile;
  relation: PersonRelation;
  /** Present for pending/accepted pairs so the UI can act on the friendship row. */
  friendshipId: string | null;
}

/**
 * People search for Discover: username or display-name match, non-private
 * profiles only, never the viewer themselves. Query input is sanitized for the
 * PostgREST or() DSL before interpolation.
 */
export async function searchPeople(rawQuery: string, limit = 12): Promise<PersonHit[]> {
  const pattern = escapeLikePattern(rawQuery);
  if (!pattern) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profs, error } = await supabase
    .from("profiles")
    .select(FEED_PROFILE_COLS)
    .or(`username.ilike.%${pattern}%,display_name.ilike.%${pattern}%`)
    .neq("privacy", "private")
    .neq("id", user.id)
    .order("username", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Failed to search people: ${error.message}`);
  const profiles = (profs ?? []) as Profile[];
  if (profiles.length === 0) return [];

  const ids = new Set(profiles.map((p) => p.id));
  const { data: rels } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  const relByOther = new Map<
    string,
    { id: string; status: FriendStatus; iAmRequester: boolean }
  >();
  for (const r of rels ?? []) {
    const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
    if (!ids.has(otherId)) continue;
    relByOther.set(otherId, {
      id: r.id,
      status: r.status as FriendStatus,
      iAmRequester: r.requester_id === user.id,
    });
  }

  return profiles.map((profile) => {
    const rel = relByOther.get(profile.id);
    return {
      profile,
      relation: friendRelation(rel?.status ?? null, rel?.iAmRequester ?? true),
      friendshipId: rel && (rel.status === "pending" || rel.status === "accepted") ? rel.id : null,
    };
  });
}

// ============ Communities ============

type CommunityRow = Community;

function withMeta(
  row: CommunityRow,
  memberCount: number,
  myRole: CommunityRole | null
): CommunityWithMeta {
  return { ...row, memberCount, myRole };
}

/** Communities the viewer belongs to, newest activity first. */
export async function getMyCommunities(): Promise<CommunityWithMeta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error } = await supabase
    .from("community_members")
    .select("role, community:communities(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });
  if (error) throw new Error(`Failed to load your communities: ${error.message}`);

  type Row = { role: CommunityRole; community: CommunityRow | null };
  const rows = ((memberships ?? []) as unknown as Row[]).filter((r) => r.community);
  if (rows.length === 0) return [];

  const counts = await getMemberCounts(rows.map((r) => r.community!.id));
  return rows.map((r) =>
    withMeta(r.community!, counts.get(r.community!.id) ?? 1, r.role)
  );
}

/** Public communities the viewer has not joined (Discover strip). */
export async function getDiscoverCommunities(limit = 8): Promise<CommunityWithMeta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: mine } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", user.id);
  const mineIds = (mine ?? []).map((m) => m.community_id);

  let query = supabase
    .from("communities")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit + mineIds.length);
  if (mineIds.length > 0) query = query.not("id", "in", `(${mineIds.join(",")})`);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load communities: ${error.message}`);

  const rows = ((data ?? []) as CommunityRow[]).slice(0, limit);
  const counts = await getMemberCounts(rows.map((r) => r.id));
  return rows.map((r) => withMeta(r, counts.get(r.id) ?? 1, null));
}

async function getMemberCounts(ids: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ids.length === 0) return counts;
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("community_id")
    .in("community_id", ids);
  for (const row of data ?? []) {
    counts.set(row.community_id, (counts.get(row.community_id) ?? 0) + 1);
  }
  return counts;
}

export interface CommunityDetail extends CommunityWithMeta {
  /** Viewer's community-role for delete/mod powers in the chat UI. */
  canModerate: boolean;
}

export async function getCommunityBySlug(slug: string): Promise<CommunityDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!community) return null; // missing or hidden by RLS

  const { data: myRow } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const counts = await getMemberCounts([community.id]);

  const myRole = (myRow?.role as CommunityRole | undefined) ?? null;
  return {
    ...withMeta(community as CommunityRow, counts.get(community.id) ?? 1, myRole),
    canModerate: myRole === "owner" || myRole === "moderator",
  };
}

/** Community chat history (newest first from DB, returned oldest-first for display). */
export async function getCommunityMessages(
  communityId: string,
  limit = 120
): Promise<CommunityMessageWithSender[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("community_messages")
    .select("id, community_id, sender_id, body, created_at")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load community chat: ${error.message}`);
  const messages = ((rows ?? []) as CommunityMessage[]).reverse();

  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  let senderById = new Map<string, GlobalMessageSender>();
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from("profiles")
      .select(GLOBAL_SENDER_COLS)
      .in("id", senderIds);
    senderById = new Map(
      (senders ?? []).map((p) => [p.id as string, p as unknown as GlobalMessageSender])
    );
  }
  return messages.map((m) => ({ ...m, sender: senderById.get(m.sender_id) ?? null }));
}

/** Members of a community with their community role (owner, then moderators, then members). */
export async function getCommunityMembers(
  communityId: string,
  limit = 60
): Promise<CommunityMemberRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("community_members")
    .select("role, joined_at, profile:profiles(*)")
    .eq("community_id", communityId)
    .limit(limit);
  if (error) throw new Error(`Failed to load community members: ${error.message}`);

  type Row = { role: CommunityRole; joined_at: string; profile: Profile | null };
  const parsed = ((rows ?? []) as unknown as Row[]).filter((r) => r.profile);
  const rank: Record<string, number> = { owner: 0, moderator: 1, member: 2 };
  return parsed
    .map((r) => ({ role: r.role, joined_at: r.joined_at, profile: r.profile! }))
    .sort(
      (a, b) =>
        (rank[a.role] ?? 3) - (rank[b.role] ?? 3) ||
        a.profile.username.localeCompare(b.profile.username)
    );
}

/** Active invite links (owner/moderator view; RLS enforces). */
export async function getCommunityInvites(communityId: string): Promise<CommunityInvite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_invites")
    .select("code, community_id, created_by, created_at, max_uses, uses")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(`Failed to load invites: ${error.message}`);
  return (data ?? []) as CommunityInvite[];
}

export type { CommunityRole };
