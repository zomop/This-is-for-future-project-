import { describe, expect, it } from "vitest";
import { escapeLikePattern, friendRelation } from "@/lib/utils";

describe("escapeLikePattern", () => {
  it("escapes LIKE wildcards", () => {
    expect(escapeLikePattern("kade%")).toBe("kade\\%");
    expect(escapeLikePattern("100_xp")).toBe("100\\_xp");
  });

  it("escapes the escape character itself", () => {
    expect(escapeLikePattern("back\\slash")).toBe("back\\\\slash");
  });

  it("strips characters that are structural to PostgREST or()", () => {
    expect(escapeLikePattern("a,b(c)\"d")).toBe("a b c d");
  });

  it("collapses whitespace and trims", () => {
    expect(escapeLikePattern("  kade   ross  ")).toBe("kade ross");
  });

  it("leaves plain names untouched", () => {
    expect(escapeLikePattern("Kade_Ross99")).toBe("Kade\\_Ross99");
    expect(escapeLikePattern("mira")).toBe("mira");
  });

  it("handles empty input", () => {
    expect(escapeLikePattern("")).toBe("");
    expect(escapeLikePattern("   ")).toBe("");
  });
});

describe("utils escaping + timeAgo sanity", () => {
  it("escape and search compose safely for injection-ish input", () => {
    const nasty = '%),(id.eq.1) --';
    const escaped = escapeLikePattern(nasty);
    expect(escaped).not.toContain("(");
    expect(escaped).not.toContain(")");
    expect(escaped).not.toContain(",");
    expect(escaped).not.toContain('"');
  });

  it("leaves * as the user's explicit wildcard (PostgREST translates it)", () => {
    expect(escapeLikePattern("kade*")).toBe("kade*");
  });
});

describe("friendRelation", () => {
  it("maps accepted to friend regardless of direction", () => {
    expect(friendRelation("accepted", true)).toBe("friend");
    expect(friendRelation("accepted", false)).toBe("friend");
  });

  it("maps pending by direction", () => {
    expect(friendRelation("pending", true)).toBe("requested");
    expect(friendRelation("pending", false)).toBe("incoming");
  });

  it("never surfaces declined or blocked state", () => {
    expect(friendRelation("declined", true)).toBe("none");
    expect(friendRelation("declined", false)).toBe("none");
    expect(friendRelation("blocked", true)).toBe("none");
    expect(friendRelation("blocked", false)).toBe("none");
  });

  it("maps missing rows to none", () => {
    expect(friendRelation(null, true)).toBe("none");
    expect(friendRelation(undefined, false)).toBe("none");
  });
});
