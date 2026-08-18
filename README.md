# DARKO 🌙

**Virtual hangouts for everyone.** Create a room, share one link, and everything you need for a digital hangout is inside — watch together, voice/video chat, play games, share files. No app install, no mandatory account.

> **Status:** Phase 1 (Foundation) + Phase 2 (Realtime) complete. WebRTC (Phase 3), watch party (Phase 4), games (Phase 5), file sharing (Phase 6), public lobby (Phase 7), and polish (Phase 8) are documented in `docs/ARCHITECTURE.md`.

---

## Push to your own GitHub

This project is a local git repo with clean commit history. To push it to your own GitHub:

```bash
# 1. Create a new empty repo on GitHub (don't add README/license/.gitignore)
# 2. Copy the HTTPS URL GitHub gives you
# 3. Run:
./scripts/push-to-github.sh https://github.com/yourname/darko.git

# Or set DARKO_REMOTE and run without args:
export DARKO_REMOTE=https://github.com/yourname/darko.git
./scripts/push-to-github.sh
```

The script adds `origin`, pushes `main`, and sets up tracking. After that, just `git push` to update.

---

## What works right now (Phase 1 + 2)

- ✅ **Landing page** — cinematic hero, features grid, how-it-works, CTA
- ✅ **Guest login** — pick a display name, no account needed
- ✅ **Google OAuth scaffolding** — works as soon as you add credentials
- ✅ **Create room** — title, 7 themes, public/private, password, max participants
- ✅ **Join room** — `/join/[slug]` with password prompt and themed preview
- ✅ **Room shell** — `/room/[slug]` with invite link, copy button, themed ambient glow
- ✅ **Dashboard** — list your rooms with theme previews
- ✅ **Database** — Prisma + SQLite (dev) / Postgres (prod)
- ✅ **Auth** — NextAuth with JWT strategy, Google + guest credentials provider
- ✅ **SSRF-safe URL metadata** — for future link previews
- ✅ **Rate limiting** — token bucket per IP
- ✅ **Room-scoped JWT** — 4h TTL, used for Socket.IO handshake
- ✅ **Zod validation** — shared schemas between client and server
- ✅ **Type-safe API** — typed responses, no `any`
- ✅ **Realtime server** — Socket.IO mini-service on port 3003 (Phase 2)
- ✅ **Live presence** — join/leave/heartbeat/timeout, participant tiles update in real time
- ✅ **Realtime chat** — messages, replies, reactions, typing indicator, delete
- ✅ **Server-authoritative roles** — OWNER/HOST/MODERATOR/MEMBER/GUEST with permission checks
- ✅ **Host transfer** — auto on disconnect timeout + manual transfer
- ✅ **Room settings** — live updates to permissions, media control, etc.

## What's coming in Phase 3+

- ⏳ WebRTC voice/video/screen share (mesh ≤6, SFU-ready)
- ⏳ Watch party (YouTube + direct video + sync algorithm)
- ⏳ Multiplayer games (Tic-Tac-Toe, Connect Four, Chess)
- ⏳ P2P file transfer, whiteboard, link sharing
- ⏳ Public lobby, moderation, reports, admin dashboard
- ⏳ PWA install, mobile bottom sheets, accessibility, security audit, tests

---

## Quick start (development)

### Prerequisites
- Node.js 20+ or Bun
- An SQLite-capable filesystem (default) OR a Postgres URL

### Setup

```bash
# 1. Install dependencies
bun install

# 2. Copy env template
cp .env.example .env

# 3. (Optional) Add Google OAuth credentials
#    See docs/GOOGLE_OAUTH_SETUP.md
#    Guest login works without these.

# 4. Push database schema
bun run db:push

# 5. Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Start the realtime server (Phase 2+)

The realtime server is a separate mini-service on port 3003:

```bash
cd mini-services/realtime
bun install                    # first time only
bun run dev                    # starts on port 3003 with hot reload
```

The Next.js frontend connects to it automatically (via `NEXT_PUBLIC_SOCKET_URL` env var, or `localhost:3003` in dev).

### Try the flow

1. Click **Create room** → you'll be prompted to sign in
2. Sign in as **guest** (enter any display name) — no account needed
3. Fill in room details (title, theme, visibility, password) → **Create**
4. You're now in `/room/[slug]` — copy the invite link
5. Open the invite link in an incognito window → join as a different guest
6. Both browsers are now "in" the same room (Phase 2 will make them see each other in realtime)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 strict |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Animation | Framer Motion |
| Client state | Zustand (Phase 2+) |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Auth | NextAuth.js v4 (Google + guest JWT) |
| Database | Prisma 6 + SQLite (dev) / Postgres (prod) |
| Realtime | Socket.IO (Phase 2 — mini-service on port 3003) |
| Media | WebRTC native (Phase 3) |
| Icons | Lucide React |
| Fonts | Space Grotesk (display), Inter (body), JetBrains Mono (code) |

---

## Project structure

```
src/
├── app/
│   ├── (marketing)/         # Landing page + marketing routes
│   ├── (auth)/              # Login, signup
│   ├── (app)/               # Dashboard, rooms/create, settings, profile
│   ├── join/[roomId]/       # Guest join flow
│   ├── room/[roomId]/       # The room itself
│   ├── admin/               # (Phase 7)
│   └── api/                 # REST API routes
│       ├── auth/            # NextAuth + guest
│       ├── rooms/           # Room CRUD + join
│       ├── url-metadata/    # SSRF-safe link preview
│       └── reports/         # (Phase 7)
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── shared/              # Logo, Button (DARKO-branded)
│   └── darko/               # DARKO-specific (layout, landing, room, etc.)
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── db.ts                # Prisma client (singleton)
│   ├── session.ts           # getCurrentUser, requireUser, getOrCreateUser
│   ├── crypto.ts            # slug, password hash, room JWT
│   ├── url-safety.ts        # SSRF prevention
│   ├── rate-limit.ts        # Token bucket
│   ├── mappers.ts           # DB → DTO
│   └── validators/          # Zod schemas (shared)
├── config/
│   ├── site.ts              # Site metadata
│   └── themes.ts            # 7 room themes
├── types/
│   ├── api.ts               # REST DTOs
│   └── next-auth.d.ts       # Session augmentation
└── hooks/, stores/          # (Phase 2+)

