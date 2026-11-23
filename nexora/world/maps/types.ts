import type { ZoneId } from "../constants";

export type TileKind =
  | "grass"
  | "cobble"
  | "path"
  | "water"
  | "sand"
  | "tree"
  | "flowers"
  | "wall"
  | "sign"
  | "bench"
  | "fountain";

/** Named rectangle in TILE coordinates. */
export interface RegionDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A zone map is a hand-authored char grid (spec §5): readable, diffable,
 * no external tile-editor files. Every char maps to a TileKind via `legend`.
 */
export interface MapDef {
  id: ZoneId;
  name: string;
  rows: string[];
  legend: Record<string, TileKind>;
  /** Spawn point in TILE coordinates. */
  spawn: { x: number; y: number };
  regions: RegionDef[];
}

export interface ParsedMap {
  id: ZoneId;
  name: string;
  width: number;
  height: number;
  tiles: TileKind[][];
  /** Solid tiles block movement (spec §5: water, trees, walls, props). */
  solid: boolean[][];
  regions: RegionDef[];
  spawnPx: { x: number; y: number };
}

const SOLID_KINDS: ReadonlySet<TileKind> = new Set([
  "water",
  "tree",
  "wall",
  "sign",
  "bench",
  "fountain",
]);

export function isSolidKind(kind: TileKind): boolean {
  return SOLID_KINDS.has(kind);
}

/** Parse + validate a MapDef. Throws on malformed maps (tests exercise this). */
export function parseMap(def: MapDef): ParsedMap {
  const height = def.rows.length;
  if (height === 0) throw new Error(`map ${def.id}: empty`);
  const width = def.rows[0].length;
  if (width === 0) throw new Error(`map ${def.id}: empty row`);
  if (def.spawn.x < 0 || def.spawn.x >= width || def.spawn.y < 0 || def.spawn.y >= height) {
    throw new Error(`map ${def.id}: spawn out of bounds`);
  }

  const tiles: TileKind[][] = [];
  const solid: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    const row = def.rows[y];
    if (row.length !== width) throw new Error(`map ${def.id}: row ${y} length ${row.length} != ${width}`);
    const tileRow: TileKind[] = [];
    const solidRow: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      const kind = def.legend[ch];
      if (!kind) throw new Error(`map ${def.id}: unmapped char "${ch}" at ${x},${y}`);
      tileRow.push(kind);
      solidRow.push(isSolidKind(kind));
    }
    tiles.push(tileRow);
    solid.push(solidRow);
  }

  if (solid[def.spawn.y][def.spawn.x]) {
    throw new Error(`map ${def.id}: spawn is inside a solid tile`);
  }

  for (const r of def.regions) {
    if (r.x < 0 || r.y < 0 || r.x + r.w > width || r.y + r.h > height) {
      throw new Error(`map ${def.id}: region ${r.id} out of bounds`);
    }
  }

  return {
    id: def.id,
    name: def.name,
    width,
    height,
    tiles,
    solid,
    regions: def.regions,
    spawnPx: { x: def.spawn.x * 16 + 8, y: def.spawn.y * 16 + 8 },
  };
}
