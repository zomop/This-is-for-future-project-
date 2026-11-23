import { describe, expect, it } from "vitest";
import {
  communitySchema,
  communityMessageSchema,
  inviteCodeSchema,
} from "@/lib/validations";

const validCommunity = {
  name: "Pixel Artists",
  slug: "pixel-artists",
  description: "We draw tiny things.",
  emoji: "🎨",
  banner_variant: "island",
  is_public: true,
};

describe("communitySchema", () => {
  it("accepts a valid community", () => {
    expect(communitySchema.safeParse(validCommunity).success).toBe(true);
  });

  it("normalizes slug case and trims fields", () => {
    const r = communitySchema.parse({
      ...validCommunity,
      name: "  Pixel Artists  ",
      slug: "  Pixel-Artists ",
    });
    expect(r.name).toBe("Pixel Artists");
    expect(r.slug).toBe("pixel-artists");
  });

  it("rejects bad slugs", () => {
    for (const bad of ["ab", "has space", "UPPER!", "x".repeat(33), "dots.no", "slash/no"]) {
      expect(
        communitySchema.safeParse({ ...validCommunity, slug: bad }).success
      ).toBe(false);
    }
  });

  it("rejects over-long names, descriptions and emoji", () => {
    expect(
      communitySchema.safeParse({ ...validCommunity, name: "x".repeat(49) }).success
    ).toBe(false);
    expect(
      communitySchema.safeParse({ ...validCommunity, description: "x".repeat(281) }).success
    ).toBe(false);
    expect(
      communitySchema.safeParse({ ...validCommunity, emoji: "x".repeat(9) }).success
    ).toBe(false);
  });

  it("rejects unknown banner variants", () => {
    expect(
      communitySchema.safeParse({ ...validCommunity, banner_variant: "neon-forest" }).success
    ).toBe(false);
    for (const v of ["island", "sunset", "night", "arcade"]) {
      expect(
        communitySchema.safeParse({ ...validCommunity, banner_variant: v }).success
      ).toBe(true);
    }
  });

  it("requires a boolean visibility flag", () => {
    expect(communitySchema.safeParse({ ...validCommunity, is_public: false }).success).toBe(true);
  });
});

describe("communityMessageSchema", () => {
  it("accepts normal messages and trims them", () => {
    const r = communityMessageSchema.parse({ body: "  hello island  " });
    expect(r.body).toBe("hello island");
  });

  it("rejects empty or over-long messages", () => {
    expect(communityMessageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(communityMessageSchema.safeParse({ body: "x".repeat(501) }).success).toBe(false);
  });
});

describe("inviteCodeSchema", () => {
  it("accepts and uppercases 8-char codes", () => {
    expect(inviteCodeSchema.parse({ code: "ab23xy9z" }).code).toBe("AB23XY9Z");
  });

  it("rejects malformed codes", () => {
    for (const bad of ["", "abc", "abcdefghij", "abc!efgh", "abcd efgh", "abcd-efgh"]) {
      expect(inviteCodeSchema.safeParse({ code: bad }).success).toBe(false);
    }
  });
});
