import { createClient } from "@/lib/supabase/server";
import type {
  Achievement,
  AuditEntry,
  EarnedAchievement,
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
