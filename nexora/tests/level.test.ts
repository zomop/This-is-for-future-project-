import { describe, it, expect } from "vitest";
import { xpToLevel, levelProgress, XP_PER_LEVEL } from "@/lib/level";

describe("xpToLevel", () => {
  it("starts everyone at level 1", () => {
    expect(xpToLevel(0)).toBe(1);
    expect(xpToLevel(199)).toBe(1);
  });
  it("levels up exactly at the boundary", () => {
    expect(xpToLevel(XP_PER_LEVEL)).toBe(2);
    expect(xpToLevel(XP_PER_LEVEL * 10)).toBe(11);
  });
  it("is monotonic", () => {
    let prev = 1;
    for (let xp = 0; xp < 5000; xp += 137) {
      const lvl = xpToLevel(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });
  it("is safe on garbage input", () => {
    expect(xpToLevel(-50)).toBe(1);
    expect(xpToLevel(Number.NaN)).toBe(1);
    expect(xpToLevel(Infinity)).toBe(1);
  });
});

describe("levelProgress", () => {
  it("reports 0% at the start of a level", () => {
    const p = levelProgress(0);
    expect(p).toMatchObject({ level: 1, intoLevel: 0, needed: 200, pct: 0 });
  });
  it("reports half progress at the mid-level", () => {
    const p = levelProgress(100);
    expect(p.pct).toBe(50);
    expect(p.intoLevel).toBe(100);
  });
  it("carries remainder into the correct level", () => {
    const p = levelProgress(450); // level 3, 50 into it
    expect(p.level).toBe(3);
    expect(p.intoLevel).toBe(50);
    expect(p.nextLevelAt).toBe(600);
  });
  it("never exceeds 100%", () => {
    expect(levelProgress(199).pct).toBe(100); // rounds to 100 at the boundary
  });
});
