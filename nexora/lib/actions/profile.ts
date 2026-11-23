"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations";

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
    privacy: formData.get("privacy"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

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
      avatar_url: input.avatar_url,
      privacy: input.privacy,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

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
