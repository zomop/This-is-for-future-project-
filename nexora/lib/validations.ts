import { z } from "zod";

export const AVATAR_PATHS = [
  "/avatars/hooded.png",
  "/avatars/fox.png",
  "/avatars/slime.png",
  "/avatars/knight.png",
] as const;

/** Public URLs of user uploads in the `avatars` storage bucket. */
export const UPLOADED_AVATAR_RE =
  /^https:\/\/[^/\s]+\/storage\/v1\/object\/public\/avatars\/[A-Za-z0-9_\-\/.]+$/;

export const avatarUrlSchema = z.union([
  z.enum(AVATAR_PATHS),
  z.string().regex(UPLOADED_AVATAR_RE, "Avatar must be a default avatar or an uploaded image"),
]);

/**
 * Profile banner options. `/banners/…` values are static preset images;
 * `pix:<variant>` values are the animated pixel scenes rendered by
 * <PixelBanner /> (code-drawn SVG — see components/pixel-banner.tsx).
 */
export const PROFILE_BANNERS = [
  "/banners/field.png",
  "pix:island",
  "pix:sunset",
  "pix:night",
  "pix:arcade",
  "pix:forest",
  "pix:rain",
] as const;

export const bannerUrlSchema = z.enum(PROFILE_BANNERS);

export const ACCENT_THEME_SLUGS = ["cyan", "gold", "mint", "rose", "violet", "ember"] as const;
export const accentThemeSchema = z.enum(ACCENT_THEME_SLUGS);

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(48, "Display name must be at most 48 characters"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  avatar_url: z.enum(AVATAR_PATHS),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "3–24 chars: lowercase letters, numbers, underscores"),
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(48, "Display name must be at most 48 characters"),
  bio: z.string().trim().max(280, "Bio must be at most 280 characters"),
  status: z.string().trim().max(80, "Status must be at most 80 characters"),
  avatar_url: avatarUrlSchema,
  privacy: z.enum(["public", "friends", "private"]),
});

export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const resetRequestSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long (max 2000 chars)"),
});

export const friendUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "3–24 chars: lowercase letters, numbers, underscores"),
});
export const globalMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Global messages are capped at 500 characters"),
});

// ============ Communities ============

export const BANNER_VARIANTS = ["island", "sunset", "night", "arcade"] as const;

export const communitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Community name must be at least 2 characters")
    .max(48, "Community name must be at most 48 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,32}$/, "3–32 chars: lowercase letters, numbers, dashes, underscores"),
  description: z
    .string()
    .trim()
    .max(280, "Description must be at most 280 characters"),
  emoji: z
    .string()
    .trim()
    .min(1, "Pick a short label or emoji for your community")
    .max(8, "Keep it to 8 characters or fewer"),
  banner_variant: z.enum(BANNER_VARIANTS),
  is_public: z.boolean(),
});

export const communityMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Community messages are capped at 500 characters"),
});

export const inviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{8}$/, "Invite codes are 8 letters/digits"),
});
