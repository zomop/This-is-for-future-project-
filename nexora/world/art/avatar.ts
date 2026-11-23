import { PAL, px, type Ctx } from "./draw";

/** The accent-tinted pixel kid (spec §6, user-approved look). */
export const AVATAR_W = 16;
export const AVATAR_H = 24;

export type Facing = "down" | "up" | "left" | "right";

/** 4-frame walk cycle: stand, step-left, stand, step-right. */
export const WALK_FRAMES = [0, 1, 0, 2] as const;

export interface AvatarColors {
  shirt: string;
  shirtShade: string;
}

/** Paint one 16×24 frame at (0,0) of the given context. */
export function paintAvatarFrame(ctx: Ctx, facing: Facing, frame: number, colors: AvatarColors): void {
  const { shirt, shirtShade } = colors;
  const stepL = frame === 1;
  const stepR = frame === 2;

  // hair + face
  px(ctx, 4, 0, 8, 4, PAL.hair);
  px(ctx, 4, 4, 2, 3, PAL.hair);
  px(ctx, 10, 4, 2, 3, PAL.hair);
  if (facing === "up") {
    px(ctx, 5, 3, 6, 6, PAL.hair);
    px(ctx, 6, 4, 4, 4, PAL.trunkDark);
  } else {
    px(ctx, 5, 4, 6, 5, PAL.skin);
    px(ctx, 5, 8, 6, 1, PAL.skinShade);
    if (facing === "down") {
      px(ctx, 6, 6, 1, 2, PAL.ink);
      px(ctx, 9, 6, 1, 2, PAL.ink);
    } else if (facing === "left") {
      px(ctx, 5, 6, 1, 2, PAL.ink);
      px(ctx, 4, 7, 1, 1, PAL.skinShade);
    } else {
      px(ctx, 10, 6, 1, 2, PAL.ink);
      px(ctx, 11, 7, 1, 1, PAL.skinShade);
    }
  }

  // body: shirt + arms
  px(ctx, 7, 9, 2, 1, PAL.skinShade);
  px(ctx, 4, 10, 8, 7, shirt);
  px(ctx, 4, 15, 8, 2, shirtShade);
  px(ctx, 2, 10, 2, 6, shirt);
  px(ctx, 12, 10, 2, 6, shirt);
  px(ctx, 2, 16, 2, 2, PAL.skin);
  px(ctx, 12, 16, 2, 2, PAL.skin);

  // legs + shoes (frame variants shift weight)
  const ll = stepL ? -1 : stepR ? 1 : 0;
  const rl = stepL ? 1 : stepR ? -1 : 0;
  px(ctx, 5, 17, 2, 5 + ll, PAL.pants);
  px(ctx, 9, 17, 2, 5 + rl, PAL.pants);
  px(ctx, 5, 22 + ll, 2, 2, PAL.shoes);
  px(ctx, 9, 22 + rl, 2, 2, PAL.shoes);
}

/** Shading pair for a shirt color (light body, darker hem). */
export function shirtColors(accent: string): AvatarColors {
  return { shirt: accent, shirtShade: shadeHex(accent, -28) };
}

/** Darken a #rrggbb color by `amt` (-255..255). */
export function shadeHex(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
