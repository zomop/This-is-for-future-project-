import { createClient } from "@/lib/supabase/server";

/**
 * Server-side avatar upload helper. Validates type/size, stores the image in
 * the public `avatars` storage bucket under the caller's folder (storage RLS
 * enforces own-folder writes), and returns the public URL to persist on the
 * profile. Never trusts the client's declared filename or type alone.
 */

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export interface AvatarUploadResult {
  url?: string;
  error?: string;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<AvatarUploadResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No image received." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be under 2 MB." };
  }
  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return { error: "Use a PNG, JPEG, WebP or GIF image." };
  }

  const supabase = await createClient();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  // Mirror the bucket's own constraints so we fail with a clean error.
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) {
    return { error: `Upload failed: ${error.message}` };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Best-effort removal of the caller's previous uploads. Call AFTER the
 * profile row has been updated to the new URL so nothing referenced disappears.
 */
export async function deleteStaleAvatars(userId: string, keepUrl: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: existing } = await supabase.storage.from("avatars").list(userId, { limit: 100 });
    const stale = (existing ?? [])
      .map((o) => `${userId}/${o.name}`)
      .filter((p) => !keepUrl.endsWith(`/${p}`));
    if (stale.length) await supabase.storage.from("avatars").remove(stale);
  } catch {
    /* non-fatal — storage housekeeping only */
  }
}

/** Pull an optional avatar upload out of multipart form data. */
export function avatarFileFrom(formData: FormData): File | null {
  const entry = formData.get("avatarFile");
  return entry instanceof File && entry.size > 0 ? entry : null;
}
