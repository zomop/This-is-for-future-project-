import { describe, it, expect } from "vitest";
import { FRAMES, FRAME_SLUGS, canEquipFrame, getFrame } from "@/lib/frames";

describe("profile frames", () => {
  it("offers a free starter frame", () => {
    expect(FRAMES[0].slug).toBe("none");
    expect(FRAMES[0].minLevel).toBe(1);
    expect(canEquipFrame(1, "none")).toBe(true);
  });

  it("gates higher frames by level", () => {
    expect(canEquipFrame(1, "celestial")).toBe(false);
    expect(canEquipFrame(7, "celestial")).toBe(false);
    expect(canEquipFrame(8, "celestial")).toBe(true);
    expect(canEquipFrame(4, "ember")).toBe(true);
    expect(canEquipFrame(3, "ember")).toBe(false);
  });

  it("rejects unknown slugs and falls back to none", () => {
    expect(canEquipFrame(99, "does-not-exist")).toBe(false);
    expect(getFrame("nope").slug).toBe("none");
  });

  it("keeps frame slugs unique", () => {
    expect(new Set(FRAME_SLUGS).size).toBe(FRAME_SLUGS.length);
  });

  it("ships the second wave of new frames alongside the originals", () => {
    for (const slug of ["frost", "mono", "citrus", "rose", "tide", "onyx", "nebula", "phoenix"]) {
      expect(FRAME_SLUGS).toContain(slug);
    }
    // all 8 originals are still present and unchanged in gating
    for (const slug of ["none", "azure", "verdant", "ember", "royal", "aurora", "solar", "celestial"]) {
      expect(FRAME_SLUGS).toContain(slug);
    }
    expect(FRAMES.length).toBe(16);
  });

  it("gates the new frames by level too", () => {
    expect(canEquipFrame(1, "frost")).toBe(true);
    expect(canEquipFrame(1, "mono")).toBe(false);
    expect(canEquipFrame(2, "mono")).toBe(true);
    expect(canEquipFrame(5, "tide")).toBe(true);
    expect(canEquipFrame(4, "tide")).toBe(false);
    expect(canEquipFrame(8, "phoenix")).toBe(true);
    expect(canEquipFrame(7, "phoenix")).toBe(false);
  });

  it("offers at least one frame at every level 1-8", () => {
    for (let level = 1; level <= 8; level++) {
      expect(FRAMES.some((f) => f.minLevel === level)).toBe(true);
    }
  });
});