prisma/
├── schema.prisma            # Full data model
└── migrations/

mini-services/
└── realtime/                # Socket.IO realtime server (port 3003)
    ├── src/
    │   ├── index.ts         # Bootstrap
    │   ├── auth.ts          # JWT verification middleware
    │   ├── events.ts        # Shared event types (mirrored in frontend)
    │   ├── rooms/
    │   │   ├── room-manager.ts   # In-memory room state, presence, heartbeat
    │   │   └── permissions.ts    # Server-authoritative permission checks
    │   ├── events/
    │   │   ├── room.ts      # Room lifecycle (join/leave/heartbeat)
    │   │   ├── chat.ts      # Chat (message/delete/reaction/typing)
    │   │   └── roles.ts     # Roles + settings (promote/kick/transfer/update)
    │   ├── validators/      # Zod schemas (server-side)
    │   ├── rate-limit.ts    # Per-socket token bucket
    │   └── prisma.ts        # Prisma client
    └── package.json

scripts/
└── push-to-github.sh        # Push this repo to your own GitHub

docs/
├── ARCHITECTURE.md          # Complete architecture + 8-phase plan
├── DEPLOYMENT.md            # (Phase 8)
├── GOOGLE_OAUTH_SETUP.md    # (Phase 8)
└── SECURITY.md              # (Phase 8)
```

---

## Environment variables

See `.env.example`:

```bash
DATABASE_URL="file:./db/darko.db"          # dev: SQLite; prod: Postgres URL
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""                         # optional — guest works without
GOOGLE_CLIENT_SECRET=""                     # optional
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3003"  # Phase 2+
```

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the complete 18-section architecture document covering:
- System diagram (Next.js + Socket.IO mini-service + DB)
- Folder structure
- Prisma schema (full)
- REST API design
- Typed realtime event protocol
- WebRTC architecture (mesh + provider abstraction)
- Auth flow (Google + guest + room-scoped JWT)
- Room lifecycle
- Security model (13 threats with mitigations)
- Deployment (Vercel + Render + Supabase free tiers)
- Free-tier limits (honest documentation)
- 8-phase implementation roadmap

---

## Free-tier honest limits

DARKO targets ₹0 infrastructure. These limits are documented honestly:

| Component | Free tier | Limit |
|---|---|---|
| Vercel | Hobby | 100GB bandwidth, 100h serverless/month |
| Render | Free | 750h/month, sleeps 15min idle |
| Supabase | Free | 500MB DB, 1GB egress, pauses 7d idle |
| Google STUN | Free | No auth, no quota |
| WebRTC mesh | Free | ≤6 voice/video participants (browser limit) |
| TURN | None free | Self-host coturn on $5 VPS for ~15% symmetric NAT cases |

See `docs/ARCHITECTURE.md` §13 for full table with trigger points for paid upgrades.

---

## What DARKO does NOT do

- ❌ Bypass DRM (Netflix, Prime, Disney+, HBO — screen-share workflow only)
- ❌ Proxy protected streaming content
- ❌ Redistribute copyrighted material
- ❌ Require payment for core MVP features
- ❌ Force guests to create accounts
- ❌ Record voice/video (P2P only, never touches our servers)
- ❌ Store uploaded files on our servers (P2P WebRTC DataChannels only)

---

## License

MIT. See `LICENSE`.

---

**Built with browser-native tech. ₹0 infrastructure. No DRM bypass.**
