export type AppRole =
  | "guest"
  | "member"
  | "contributor"
  | "moderator"
  | "admin"
  | "owner";

export type Privacy = "public" | "friends" | "private";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  status: string;
  avatar_url: string;
  banner_url: string;
  frame_slug: string;
  privacy: Privacy;
  role: AppRole;
  xp: number;
  coins: number;
  created_at: string;
}

export interface Achievement {
  slug: string;
  name: string;
  description: string;
  xp_reward: number;
}

export interface EarnedAchievement {
  earned_at: string;
  achievement: Achievement;
}

export interface AuditEntry {
  id: number;
  actor_id: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  guest: "Guest",
  member: "Member",
  contributor: "Contributor",
  moderator: "Moderator",
  admin: "Administrator",
  owner: "Owner",
};

export const AVATARS = [
  "/avatars/hooded.png",
  "/avatars/fox.png",
  "/avatars/slime.png",
  "/avatars/knight.png",
] as const;

export type AvatarPath = (typeof AVATARS)[number];

export type FriendStatus = "pending" | "accepted" | "declined" | "blocked";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

/** Conversation with the peer's (other member's) profile and unread info. */
export interface ConversationSummary {
  id: string;
  last_message_at: string | null;
  peer: Profile;
  lastMessage: Pick<Message, "body" | "sender_id" | "created_at"> | null;
  unreadCount: number;
}

export interface GlobalMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export type GlobalMessageSender = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_url" | "frame_slug" | "role"
>;

export interface GlobalMessageWithSender extends GlobalMessage {
  /** null when the sender's profile is not visible to the viewer (RLS). */
  sender: GlobalMessageSender | null;
}
