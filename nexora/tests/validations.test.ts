import { describe, it, expect } from "vitest";
import {
  registerSchema,
  profileSchema,
  passwordSchema,
  loginSchema,
} from "@/lib/validations";

const validProfile = {
  username: "andreas_k",
  display_name: "Andreas König",
  bio: "Aspiring pier angler",
  status: "Online",
  avatar_url: "/avatars/knight.png",
  privacy: "public" as const,
};

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const r = registerSchema.safeParse({
      displayName: "Andi",
      email: "andi@example.com",
      password: "supersecret",
    });
    expect(r.success).toBe(true);
  });
  it("rejects short passwords", () => {
    const r = registerSchema.safeParse({
      displayName: "Andi",
      email: "andi@example.com",
      password: "short",
    });
    expect(r.success).toBe(false);
  });
  it("rejects malformed emails", () => {
    const r = registerSchema.safeParse({
      displayName: "Andi",
      email: "not-an-email",
      password: "supersecret",
    });
    expect(r.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts the canonical profile", () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });
  it("lowercases and trims username", () => {
    const r = profileSchema.parse({ ...validProfile, username: "  ANDREAS_K " });
    expect(r.username).toBe("andreas_k");
  });
  it("rejects usernames with spaces/symbols", () => {
    for (const bad of ["a b", "a!b", "ab", "x".repeat(25), "Ümlaut"]) {
      expect(profileSchema.safeParse({ ...validProfile, username: bad }).success).toBe(false);
    }
  });
  it("blocks avatar injection via arbitrary URL", () => {
    const r = profileSchema.safeParse({
      ...validProfile,
      avatar_url: "https://evil.example/pwn.png",
    });
    expect(r.success).toBe(false);
  });
  it("rejects overlong bio/status", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, bio: "x".repeat(281) }).success
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...validProfile, status: "x".repeat(81) }).success
    ).toBe(false);
  });
  it("rejects unknown privacy values", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, privacy: "everyone" }).success
    ).toBe(false);
  });
});

describe("loginSchema / passwordSchema", () => {
  it("login requires a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.c", password: "" }).success).toBe(false);
  });
  it("passwordSchema enforces 8+ chars and bcrypt-safe max", () => {
    expect(passwordSchema.safeParse({ password: "1234567" }).success).toBe(false);
    expect(passwordSchema.safeParse({ password: "12345678" }).success).toBe(true);
    expect(passwordSchema.safeParse({ password: "x".repeat(73) }).success).toBe(false);
  });
});
