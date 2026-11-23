NEXORA — SOCIAL PLATFORM & GAMING WEBSITE

Build a complete, polished social platform called NEXORA. It should combine real-time chat, user profiles, communities, a shared pixel-art world, and casual games. This is NOT a generic dashboard or AI chatbot.

DESIGN
- Modern, clean, premium social-gaming UI.
- Dark graphite/navy theme with restrained cyan/blue accents.
- Responsive desktop and mobile layouts.
- Pixel-art visuals for the game world.
- Consistent typography, spacing, icons, and subtle animations.
- Avoid excessive gradients, glow, clutter, generic AI templates, and emoji as game artwork.

MAIN NAVIGATION
Home, Messages, Friends, Communities, Discover, World, Games, Inventory, Profile, Settings.
Show admin navigation only to authorized roles.

CORE FEATURES

1. ACCOUNTS
- Registration, login, logout, secure password hashing and sessions.
- Password reset and protected routes.
- Persistent accounts and server-side authorization.

2. PROFILES
- Avatar, banner, username, display name, bio, status and join date.
- Level, XP, role badge, achievements, friends and public activity.
- Game statistics, fishing statistics and fish collection.
- Profile customization and privacy settings.
- Users can edit only their own profile unless explicitly authorized.

3. REAL-TIME CHAT
- Direct messages and group chats.
- Community text channels.
- Persistent message history.
- Typing indicators, read receipts, timestamps and reactions.
- Reply, edit and delete own messages.
- Validated image attachments.
- Search and unread indicators.
- Use real-time infrastructure such as WebSockets or managed realtime subscriptions; do not fake live updates.

4. FRIENDS
- Send, accept and reject requests.
- Remove and block users.
- Online status and privacy-aware last seen.
- Invite friends to rooms and games.

5. VIRTUAL WORLD
Create a small 2D pixel-art multiplayer world with:
- Central Plaza, Beach, Fishing Pier, Forest Lake, Garden and Arcade.
- Customizable avatars and character movement.
- Other real players visible and synchronized.
- Public chat and simple interactions.
- Keyboard and mobile touch controls.
Use Phaser or PixiJS and a suitable multiplayer backend. Do not generate fake players.

6. FISHING GAME
Make fishing a major playable feature:
- Choose a location, rod and bait.
- Cast, wait for a bite and complete a reeling minigame.
- Catch fish and save catches to the user's inventory.
- At least 25 distinct fish species with individual names, descriptions, habitats, sprites and catch probabilities.
- Rarities: Common, Uncommon, Rare, Epic, Legendary and Mythical.
- Different fish per location.
- Fishing rods, bait, equipment upgrades, fishing XP and levels.
- Fish collection, favorites, details and optional selling for earned in-game currency.
- Achievements and leaderboards based on real saved records.
Keep gameplay balanced. No gambling, betting, paid loot boxes or real-money mechanics.

7. OTHER MINI-GAMES
- Memory Match.
- Tic-Tac-Toe.
- Rock Paper Scissors.
- Simple puzzle game.
Support solo play and friend challenges where appropriate.

8. INVENTORY & PROGRESSION
- Fish, equipment, cosmetics, collectibles and achievements.
- Persist inventory and progress in the database.
- Validate all rewards and inventory changes on the server.
- Award XP only through validated server-side events.

9. COMMUNITIES
- Create, join and leave communities.
- Public, private and invite-only communities.
- Community profiles, channels, member lists, announcements and moderation.

10. NOTIFICATIONS
- Friend requests, messages, invitations, achievements and community updates.
- Persistent read/unread state and notification preferences.

11. ROLES & PERMISSIONS
- Guest: view public content.
- Member: chat, play, manage own profile and join communities.
- Contributor: member permissions plus submit community content.
- Moderator: review reports and moderate content.
- Administrator: manage users, roles and platform configuration.
- Owner: full platform control, including administrators and permissions.
Implement centralized backend RBAC. Never trust role values or permissions supplied by the frontend. Prevent privilege escalation and log sensitive admin actions.

12. ADMIN PANEL
- User and role management.
- Reports and moderation tools.
- Platform settings.
- Audit logs.
All admin operations must be protected by server-side permission checks.

TECH STACK
Preferred: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, PostgreSQL, Prisma, Auth.js, Zod, Phaser or PixiJS, and WebSockets or an appropriate realtime service.
Choose compatible, maintained dependencies. Document any external services and free-tier limitations. Do not assume static hosting can run a persistent multiplayer server.

FREE ASSETS
Find fish sprites, pixel-art environments, icons and sound effects from reputable free asset libraries. Prefer CC0 or permissive licenses. Verify each asset's exact license, preserve required attribution, and record sources in ASSET_CREDITS.md. Never copy assets from copyrighted commercial games or use assets with unclear licensing. Use actual fish illustrations/sprites, not emoji.

SECURITY & QUALITY
- Validate all inputs on the server.
- Secure sessions and cookies.
- Protect against broken access control, privilege escalation, XSS, CSRF where applicable, injection and unsafe uploads.
- Rate-limit authentication and abuse-prone actions.
- Keep secrets in environment variables; provide .env.example and never commit credentials.
- No fake users, fake statistics, dead links or placeholder buttons.
- Every visible interactive control must work.
- Use modular components, clear error handling and database migrations.
- Add automated tests for critical flows.
- Test responsive layouts and production builds.

DEVELOPMENT ORDER
Phase 1: inspect repository, read README.md and CONTRIBUTING.md, then build design system, database, authentication, profiles and roles.
Phase 2: friends, real-time chat, communities and notifications.
Phase 3: pixel-art world, avatars, movement and multiplayer synchronization.
Phase 4: fishing gameplay, fish assets, inventory, progression and leaderboard.
Phase 5: additional mini-games, moderation, admin panel, tests and documentation.

ACCEPTANCE CRITERIA
Verify that registration/login work; profiles persist; users cannot edit other users' profiles; messages are genuinely real-time and persist; friend requests work; communities work; multiplayer players synchronize; fishing is playable; catches and inventory persist; XP and leaderboards use real server-validated records; role checks protect backend endpoints; moderation works; mobile controls work; production build succeeds; and tests pass.

FINAL EXPERIENCE
REGISTER → CREATE PROFILE → ADD FRIENDS → CHAT → ENTER WORLD → FISH TOGETHER → COLLECT FISH → SHOWCASE COLLECTION.

Start by inspecting the repository and presenting a concise implementation plan. Then implement in phases. Do not stop at a static UI mockup. Report honestly what is complete, what remains, and which tests were actually run.
