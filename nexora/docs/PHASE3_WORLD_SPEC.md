# Phase 3 — The Field of the Fallen Sword (Pixel World) · Technical Spec

Status: **DRAFT FOR REVIEW** — no code until this is approved.
Scope: master spec §5 (Virtual World) + the seam that Phase 4 (fishing) attaches to.
Working title kept from the in-app `/world` notice: **The Field of the Fallen Sword**.

---

## 1. Vision

A small, persistent-feeling 2D pixel-art world where **real players** see each other,
walk around six themed zones, chat via bubbles, and trigger the Pier region that will
open fishing in Phase 4. Built with **Phaser** and synced over **Supabase Realtime** —
exactly what the in-app PhaseNotice already promises.

Hard constraints (standing rules that shape every decision here):

- **No fake players. Ever.** A lone visitor sees an empty world, honestly.
- **Code-drawn pixel art only** (no AI-generated art, no scraped assets) — same
  pipeline family as `pixel-banner.tsx` / `lib/frames.ts`.
- **Server-authoritative where it matters** (anything worth XP/coins later);
  the walk-around world itself is non-competitive, so position sync is client-trusted
  and documented as such.
- **Honest UI**: `/world` keeps its "in development" notice until Slice 3a actually
  ships; multiplayer claims appear only after Slice 3b.
- Zod for every payload shape (shared client/server), RLS unchanged (Phase 3 adds
  no world tables that users write to).

## 2. Non-goals (Phase 3 explicitly does NOT include)

- Fishing gameplay, rods/bait, fish species (Phase 4 — only the Pier **trigger** exists).
- Inventory, coins-for-fish, leaderboards (Phase 4).
- Mini-games in Arcade City (Phase 5 — the zone is a place, not a game).
- Physics puzzles, combat, NPCs with dialogue trees.
- Persistent world state (dropped items, decorations) — nothing to restore, nothing to corrupt.
- Voice, emotes marketplace, cosmetic shops.

## 3. Architecture

```
/world (Next.js server component — guard + profile)
   └─ <WorldStage profile={...}>            (client, next/dynamic, ssr:false)
        ├─ Phaser 3 game (canvas, pixelArt:true)
        │    ├─ BootScene      — generate all textures programmatically (code art)
        │    ├─ ZoneScene      — tilemap for current zone, collision, regions
        │    ├─ PlayerSprite   — local avatar (input-driven) + remote avatars (interpolated)
        │    └─ HudScene       — bubble layer, minimap chip, control hints
        └─ netcode/ (thin, framework-free TS)
             ├─ worldClient.ts   — presence join/leave, throttled move broadcast
             └─ schemas.ts       — zod payloads (shared with tests)

Supabase Realtime
   ├─ presence  → "who is in this zone" (join/leave + state: name, avatar, look)
   └─ broadcast → move / chat / action events, throttled
```

- **Phaser 3.x** from npm, loaded client-only (no SSR). Bundle impact ~1.2 MB gz,
  loaded **only** on `/world` (dynamic import) — zero cost to every other page.
- **No game server.** Vercel Hobby cannot host an always-on socket server; Supabase
  Realtime is our multiplayer backend (already proven: chat, typing, notifications).
- Everything rendered from textures generated at boot by code (pixel-art rule).

## 4. Rendering & art pipeline

- Canvas: `pixelArt: true`, `roundPixels: true`, tile size **16×16** native,
  camera zoom **2** (crisp 32 px tiles on screen), `Scale.FIT` + `autoCenter`.
- **Tile textures are generated at boot**: a small drawing DSL (fill rect, dither,
  outline, 3-shade ramp) paints each 16×16 tile into a Phaser canvas texture atlas.
  Nothing binary is committed; the "art file" is readable TS
  (`world/art/tiles.ts`, `world/art/props.ts`, `world/art/avatar.ts`).
- Shared palettes pulled from `lib/design.ts` accents + the banner scene palettes so
  the world feels like the same universe (harbor cyan water, ember sunsets…).
- Walk cycles: 4-frame up/down/side cycles, 2-frame idle, drawn the same way
  (the two-frame flap trick from the banners generalizes into an avatar frame set).
- Respect `prefers-reduced-motion`: idle bob/clouds off, walk still works.

## 5. Zones (six, per the in-app notice)

Each zone: one `ZoneScene`, map defined as a **data array in TS** (`world/maps/*.ts`),
~**48×32 tiles** (768×512 native), camera-follow with clamped bounds. Exits are edge
or portal tiles that swap ZoneScenes in place (no page reload).

