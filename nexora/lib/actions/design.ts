"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bannerUrlSchema, accentThemeSchema } from "@/lib/validations";

export interface DesignFormState {
  error?: string;
  notice?: string;
}

function revalidateDesign(username: string) {
  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath(`/u/${username}`);
}

/** Instant-apply profile banner (classic art or `pix:<variant>` animated scene). */
export async function updateBannerAction(
  _prev: DesignFormState,
  formData: FormData
): Promise<DesignFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = bannerUrlSchema.safeParse(formData.get("banner_url"));
  if (!parsed.success) return { error: "Unknown banner." };

  const { data: profile, error: loadError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (loadError || !profile) return { error: "Could not load your profile." };

  const { error } = await supabase
    .from("profiles")
    .update({ banner_url: parsed.data })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidateDesign(profile.username);
  return { notice: "Banner updated." };
}

/** Instant-apply accent theme for the site chrome. */
export async function updateAccentAction(
  _prev: DesignFormState,
  formData: FormData
): Promise<DesignFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = accentThemeSchema.safeParse(formData.get("accent_theme"));
  if (!parsed.success) return { error: "Unknown accent theme." };

  const { data: profile, error: loadError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (loadError || !profile) return { error: "Could not load your profile." };

  const { error } = await supabase
    .from("profiles")
    .update({ accent_theme: parsed.data })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidateDesign(profile.username);
  return { notice: "Accent color updated." };
}
