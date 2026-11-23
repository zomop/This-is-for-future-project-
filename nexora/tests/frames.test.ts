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
});
