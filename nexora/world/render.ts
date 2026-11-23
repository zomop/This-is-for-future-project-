import { paintGroundTile, paintProp } from "./art/tiles";
import type { ParsedMap } from "./maps/types";
import type { Ctx } from "./art/draw";

/**
 * Paint an entire zone into a canvas context (spec §4: zones pre-render to one
 * texture — 1 draw call for the whole ground layer, props overlap on top).
 */
export function paintZone(ctx: Ctx, map: ParsedMap): void {
  // pass 1: ground
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      paintGroundTile(ctx, map.tiles[y][x], x, y);
    }
  }
  // pass 2: props (trees / signs / benches / fountain anchor)
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const kind = map.tiles[y][x];
      if (kind === "tree" || kind === "sign" || kind === "bench") {
        paintProp(ctx, kind, x, y);
      } else if (kind === "fountain" && isAnchor(map, x, y)) {
        paintProp(ctx, kind, x, y);
      }
    }
  }
}

/** Fountain is a 2×2 block; paint only from its top-left cell. */
function isAnchor(map: ParsedMap, x: number, y: number): boolean {
  const at = (xx: number, yy: number) =>
    yy >= 0 && yy < map.height && xx >= 0 && xx < map.width ? map.tiles[yy][xx] : null;
  return at(x - 1, y) !== "fountain" && at(x, y - 1) !== "fountain";
}

/** Feet-box collision against the solid grid; outside the map is solid. */
export function isSolidAt(map: ParsedMap, pxX: number, pxY: number): boolean {
  const tx = Math.floor(pxX / 16);
  const ty = Math.floor(pxY / 16);
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
  return map.solid[ty][tx];
}

/** Axis-separated movement with a small feet box (spec §7). */
export function tryMove(
  map: ParsedMap,
  pos: { x: number; y: number },
  dx: number,
  dy: number
): { x: number; y: number } {
  const feet = (x: number, y: number) =>
    isSolidAt(map, x - 5, y + 9) ||
    isSolidAt(map, x + 5, y + 9) ||
    isSolidAt(map, x - 5, y + 13) ||
    isSolidAt(map, x + 5, y + 13);

  let { x, y } = pos;
  if (dx !== 0 && !feet(x + dx, y)) x += dx;
  if (dy !== 0 && !feet(x, y + dy)) y += dy;
  return { x, y };
}

/** Which region (if any) contains this pixel position. */
export function regionAt(map: ParsedMap, pxX: number, pxY: number): string | null {
  const tx = Math.floor(pxX / 16);
  const ty = Math.floor(pxY / 16);
  for (const r of map.regions) {
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return r.id;
  }
  return null;
}
