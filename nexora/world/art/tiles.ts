import { PAL, px, dither, type Ctx } from "./draw";
import type { TileKind } from "../maps/types";

const T = 16;

/** Ground-layer painter: fills one 16×16 tile at tile coords (tx, ty). */
export function paintGroundTile(ctx: Ctx, kind: TileKind, tx: number, ty: number): void {
  const x = tx * T;
  const y = ty * T;
  switch (kind) {
    case "grass":
    case "flowers":
    case "tree": // tree ground is grass; the canopy is a prop pass
      dither(ctx, x, y, T, T, PAL.grass, PAL.grassDark);
      px(ctx, x + 3, y + 5, 1, 2, PAL.grassLight);
      px(ctx, x + 10, y + 11, 1, 2, PAL.grassLight);
      if (kind === "flowers") {
        const c = [PAL.flowerPink, PAL.flowerGold, PAL.flowerViolet][(tx * 7 + ty * 3) % 3];
        px(ctx, x + 4, y + 4, 2, 2, c);
        px(ctx, x + 10, y + 9, 2, 2, c);
      }
      break;
    case "cobble":
    case "sign":
    case "bench":
    case "fountain":
      dither(ctx, x, y, T, T, PAL.cobble, PAL.cobbleDark);
      px(ctx, x + 1, y + 1, 6, 6, PAL.cobbleLight);
      px(ctx, x + 9, y + 9, 5, 5, PAL.cobbleLight);
      break;
    case "path":
      dither(ctx, x, y, T, T, PAL.path, PAL.pathDark);
      break;
    case "water":
      px(ctx, x, y, T, T, PAL.water);
      px(ctx, x, y + 10, T, 6, PAL.waterDeep);
      px(ctx, x + 2, y + 3, 6, 1, PAL.waterLight);
      px(ctx, x + 9, y + 8, 5, 1, PAL.waterLight);
      break;
    case "sand":
      dither(ctx, x, y, T, T, PAL.sand, PAL.sandDark);
      break;
    case "wall":
      dither(ctx, x, y, T, T, PAL.stone, PAL.stoneDark);
      px(ctx, x, y, T, 2, PAL.ink);
      break;
  }
}

/**
 * Prop painter: second pass over non-ground features. Anchored at the tile
 * cell (tx, ty); larger props (tree, fountain) overhang neighbors — that is
 * intentional pixel-art layering (spec §4).
 */
export function paintProp(ctx: Ctx, kind: TileKind, tx: number, ty: number): void {
  const x = tx * T;
  const y = ty * T;
  switch (kind) {
    case "tree":
      px(ctx, x + 6, y + 8, 4, 8, PAL.trunkDark);
      px(ctx, x + 7, y + 8, 2, 8, PAL.trunk);
      px(ctx, x + 1, y - 8, 14, 12, PAL.canopyDark);
      px(ctx, x + 3, y - 6, 10, 8, PAL.canopy);
      px(ctx, x + 5, y - 4, 5, 3, PAL.canopyLight);
      break;
    case "sign":
      px(ctx, x + 7, y + 6, 2, 9, PAL.woodDark);
      px(ctx, x + 2, y + 1, 12, 7, PAL.woodDark);
      px(ctx, x + 3, y + 2, 10, 5, PAL.wood);
      px(ctx, x + 5, y + 4, 6, 1, PAL.ink);
      break;
    case "bench":
      px(ctx, x + 1, y + 5, 14, 3, PAL.bench);
      px(ctx, x + 1, y + 9, 2, 5, PAL.woodDark);
      px(ctx, x + 13, y + 9, 2, 5, PAL.woodDark);
      px(ctx, x + 1, y + 2, 14, 2, PAL.wood);
      break;
    case "fountain":
      // 2×2 fountain anchored top-left; stone rim, deep basin, sparkle water
      px(ctx, x - 2, y - 2, 36, 36, PAL.stoneDark);
      px(ctx, x, y, 32, 32, PAL.stone);
      px(ctx, x + 4, y + 4, 24, 24, PAL.waterDeep);
      px(ctx, x + 6, y + 6, 20, 20, PAL.water);
      px(ctx, x + 12, y + 10, 8, 3, PAL.sparkle);
      px(ctx, x + 15, y + 2, 2, 12, PAL.sparkle);
      break;
  }
}
