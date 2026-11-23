import { z } from "zod";

export const AVATAR_PATHS = [
  "/avatars/hooded.png",
  "/avatars/fox.png",
  "/avatars/slime.png",
  "/avatars/knight.png",
] as const;

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
  avatar_url: z.enum(AVATAR_PATHS),
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