| Zone | Theme (pixel palette) | Landmarks | Exits → |
|---|---|---|---|
| **Central Plaza** | cobble, fountain, banner posts | fountain (spawn point), signboard, design-center kiosk (flavor) | all zones |
| **Beach** | sand, surf, palms | seashell strip, boardwalk | Plaza, Pier |
| **Fishing Pier** | dock planks, posts, water | **region trigger: pier-head** → `onEnterFishing()` hook (Phase 4) | Beach |
| **Forest Lake** | pines, lake, fireflies | lake shore, log bridge | Plaza, Garden |
| **Garden** | hedges, flowers, stone paths | gazebo, flower beds | Plaza, Forest Lake |
| **Arcade City** | neon night, storefronts | arcade hall façade (minigames later), neon sign | Plaza |

- Maps are hand-authored as char grids (readable, diffable, e.g. `"~"=water`,
  `"."=path`, `"T"=tree`) → parsed at boot → tile indices. No Tiled editor dependency.
- Collision: solid tiles flagged in the same grid (`"T"`, `"~"`, `"#"` = solid).
- **Region triggers**: named rectangles in each map (`regions: [{id, rect, event}]`).
  Standing in one fires its event — `pier_head` → fishing hook, `arcade_door` →
  "coming in Phase 5" toast, `zone_exit:*` → zone transitions.

## 6. Avatars & customization

- **Character sprite** = code-drawn 16×24 pixel kid, 4 directions, with three
  customizable channels mapped from the profile the user already has:
  - **accent tint** (`profiles.accent_theme` → `getAccent()` colors the shirt),
  - **avatar portrait** (`avatar_url`) shown in the name-label chip,
  - **frame** (`frame_slug`) rings the label chip (reuse `lib/frames.ts` colors).
- Name label above every player: `display_name` (never usernames-from-email rules —
  the existing display name is the only identity shown).
- No new customization store; "customizable" = the design center the user already
  controls. A dedicated character tab can come later (Phase 5) if wanted.

## 7. Movement & controls

- **Free movement with tile collision** (not grid-locked): velocity-based,
  walk speed ~90 px/s native, diagonal normalized, `body.setCollision` against the
  solid layer. Facing flips the sprite; `moving` flag drives the walk cycle.
- **Keyboard**: arrows + WASD. **Mobile**: left-thumb virtual d-pad/joystick
  (fixed, semi-transparent), tap-to-move NOT in Phase 3 (documented as future).
- Accessibility: all controls keyboard-reachable; control hints in HUD; the world
  is decorative — nothing time-critical, so input latency is not a gameplay risk.

## 8. Multiplayer netcode (the important part)

**Channels** — one per zone: `world:zone:<zone_id>`.
Join when entering a zone (including `/world` load), leave on zone change/unmount.
Presence state carried per player:

```ts
// world/netcode/schemas.ts (zod, shared + unit-tested)
const worldPresenceState = z.object({
  name: z.string().min(1).max(40),
  avatarUrl: z.string().max(500).nullable(),
  frameSlug: z.string().max(40),
  accent: z.string().max(20),
  zone: z.enum(ZONES),
});

const worldMovePayload = z.object({
  seq: z.number().int().nonnegative(),
  x: z.number().min(0).max(MAP_MAX),
  y: z.number().min(0).max(MAP_MAX),
  facing: z.enum(["up", "down", "left", "right"]),
  moving: z.boolean(),
});

const worldChatPayload = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(140),
});

const worldActionPayload = z.object({
  kind: z.enum(["wave", "sit", "cheer"]),
});
```

- **Move broadcast**: sent only while moving, throttled to **10 Hz** (every 100 ms),
  plus one final packet on stop. Idle players send a 5 s heartbeat so presence
  doesn't look stale.
- **Remote rendering**: each remote player is a sprite + an interpolation buffer —
  rendered position eases (lerp α≈0.2/frame) toward the newest packet, so 10 Hz
  packets look smooth at 60 FPS. Dropped/reordered packets handled by `seq`.
- **Presence** drives who exists; broadcast drives where they are. A player who
  disconnects vanishes via presence `leave` (no ghosts — honesty rule).
- **Validation**: every inbound payload passes the zod schema before use
  (protects our client from malformed peers). Out-of-bounds positions are clamped.
  There is **no server-side position authority** — this world is non-competitive
  and earns nothing, so cheating gains nothing. (When Phase 4 fishing arrives,
  catches become server-authoritative through the same pattern as XP/coins today.)
- **Abuse**: broadcast chat throttled client-side to 1 msg / 2 s (matching global
  chat discipline); bubbles auto-expire after 6 s. Blocked users (`FriendStatus
  "blocked"`) are filtered out of your view entirely (sprite + bubbles + presence).
