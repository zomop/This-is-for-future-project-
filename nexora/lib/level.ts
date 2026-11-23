export const XP_PER_LEVEL = 200;

export function xpToLevel(xp: number): number {
  if (!Number.isFinite(xp) || xp < 0) return 1;
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export interface LevelProgress {
  level: number;
  intoLevel: number;
  needed: number;
  pct: number;
  nextLevelAt: number;
}

export function levelProgress(xp: number): LevelProgress {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  const level = xpToLevel(safeXp);
  const intoLevel = safeXp - (level - 1) * XP_PER_LEVEL;
  const pct = Math.min(100, Math.round((intoLevel / XP_PER_LEVEL) * 100));
  return { level, intoLevel, needed: XP_PER_LEVEL, pct, nextLevelAt: level * XP_PER_LEVEL };
}
