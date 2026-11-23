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
