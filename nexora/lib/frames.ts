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
  { slug: "frost", name: "Frost Ring", description: "Still ice from the far north rim.", minLevel: 1 },
  { slug: "azure", name: "Azure Circuit", description: "A slow cyan current tracing your avatar.", minLevel: 2 },
  { slug: "mono", name: "Mono Line", description: "Two clean strokes. Nothing else.", minLevel: 2 },
  { slug: "verdant", name: "Verdant Pulse", description: "The forest breathes with you.", minLevel: 3 },
  { slug: "citrus", name: "Citrus Punch", description: "Lime and sun-peel energy, spinning fast.", minLevel: 3 },
  { slug: "ember", name: "Ember Wake", description: "Leave sparks wherever you walk.", minLevel: 4 },
  { slug: "rose", name: "Rose Halo", description: "A soft pink glow that breathes.", minLevel: 4 },
  { slug: "royal", name: "Royal Sigil", description: "Violet and gold, fit for the realm's court.", minLevel: 5 },
  { slug: "tide", name: "Tide Sweep", description: "A teal current sweeping around the shore.", minLevel: 5 },
  { slug: "aurora", name: "Aurora Veil", description: "A northern sky, wrapped around your face.", minLevel: 6 },
  { slug: "onyx", name: "Onyx Edge", description: "Dark steel, quiet and precise.", minLevel: 6 },
  { slug: "solar", name: "Solar Crown", description: "Blinding gold. The pier sees you first.", minLevel: 7 },
  { slug: "nebula", name: "Nebula Spin", description: "A whole nebula turning, slowly.", minLevel: 7 },
  { slug: "celestial", name: "Celestial Halo", description: "Starlight given form. Maximum prestige.", minLevel: 8 },
  { slug: "phoenix", name: "Phoenix Spark", description: "A flame that never quite settles.", minLevel: 8 },
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
