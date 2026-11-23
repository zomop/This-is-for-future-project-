/**
 * Tiny pixel-art drawing helpers (spec §4: all world art is code-drawn,
 * readable TS — no binary assets, no AI art).
 */

export type Ctx = CanvasRenderingContext2D;

export function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Alternating 2px dither between two colors — cheap pixel shading. */
export function dither(ctx: Ctx, x: number, y: number, w: number, h: number, a: string, b: string): void {
  for (let iy = 0; iy < h; iy += 2) {
    for (let ix = 0; ix < w; ix += 2) {
      px(ctx, x + ix, y + iy, 2, 2, (ix / 2 + iy / 2) % 2 === 0 ? a : b);
    }
  }
}

/** Fixed scene palettes shared with the pixel-banner universe (spec §4). */
export const PAL = {
  grass: "#4e9a51",
  grassDark: "#3c7a40",
  grassLight: "#63b567",
  cobble: "#8b8f9a",
  cobbleDark: "#6b707c",
  cobbleLight: "#a8adb8",
  path: "#b58a5c",
  pathDark: "#93693f",
  water: "#2e7fa8",
  waterDeep: "#1b5a7a",
  waterLight: "#7fdcf2",
  sand: "#e6cf8e",
  sandDark: "#cbb173",
  trunk: "#7a4f2a",
  trunkDark: "#5c3a1f",
  canopy: "#2f7a3e",
  canopyDark: "#27632f",
  canopyLight: "#3f8f4f",
  stone: "#a8adb8",
  stoneDark: "#7d8494",
  wood: "#a97c50",
  woodDark: "#7c5632",
  bench: "#8a5f38",
  flowerPink: "#ff7ab8",
  flowerGold: "#e8c15a",
  flowerViolet: "#a78bfa",
  skin: "#f0c8a0",
  skinShade: "#d9a878",
  hair: "#4a3423",
  pants: "#34405c",
  shoes: "#2a2a33",
  ink: "#22303c",
  sparkle: "#bfefff",
} as const;
