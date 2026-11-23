"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations";
import { uploadAvatar, avatarFileFrom, deleteStaleAvatars } from "@/lib/avatar-upload";
import { levelProgress } from "@/lib/level";
import { FRAMES } from "@/lib/frames";

export interface ProfileFormState {
  error?: string;
  notice?: string;
  unlockedAchievement?: string | null;
}

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    display_name: formData.get("display_name"),
    bio: formData.get("bio") ?? "",
    status: formData.get("status") ?? "",
    avatar_url: formData.get("avatar_url"),
    banner_url: formData.get("banner_url") ?? "/banners/field.png",
    privacy: formData.get("privacy"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;
  let avatarUrl: string = input.avatar_url;

  // Optional custom avatar upload overrides the picked default.
  const avatarFile = avatarFileFrom(formData);
  if (avatarFile) {
    const uploaded = await uploadAvatar(user.id, avatarFile);
    if (!uploaded.url) {
      return { error: uploaded.error ?? "Avatar upload failed." };
    }
    avatarUrl = uploaded.url;
  }

  // username uniqueness (RLS already scopes what we can see, so check directly)
  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", input.username)
    .neq("id", user.id)
    .maybeSingle();
  if (taken) return { error: "That username is taken." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username: input.username,
      display_name: input.display_name,
      bio: input.bio,
      status: input.status,
      avatar_url: avatarUrl,
      banner_url: input.banner_url,
      privacy: input.privacy,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };
  if (avatarFile && avatarUrl.startsWith("http")) {
    await deleteStaleAvatars(user.id, avatarUrl);
  }

  // Completing your profile (name + bio + status) unlocks "first_steps".
  let unlockedAchievement: string | null = null;
  const { data: granted } = await supabase.rpc("complete_profile_check");
  if (granted === true) unlockedAchievement = "First Steps";

  revalidatePath("/profile");
  revalidatePath(`/u/${input.username}`);
  revalidatePath("/home");
  return {
    notice: "Profile saved.",
    unlockedAchievement,
  };
}

export interface FrameFormState {
  error?: string;
  notice?: string;
}

export async function updateFrameAction(
  _prev: FrameFormState,
  formData: FormData
): Promise<FrameFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const slug = String(formData.get("frame_slug") ?? "");
  const frame = FRAMES.find((f) => f.slug === slug);
  if (!frame) return { error: "Unknown frame." };

  const { data: profile, error: loadError } = await supabase
    .from("profiles")
    .select("xp, username")
    .eq("id", user.id)
    .maybeSingle();
  if (loadError || !profile) return { error: "Could not load your profile." };

  const level = levelProgress(profile.xp ?? 0).level;
  if (level < frame.minLevel) {
    return {
      error: `${frame.name} unlocks at level ${frame.minLevel} — you are level ${level}.`,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ frame_slug: frame.slug })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath(`/u/${profile.username}`);
  return { notice: `${frame.name} equipped.` };
}
