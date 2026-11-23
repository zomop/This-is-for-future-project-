import { describe, it, expect } from "vitest";
import { PLAZA } from "../world/maps/plaza";
import { parseMap, isSolidKind } from "../world/maps/types";
import {
  worldPresenceState,
  worldMovePayload,
  worldChatPayload,
  worldActionPayload,
} from "../world/netcode/schemas";

describe("plaza map", () => {
  const parsed = parseMap(PLAZA);

  it("is 48×32 with uniform rows", () => {
    expect(parsed.width).toBe(48);
    expect(parsed.height).toBe(32);
    for (const row of PLAZA.rows) expect(row.length).toBe(48);
  });

  it("maps every char via the legend", () => {
    for (const row of PLAZA.rows) {
      for (const ch of row) expect(PLAZA.legend[ch]).toBeTruthy();
    }
  });

  it("has a walkable spawn", () => {
    const { x, y } = PLAZA.spawn;
    expect(parsed.solid[y][x]).toBe(false);
  });

  it("keeps regions inside the map", () => {
    for (const r of parsed.regions) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(parsed.width);
      expect(r.y + r.h).toBeLessThanOrEqual(parsed.height);
    }
  });

  it("has all four exit regions and the fountain trigger", () => {
    const ids = parsed.regions.map((r) => r.id).sort();
    expect(ids).toContain("exit_beach");
    expect(ids).toContain("exit_arcade");
    expect(ids).toContain("exit_forest_lake");
    expect(ids).toContain("exit_garden");
    expect(ids).toContain("fountain");
  });

  it("solid classification matches the spec", () => {
    expect(isSolidKind("water")).toBe(true);
    expect(isSolidKind("tree")).toBe(true);
    expect(isSolidKind("fountain")).toBe(true);
    expect(isSolidKind("grass")).toBe(false);
    expect(isSolidKind("cobble")).toBe(false);
    expect(isSolidKind("flowers")).toBe(false);
  });
});

describe("world netcode schemas (spec §8)", () => {
  it("accepts a valid move packet and rejects garbage", () => {
    const ok = worldMovePayload.safeParse({
      seq: 12,
      x: 384.5,
      y: 256,
      facing: "left",
      moving: true,
    });
    expect(ok.success).toBe(true);

    expect(worldMovePayload.safeParse({ seq: -1, x: 0, y: 0, facing: "down", moving: false }).success).toBe(false);
    expect(worldMovePayload.safeParse({ seq: 1, x: NaN, y: 0, facing: "down", moving: false }).success).toBe(false);
    expect(worldMovePayload.safeParse({ seq: 1, x: 0, y: 0, facing: "sideways", moving: false }).success).toBe(false);
    expect(worldMovePayload.safeParse({ seq: 1, x: 99_999, y: 0, facing: "down", moving: false }).success).toBe(false);
  });

  it("caps chat text at 140 chars and requires an id", () => {
    expect(worldChatPayload.safeParse({ id: "6f1e0a5e-2f2c-4a1a-9b3e-2a1d3c4b5e6f", text: "hello" }).success).toBe(true);
    expect(worldChatPayload.safeParse({ id: "6f1e0a5e-2f2c-4a1a-9b3e-2a1d3c4b5e6f", text: "x".repeat(141) }).success).toBe(false);
    expect(worldChatPayload.safeParse({ id: "not-a-uuid", text: "hello" }).success).toBe(false);
  });

  it("validates presence state against the zone list", () => {
    const base = { name: "Kade", avatarUrl: null, frameSlug: "none", accent: "cyan" };
    expect(worldPresenceState.safeParse({ ...base, zone: "plaza" }).success).toBe(true);
    expect(worldPresenceState.safeParse({ ...base, zone: "moon-base" }).success).toBe(false);
    expect(worldPresenceState.safeParse({ ...base, zone: "plaza", name: "" }).success).toBe(false);
  });

  it("restricts actions to wave/sit/cheer", () => {
    expect(worldActionPayload.safeParse({ kind: "wave" }).success).toBe(true);
    expect(worldActionPayload.safeParse({ kind: "dance" }).success).toBe(false);
  });
});
