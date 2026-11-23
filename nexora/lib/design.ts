/**
 * Design center — accent themes for the site chrome.
 *
 * Each theme is a pair of CSS custom properties that override the defaults in
 * `@theme` (app/globals.css). Setting them on the app-shell wrapper re-colors
 * every `accent` utility inside (buttons, links, focus rings, chat actions)
 * without a rebuild — the user's pick is stored in `profiles.accent_theme`.
 */

export interface AccentTheme {
  slug: string;
  name: string;
  /** Gradient swatch shown on the tile. */
  swatch: string;
  accent: string;
  accentdim: string;
}

export const ACCENT_THEMES: readonly AccentTheme[] = [
  { slug: "cyan", name: "Harbor Cyan", swatch: "from-[#41d4f4] to-[#176e8a]", accent: "#41d4f4", accentdim: "#176e8a" },
  { slug: "gold", name: "Pier Gold", swatch: "from-[#e8c15a] to-[#a8843a]", accent: "#e8c15a", accentdim: "#a8843a" },
  { slug: "mint", name: "Forest Mint", swatch: "from-[#57d99a] to-[#1d6a44]", accent: "#57d99a", accentdim: "#1d6a44" },
  { slug: "rose", name: "Reef Rose", swatch: "from-[#ff7ab8] to-[#8a2f5c]", accent: "#ff7ab8", accentdim: "#8a2f5c" },
  { slug: "violet", name: "Twilight Violet", swatch: "from-[#a78bfa] to-[#4c2f8f]", accent: "#a78bfa", accentdim: "#4c2f8f" },
  { slug: "ember", name: "Ember Red", swatch: "from-[#f2695c] to-[#8a2f22]", accent: "#f2695c", accentdim: "#8a2f22" },
] as const;

export const ACCENT_SLUGS = ACCENT_THEMES.map((t) => t.slug) as [string, ...string[]];

export function getAccent(slug: string | null | undefined): AccentTheme {
  return ACCENT_THEMES.find((t) => t.slug === slug) ?? ACCENT_THEMES[0];
}
