# NEXORA — Social World

A dark, premium social platform stitched into a shared pixel-art world: profiles, roles, XP,
achievements — and, in later phases, real-time chat, friends, communities, a walkable world and
legendary fishing.

**Status: Phase 1 + Phase 2 — live** (friends, DMs, global chat, Discover, Communities).
Notifications remain; Phase 3+ features are roadmapped below and
marked in-app with honest "in development" notices, not fake controls.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack) + TypeScript strict
- **Tailwind CSS v4** with `@theme` design tokens (graphite/navy + restrained cyan)
- **Supabase** (Postgres, Auth, RLS) — free tier
- Lucide icons, cva-based UI primitives, Zod server-side validation everywhere

## Quick start

```bash
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm ci
npm run dev                  # http://localhost:3000
```

Required env vars (see `.env.example`):

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key (public, RLS-guarded) |
| `NEXT_PUBLIC_SITE_URL` | Public origin (auth redirects, password reset) |

**Never** put the `service_role` key into this app or any `NEXT_PUBLIC_*` variable.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests (52) |
| `python3 tools/generate_assets.py` | Regenerate all pixel-art assets |

## What works today (Phase 1)

- Registration / login / logout with secure, httpOnly Supabase session cookies (SSR refresh in
  middleware). Auth attempts are rate-limited by Supabase (30 req/min default limits).
- First registered user becomes **owner** automatically (DB trigger); subsequent users join as
  **member**. Role hierarchy: `guest < member < contributor < moderator < admin < owner`.
- **Row-level security** on every table: profiles are world-readable only when `privacy=public`;
  members-only when `friends`; owner-only when `private` (staff override).
- Profile edit (own page only): username (uniqueness-checked), display name, status, bio, avatar,
  banner, privacy. Server-side Zod validation; role/XP/coins columns are guarded by a DB trigger so
  clients cannot escalate privileges or forge economy.
- XP & levels: `200 XP per level` (see `lib/level.ts`). Achievements with server-awarded XP
  (award function is `security definer`, revoked from anon/authenticated).
- `First Steps` achievement (+100 XP) is granted by a server-side `complete_profile_check()` RPC
  when display name, bio and status are all filled.
- Public profile pages at `/u/[username]` with privacy screens for members-only/private profiles.
- Staff console at `/admin` (moderator+): role census, member list, audit log (owner/admin).
- Settings: account overview, staff shortcut, sign-out.

## Not yet shipped (roadmapped, honestly labeled in-app)

- **P2 (live)** — Friends, real-time DMs, island-wide global chat (`/global`), Discover
  (people search, weekly-XP trending, newest members), Communities (public/invite-only, live
  community chat, owner/moderator roles, invite links). Still ahead: notifications
- **P3** — Phaser pixel world (Plaza, Beach, Pier, Forest Lake, Garden, Arcade City), co-op sync
- **P4** — Fishing (25+ species, rods/bait), inventory, coins economy (no real money)
- **P5** — Mini-games, full moderation queues, admin role-granting with typed confirmation

## Database

Schema lives in Supabase migrations on project `nexora`:
`identity_schema` → `fix_award_achievement` → `trusted_xp_coach_banner_default`.
Key objects: `profiles`, `achievements`, `user_achievements`, `audit_log`,
`handle_new_user` (owner bootstrap), `guard_profile_columns` (privilege-escalation guard with a
trusted-context bypass for server code), `award_achievement`, `complete_profile_check`.

Schema now lives in `supabase/migrations/*.sql` (`p2_social_schema` adds friendships,
conversations, messages + RLS/guards). Note: `mailer_autoconfirm` is currently **enabled** on the
project because no custom SMTP is configured yet — signups get a session immediately. Configure SMTP
+ re-enable confirmation before public launch.

## Deployment

Deploy on Vercel with **root directory = `nexora`** and the env vars above. The app binds to the
platform port via `next start`. See `docs/NEXORA_SPEC.md` for the full product spec and
`ASSET_CREDITS.md` for artwork provenance (all art is generated in-repo).

### Cosmetics & global chat (2026-11-22, post-P2 add-on)
- **Profile frames** — 8 level-gated avatar decorations (Clean Cut → Celestial Halo), pure CSS, server-enforced unlocks via `updateFrameAction` (`lib/frames.ts`).
- **Registration avatars** — sign up requires picking a bundled avatar or uploading your own (PNG/JPEG/WebP/GIF, ≤ 2 MB, served from the `avatars` storage bucket with own-folder RLS).
- **Staff badges** — moderator/admin/owner badges now carry icons, a soft glow and a shimmer sweep (`components/ui/badge.tsx`).
- **Global chat** — `/global`, a single island-wide channel with a Discord-style UI synced live over Supabase Realtime (INSERT/DELETE propagate instantly), server-side 30 msg/min rate limit, staff can delete any message (`global_messages` table + RLS).
- **Feed-first Home** — `/home` opens on the island's pulse (global chatter, realm achievements, your party, fresh faces) with a compact identity strip; the full showcase stays on `/profile`.