- **Scale**: Supabase Realtime presence+broadcast comfortably handles tens of
  concurrent players per zone on the free tier; target ≤ 24 rendered avatars/zone
  (beyond that, still-list everyone but it's out of scope to cull).

## 9. Chat bubbles & interactions

- **Zone chat** = ephemeral broadcast bubbles (like a real game): say → bubble over
  your head + a line in a collapsible HUD chat log. **Not persisted** (documented
  in the UI: "world chat is ephemeral"). Persistent chat stays where it already
  lives (global, communities, DMs) — no feature regression.
- **Interactions**: `wave`, `sit` (on benches/logs), `cheer` — one key (E) + a HUD
  chip on mobile. Small, honest, no emote shop.

## 10. Data model changes (minimal)

```sql
-- P2 gap folded in: privacy-aware online status (powers the Friends list AND the world)
ALTER TABLE public.profiles ADD COLUMN last_seen_at timestamptz;
-- written by a throttled heartbeat (max 1/60 s per client, from the app shell)
-- visibility: public → everyone, friends → accepted friends only, private → nobody
-- (enforced in the read query + RLS-ish filtering in lib/data, same pattern as privacy screens)
```

- **No world tables.** Presence is ephemeral; nothing to migrate, nothing to leak.
- The heartbeat also fixes the long-standing P2 gap ("online status and
  privacy-aware last seen" from spec §4 Friends) at zero marginal architecture cost.

## 11. Privacy, blocking, moderation

- Online/last-seen visibility honors `profiles.privacy` (see §10).
- Blocked pairs: never rendered to each other in the world (checked against the
  friendship table snapshot the client already loads).
- Moderation (staff teleport/kick in-world) is **Phase 5**; documented, not faked.

## 12. Performance & accessibility targets

- 60 FPS on a mid-range phone (≤ 200 draw calls/zone: tilemap layers batch; sprites
  and bubbles are the only per-object draws).
- Texture generation < 300 ms at boot (procedural, tiny atlas).
- `prefers-reduced-motion`: ambient loops (water sparkle, fireflies, banners) off;
  movement and netcode unchanged.
- Full keyboard operability; ARIA labels on HUD controls; color contrast on labels
  (name chips use panel colors, not raw accent-on-white).

## 13. Slices & acceptance criteria (each = one PR + deploy + your browser check)

**Slice 3a — Plaza & movement** *(the /world notice flips to a live world)*
- [ ] Phaser boots on `/world` (dynamic import, no SSR errors), Plaza map renders
      from code-drawn tiles, fountain/paths/signboard present.
- [ ] Local avatar: accent-tinted sprite, walk cycles, arrows/WASD + camera follow,
      tile collision (can't walk through trees/water).
- [ ] Mobile: virtual d-pad drives the same movement.
- [ ] No fake players; page honestly says "multiplayer sync arrives next".
- [ ] `next build` stays green; non-world pages unaffected (bundle isolated).

**Slice 3b — Multiplayer sync + online status**
- [ ] Two real accounts in the same zone see each other (sprite + name chip) with
      smooth interpolation; join/leave updates live (no ghosts).
- [ ] Blocked users invisible to each other.
- [ ] `last_seen_at` heartbeat + Friends list online indicators (privacy-aware).
- [ ] Payload zod schemas unit-tested (vitest).

**Slice 3c — All six zones & region triggers**
- [ ] Beach, Pier, Forest Lake, Garden, Arcade City reachable via exits/portals.
- [ ] `pier_head` region fires the fishing hook (toast: "Fishing arrives in Phase 4"
      until then), `arcade_door` toast likewise.
- [ ] Per-zone presence (zone change = channel swap, correctly).

**Slice 3d — Bubbles, interactions, polish**
- [ ] Zone chat bubbles (throttled, ephemeral, HUD log), wave/sit/cheer actions.
- [ ] Reduced-motion pass, contrast pass, mobile layout pass, FPS check on device.

## 14. Test plan

- **vitest**: zod schemas (round-trip + malformed payload rejection), map parser
  (grid → layers + collision flags + region rects), presence-state mapper,
  privacy filter for last-seen reads.
- **tsc / eslint / next build** gates every slice (existing discipline).
- **Two-browser manual matrix** per slice (kade + mira accounts): the multiplayer
  claims cannot be tested headlessly — they get your two-account verification,
  same as receipts/typing did.
- Performance: Chrome DevTools FPS + draw-call sanity on 3a and 3d.

## 15. Open questions for you

1. **Movement feel** — free pixel-smooth movement with tile collision (recommended,
   feels like the genre) vs strict grid-locked stepping (simpler, more retro-formal)?
2. **World chat persistence** — ephemeral bubbles (recommended, honest "game chat")
   or should world chat persist like the other channels?
3. **Avatar look** — accent-tinted kid sprite consistent with the banner art style
   (recommended) vs a chunkier 2-frame "paper doll" style closer to the profile
   pixel avatars?
4. **Zone set** — keep the six zones exactly as the in-app notice lists them
   (Plaza, Beach, Pier, Forest Lake, Garden, Arcade City), or change any?

---

*Written for review per request. After sign-off (with any edits), work starts at
Slice 3a on this branch.*
