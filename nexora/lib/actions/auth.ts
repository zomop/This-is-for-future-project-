"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, passwordSchema } from "@/lib/validations";
import { uploadAvatar, avatarFileFrom, deleteStaleAvatars } from "@/lib/avatar-upload";
import { z } from "zod";

export interface FormState {
  error?: string;
  notice?: string;
}

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "/home";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/home";
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    avatar_url: formData.get("avatar_url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const avatarFile = avatarFileFrom(formData);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName, avatar_url: parsed.data.avatar_url },
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      // Anti-enumeration: never confirm whether an email is registered.
      return {
        notice:
          "If this email can be used, a confirmation is on its way — check your inbox. Already registered? Sign in instead.",
      };
    }
    return { error: error.message };
  }
  if (!data.session) {
    return {
      notice: avatarFile
        ? "Account created. Check your email to confirm — your uploaded avatar will apply after you sign in and set it in your profile."
        : "Account created. Check your email to confirm, then sign in.",
    };
  }

  // Custom avatar upload (best effort — the account itself is already created).
  if (avatarFile && data.user) {
    const uploaded = await uploadAvatar(data.user.id, avatarFile);
    if (uploaded.url) {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ avatar_url: uploaded.url })
        .eq("id", data.user.id);
      if (!upErr) await deleteStaleAvatars(data.user.id, uploaded.url);
    } else {
      return {
        notice: `Account created, but your image upload failed (${uploaded.error}). Set your avatar on the profile page after signing in.`,
      };
    }
  }
  redirect("/home");
}

export async function signInAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Invalid email or password." };
  }
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetRequestAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = z.email("Enter a valid email address").safeParse(formData.get("email"));
  if (!email.success) {
    return { error: "Enter a valid email address." };
  }
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl}/reset-password`,
  });
  if (error) {
    return { error: error.message };
  }
  return { notice: "If an account exists for this email, a reset link is on its way." };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }
  return { notice: "Password updated." };
}
