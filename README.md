# This is for future project — NEXORA & mini-kv

A monorepo holding two projects:

| Project | Path | What it is | Status |
| --- | --- | --- | --- |
| **NEXORA — Social World** | [`nexora/`](nexora/) | Dark, premium social platform stitched into a shared pixel-art world: profiles, roles, XP, achievements, friends, DMs, global chat | Phase 1 + P2 friends/DMs live in production |
| **mini-kv** | [`src/`](src/), [`include/`](include/), [`tests/`](tests/) | Tiny in-memory key-value cache in C11, RESP2-compatible subset | Working playground build |

---

## NEXORA — the web app

**Live:** https://nexora-andre-dev4.vercel.app

A dark-fantasy social identity layer for a small online island community — think the profile polish of the big social apps fused with a pixel-art world that is being built in phases. Everything server-authoritative: roles, XP, achievements and economy are enforced by Postgres (RLS + triggers), never by the client.

### Stack

- **Next.js 16** (App Router, React 19, Turbopack) · TypeScript strict
- **Tailwind CSS v4** with `@theme` design tokens (graphite/navy + restrained cyan)
- **Supabase** — Postgres, Auth, Row-Level Security, Realtime, Storage (free tier)
- Zod server-side validation, cva-based UI primitives, Lucide icons, Vitest

### What works today

- Registration / login / logout with httpOnly Supabase session cookies; first registered user becomes **owner** automatically
- Role hierarchy `guest < member < contributor < moderator < admin < owner`, enforced by RLS + a column-guard trigger (no client-side privilege escalation)
- **Feed-first Home** (`/home`) — island activity, realm unlocks, your party (DMs), fresh faces, friends list — not a profile wall
- Public profiles (`/u/[username]`) with privacy screens (`public` / `friends` / `private`), banner + bio + status + **profile frames** (8 level-gated avatar decorations, server-enforced)
- XP & levels (200 XP per level), server-awarded achievements, celebration moments
- **Friends & DMs** (`/friends`, `/messages`) — requests, accept/decline, 1-on-1 conversations with realtime delivery
- **Global chat** (`/global`) — `#the-island`, Discord-style channel UI, synced live over Supabase Realtime, server-side 30 msg/min rate limit, staff delete any message
- **Discover** (`/discover`) — people search (username/display name), trending this week by XP earned, newest members, one-click friend requests
- **Communities** (`/communities`, `/join/[code]`) — create public/invite-only communities, per-community live chat with role-colored names, community owner + moderator roles, kick/promote, shareable invite links, member management
- **Animated pixel banners** — hand-coded SVG pixel art (island / sunset / night / arcade scenes, drifting clouds, rolling waves, twinkling stars, bouncing slime) — code-generated in-repo, no AI art
- **Privacy by default** — usernames are never derived from signup emails (accounts auto-name as `traveler_0001`-style), no email is ever rendered anywhere in the UI, login/reset flows don't reveal whether an email is registered
- **Staff console** (`/admin`) — member census, role list, audit log (moderator+)
- Required profile picture at signup (bundled pixel avatars or upload to own-folder storage with RLS)

### In development (honestly labeled in-app — never fake controls)

- **Notifications** — bell + Realtime toasts (last open P2 piece)
- **P3** — Phaser pixel World (Plaza, Beach, Pier, Forest Lake, Garden, Arcade)
- **P4** — Legendary fishing (species, rods, bait, inventory, coins economy)
- **P5** — Mini-games, full moderation queues

### Quick start

```bash
cd nexora
cp .env.example .env.local   # fill in Supabase project URL + anon key
npm ci
npm run dev                  # http://localhost:3000
```

Full docs: [`nexora/README.md`](nexora/README.md) · product spec: [`nexora/docs/NEXORA_SPEC.md`](nexora/docs/NEXORA_SPEC.md) · artwork provenance (all in-repo generated, no AI art): [`nexora/ASSET_CREDITS.md`](nexora/ASSET_CREDITS.md)

---

## mini-kv — systems playground

A single-threaded, epoll-driven in-memory key-value store written from scratch in C11 — a RESP2-compatible subset you can talk to with `redis-cli`. Hash table with chaining, lazy + periodic TTL expiry, zero runtime dependencies.

```sh
make                                # produces ./minikv
./minikv                            # listens on 0.0.0.0:7379
redis-cli -p 7379 ping
./tests/test_minikv.py              # stdlib-only integration tests
```

Full reference — supported commands, design notes, roadmap: [`docs/mini-kv.md`](docs/mini-kv.md)

---

## Repository layout

```
.
├── nexora/            # NEXORA web app (Next.js + Supabase)
│   ├── app/           # App Router routes (/home /global /friends /messages /admin …)
│   ├── components/    # UI primitives + feature components
│   ├── lib/           # data access, guards, validation, level math, frames
│   └── supabase/      # SQL migrations (schema, RLS, triggers)
├── src/  include/     # mini-kv C sources + headers
├── tests/             # mini-kv integration tests
├── docs/              # additional documentation (mini-kv.md)
├── Makefile           # mini-kv build
└── README.md          # you are here
```

## Workflow & quality gates

NEXORA changes must pass before commit:

```bash
cd nexora
npx tsc --noEmit    # typecheck
npm run lint        # ESLint
npm test            # Vitest
npm run build       # production build
```

mini-kv must pass: `make && ./tests/test_minikv.py`

No secrets in git — `.env.local` is gitignored and the `service_role` key never appears in this repo or in any `NEXT_PUBLIC_*` variable.

## License / provenance

All artwork in `nexora/` is generated in-repo or CC0-built; see [`nexora/ASSET_CREDITS.md`](nexora/ASSET_CREDITS.md). The app contains no third-party AI-generated art.
