/** Phase 3 world constants — see docs/PHASE3_WORLD_SPEC.md (approved). */

export const TILE = 16;

export const ZONES = [
  "plaza",
  "beach",
  "pier",
  "forest-lake",
  "garden",
  "arcade-city",
] as const;

export type ZoneId = (typeof ZONES)[number];

/** Native resolution: 48×32 tiles of 16px = 768×512. */
export const VIEW_W = 768;
export const VIEW_H = 512;

/** Walk speed in native px/second (spec §7). */
export const WALK_SPEED = 92;

/** Region event ids the Plaza map can fire (stubs until Slice 3c/Phase 4). */
export const REGION_TOASTS: Record<string, string> = {
  exit_beach: "The Beach opens in Slice 3c — the Plaza is the only walkable zone today.",
  exit_arcade: "Arcade City opens in Slice 3c.",
  exit_forest_lake: "Forest Lake opens in Slice 3c.",
  exit_garden: "The Garden opens in Slice 3c.",
  pier_head: "Fishing arrives in Phase 4 — the Pier opens here.",
  arcade_door: "Arcade minigames arrive in Phase 5.",
  fountain: "The Plaza fountain — where every traveler begins.",
};
