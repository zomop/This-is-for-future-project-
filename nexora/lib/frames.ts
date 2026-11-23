/**
 * Profile frames — Discord-style avatar decorations, earned by level.
 * Frames are pure CSS/SVG overlays rendered by <FramedAvatar />; there is no
 * artwork to license. Unlocks are enforced server-side in updateFrameAction
 * (levelProgress(profile.xp).level >= minLevel), never trusted from the client.
 */

export interface FrameDef {
  slug: string;
  name: string;
  description: string;
  /** Level required to equip. 1 = available to everyone. */
  minLevel: number;
}

export const FRAMES: readonly FrameDef[] = [
  { slug: "none", name: "Clean Cut", description: "The classic. No frills, all traveler.", minLevel: 1 },
  { slug: "azure", name: "Azure Circuit", description: "A slow cyan current tracing your avatar.", minLevel: 2 },
  { slug: "verdant", name: "Verdant Pulse", description: "The forest breathes with you.", minLevel: 3 },
  { slug: "ember", name: "Ember Wake", description: "Leave sparks wherever you walk.", minLevel: 4 },
  { slug: "royal", name: "Royal Sigil", description: "Violet and gold, fit for the realm's court.", minLevel: 5 },
  { slug: "aurora", name: "Aurora Veil", description: "A northern sky, wrapped around your face.", minLevel: 7 },
  { slug: "solar", name: "Solar Crown", description: "Blinding gold. The pier sees you first.", minLevel: 9 },
  { slug: "celestial", name: "Celestial Halo", description: "Starlight given form. Level 10 legend status.", minLevel: 10 },
] as const;

export const FRAME_SLUGS = FRAMES.map((f) => f.slug) as [string, ...string[]];

export function getFrame(slug: string | null | undefined): FrameDef {
  return FRAMES.find((f) => f.slug === slug) ?? FRAMES[0];
}

/** True when a player at `level` is allowed to equip `slug`. */
export function canEquipFrame(level: number, slug: string): boolean {
  const frame = FRAMES.find((f) => f.slug === slug);
  if (!frame) return false;
  return level >= frame.minLevel;
}
