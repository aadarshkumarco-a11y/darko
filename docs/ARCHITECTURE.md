# DARKO — Architecture & Implementation Plan

> **Status:** Architecture document, pre-implementation
> **Date:** 2026-08-18
> **PRD version:** 1.0 (33 pages)
> **Budget target:** ₹0 / free-tier-first

---

## 0. Honest Scope & Constraints Assessment

Before architecture, an honest statement of what is and isn't possible.

### What is fully achievable for ₹0
| Capability | Free implementation |
|---|---|
| Landing page, marketing pages | Next.js SSG on Vercel free tier |
| Guest sessions | HTTP-only signed cookie (JWT), no DB row needed |
| Google OAuth | NextAuth.js + Google OAuth 2.0 (free) |
| Database | SQLite via Prisma (dev) → Supabase Postgres free 500MB (prod) |
| Realtime transport | Socket.IO mini-service on Render/Railway free tier |
| WebRTC signaling | Same Socket.IO transport |
| STUN | Google public STUN (free) |
| Voice/video mesh | Browser WebRTC P2P (free, ~6 participants max) |
| Screen share | `getDisplayMedia()` browser API |
| YouTube watch party | YouTube IFrame Player API (ToS-compliant) |
| Direct video watch | HTML5 `<video>` with public URL |
| Multiplayer games | Authoritative state on Socket.IO server |
| P2P file transfer | WebRTC DataChannels (no server storage) |
| Whiteboard | Canvas + op-based sync over Socket.IO |
| PWA | Web manifest + service worker |
| Admin dashboard | Server-rendered Next.js page |

### Hard limits (documented honestly)
| Limitation | Why | Mitigation |
|---|---|---|
| P2P mesh caps at ~6 voice/video participants | Browser CPU + uplink O(n²) | `MediaProvider` abstraction for future SFU; UI shows "X / 6 recommended" |
| No free TURN server | TURN relays media = bandwidth = money | Google STUN only. ~85% of NAT works. 15% (symmetric NAT) gets coturn self-host guide. |
| Google OAuth requires user's own credentials | Can't create Google Cloud project for user | Full NextAuth flow + `.env.example` + setup README; user pastes `GOOGLE_CLIENT_ID`/`SECRET` |
| Supabase free tier: 500MB, 1GB egress, pauses 7d idle | Free tier reality | SQLite for dev; Supabase upgrade path documented |
| No DRM bypass for Netflix/Prime/etc. | PRD forbids + technically impossible | Screen-share workflow only. UI copy: "Each viewer needs their own subscription." |
| Shared-browser can't render arbitrary cross-origin sites | iframe X-Frame-Options / CSP | Link sharing + supported embeds + screen-share. Remote-browser (Browserless) documented as future paid provider. |
| Render/Railway free tiers sleep after 15min | Free tier reality | Reconnect logic; Fly.io alternative documented. |
| This sandbox only exposes port 3000 | Caddy gateway constraint | Realtime server = mini-service on 3003, frontend connects via `?XTransformPort=3003`. Production: split into two deployments. |

### What I will NOT fake
- No fake Google login button that just sets a cookie
- No fake WebRTC tiles showing placeholder images
- No fake chat that echoes to same browser only
- No fake games with no state machine
- No fake file transfer that just shows a progress bar
- No fake admin dashboard with hardcoded numbers

If a feature cannot be honestly implemented for free, it is either replaced with the closest honest alternative or marked `TODO: requires <X>` with a clear comment.

---

## 1. PRD Analysis Summary

**Core product:** Browser-first virtual hangout — one room link gives chat, voice, video, screen share, watch party, games, file transfer, whiteboard. Guest-first. Google login optional. ₹0 infrastructure.

**5 user roles:** Owner · Host · Moderator · Member · Guest

**7 room modes:** Watch · Screen Share · Browse · Games · Files · Whiteboard · Chat Lounge

**17 acceptance criteria** (PRD §41) must pass before MVP complete.

---

## 2. Technology Decisions

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Already in sandbox, SSG/SSR/ISR, PWA-friendly |
| Language | TypeScript 5 strict | PRD requirement |
| Styling | Tailwind CSS 4 | PRD requirement, design-token friendly |
| UI primitives | shadcn/ui (New York) | Already in sandbox, accessible, customizable |
| Animation | Framer Motion | PRD requirement, respects `prefers-reduced-motion` |
| Icons | Lucide React | PRD requirement |
| Client state | Zustand | PRD requirement, minimal |
| Server state | TanStack Query | Already in sandbox |
| Forms | React Hook Form + Zod | PRD requirement |
| Realtime client | socket.io-client | Matches server, auto-reconnect, rooms |

### Backend
| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js + TypeScript | PRD requirement, shares types with frontend |
| Realtime | Socket.IO | PRD allows, built-in rooms, acks, binary, auto-reconnect |
| Validation | Zod | Same schemas shared with frontend |
| Auth | NextAuth.js v4 | Already in sandbox, Google OAuth + JWT |
| Rate limiting | Custom token bucket in Socket.IO middleware | No paid Redis |
| Logging | Pino | Fast, JSON, low overhead |

### Data
| Layer | Choice | Why |
|---|---|---|
| ORM | Prisma 6 | Already in sandbox, type-safe, schema-first |
| Database | SQLite (dev) → Postgres (Supabase prod) | ₹0 both, Prisma makes swap trivial |
| File storage | None by default (P2P) | PRD: "no permanent server storage by default" |
| Optional storage adapter | Cloudflare R2 (10GB free) | Provider-abstracted |

### Media
| Layer | Choice | Why |
|---|---|---|
| WebRTC | Native browser API | No SDK lock-in |
| STUN | Google public | Free |
| TURN | None (documented) | No free TURN; coturn self-host guide |
| Mesh topology | Full mesh ≤6, abort >6 | Honest about P2P limits |
| Provider abstraction | `MediaProvider` interface | Allows future SFU without room rewrite |

### Deployment (free-tier)
| Component | Host | Notes |
|---|---|---|
| Frontend | Vercel free | 100GB bandwidth |
| Realtime | Railway/Render/Fly.io free | Sleeps after 15min |
| Database | Supabase free | 500MB, pauses 7d idle |
| Domain | Free subdomains | vercel.app + onrender.com |
| TURN (optional) | Self-hosted coturn on $5 VPS | Documented upgrade |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  Next.js App (Vercel)                                           │
│  ├── Pages: /, /features, /games, /join/[id], /room/[id],      │
│  │           /dashboard, /admin, /login, /settings              │
│  ├── Zustand store (room, presence, media, chat)                │
│  ├── Socket.IO client ──────────────┐                          │
│  ├── WebRTC engine ──────────────────┤                         │
│  │   ├── Voice/Video mesh            │                         │
│  │   ├── Screen share                │                         │
│  │   └── DataChannel (files)         │                         │
│  └── Service worker (PWA)            │                         │
└──────────────────────────────────────┼──────────────────────────┘
                                       │ WSS
┌──────────────────────────────────────▼──────────────────────────┐
│              REALTIME SERVER (mini-service :3003)               │
│              Node.js + TypeScript + Socket.IO                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Auth middleware│ │ Rate limiter │  │ Event validator    │   │
│  │ (JWT/guest)   │  │ (token bucket│  │ (Zod per event)    │   │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘   │
│         └──────────────────┴────────────────────┘             │
│  ┌─────────────────────────▼─────────────────────────────┐    │
│  │              Room Manager (in-memory)                  │    │
│  │  ├── Room state (settings, mode, media state)          │    │
│  │  ├── Presence map (heartbeat + timeout)                │    │
│  │  ├── Role assignments (server-authoritative)           │    │
│  │  ├── Chat history (capped ring buffer, 200 msgs)       │    │
│  │  ├── Game state machines (per game)                    │    │
│  │  ├── Whiteboard op log (compacted)                     │    │
│  │  └── WebRTC signaling relay                            │    │
│  └─────────────────────────┬─────────────────────────────┘    │
│  ┌─────────────────────────▼─────────────────────────────┐    │
│  │           Persistence Adapter (interface)              │    │
│  │   ├── PrismaAdapter (SQLite/Postgres)                 │    │
│  │   └── (future) SupabaseAdapter, RedisAdapter           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            │ Prisma
              ┌─────────────▼─────────────┐
              │   DATABASE                │
              │   dev: SQLite             │
              │   prod: Supabase Postgres │
              └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTES (:3000)                     │
│  ├── /api/auth/[...nextauth]  (NextAuth Google + guest)         │
│  ├── /api/rooms                (CRUD)                           │
│  ├── /api/rooms/[id]/join      (validate + issue room token)    │
│  ├── /api/url-metadata         (SSRF-safe link preview)         │
│  ├── /api/reports              (abuse reports)                  │
│  └── /api/admin/*              (admin ops, role-guarded)        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              STUN: stun:stun.l.google.com:19302 (free)          │
└─────────────────────────────────────────────────────────────────┘
```

### Why two servers?
- Next.js API routes are stateless/serverless — bad for WebSocket long-lived connections
- Socket.IO needs a persistent Node.js process
- Split allows independent scaling (frontend cacheable, realtime stateful)
- Vercel recommends this exact pattern

### Sandbox-specific routing
- Frontend: `http://localhost:3000` (auto-run by dev.sh)
- Realtime: `http://localhost:3003` (mini-service, manual start)
- Frontend connects via: `io("/?XTransformPort=3003")`
- Production: split into two public URLs

---

## 4. Folder Structure

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── (marketing)/             # Public routes
│   │   │   ├── page.tsx             # Landing
│   │   │   ├── features/
│   │   │   ├── games/
│   │   │   ├── watch/
│   │   │   ├── about/
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   └── safety/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (app)/                   # Authenticated
│   │   │   ├── dashboard/
│   │   │   ├── rooms/
│   │   │   ├── rooms/create/
│   │   │   ├── settings/
│   │   │   └── profile/
│   │   ├── join/[roomId]/page.tsx   # Guest join
│   │   ├── room/[roomId]/page.tsx   # The room
│   │   ├── admin/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── rooms/
│   │   │   ├── url-metadata/
│   │   │   ├── reports/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn/ui (existing)
│   │   ├── darko/
│   │   │   ├── layout/              # Navbar, Footer, MobileNav
│   │   │   ├── landing/             # Hero, Features, CTA
│   │   │   ├── room/                # RoomShell, TopBar, ActivityStage, ChatPanel...
│   │   │   ├── watch/               # YouTubePlayer, PlaylistPanel
│   │   │   ├── webrtc/              # VideoTile, DeviceSettings
│   │   │   ├── games/               # TicTacToe, ConnectFour, Chess
│   │   │   ├── whiteboard/
│   │   │   ├── files/
│   │   │   ├── chat/
│   │   │   └── admin/
│   │   └── shared/                  # Logo, Button, Spinner, EmptyState
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── rate-limit.ts
│   │   ├── url-safety.ts
│   │   └── validators/              # Zod schemas (shared with server)
│   ├── hooks/
│   ├── stores/                      # Zustand
│   ├── types/
│   └── config/
├── mini-services/
│   └── realtime/                    # Socket.IO server
│       ├── index.ts
│       ├── server.ts
│       ├── auth.ts
│       ├── rooms/
│       ├── events/
│       ├── validators/
│       ├── rate-limit.ts
│       └── persistence/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/                          # PWA assets
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── ARCHITECTURE.md              # This file
│   ├── DEPLOYMENT.md
│   ├── GOOGLE_OAUTH_SETUP.md
│   ├── SELF_HOSTED_TURN.md
│   └── SECURITY.md
├── .env.example
└── README.md
```

---

## 5. Database Schema (Prisma) — full schema in implementation

Key tables: `User`, `Account`, `Session`, `UserPreferences`, `Room`, `RoomMember`, `RoomSettings`, `Message`, `MessageReaction`, `PlaylistItem`, `Report`, `Ban`.

Enums: `UserRole` (USER/MODERATOR/ADMIN), `RoomRole` (OWNER/HOST/MODERATOR/MEMBER/GUEST), `RoomMode` (7 modes), `MediaControl`, `InvitePermission`, `KickPermission`, `ReportStatus`.

**Design notes:**
- Guests NOT persisted in `RoomMember` — in-memory only (PRD: "guests should not require persistent personal information")
- Chat history persisted (200 msgs in-memory ring buffer, older paginated from DB)
- WebRTC signaling events NEVER persisted (PRD explicit)
- Presence NEVER persisted (in-memory + heartbeat)
- `Room.expiresAt` — public rooms auto-expire 24h; private rooms don't expire

---

## 6. REST API Design

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/[...nextauth]` | — | NextAuth handler |
| POST | `/api/auth/guest` | — | Create guest session |
| POST | `/api/rooms` | User/Guest | Create room |
| GET | `/api/rooms` | User | List owned rooms |
| GET | `/api/rooms/[id]` | Member/Guest | Get room metadata |
| PATCH | `/api/rooms/[id]` | Owner/Host | Update settings |
| DELETE | `/api/rooms/[id]` | Owner | Delete room |
| POST | `/api/rooms/[id]/join` | Anyone | Validate access, issue room JWT |
| POST | `/api/rooms/[id]/transfer` | Owner | Transfer ownership |
| GET | `/api/rooms/[id]/messages` | Member | Paginated chat history |
| GET | `/api/rooms/[id]/playlist` | Member | Get playlist |
| GET | `/api/public-rooms` | — | List active public rooms |
| POST | `/api/url-metadata` | Any | SSRF-safe link preview |
| POST | `/api/reports` | Any | File abuse report |
| GET | `/api/admin/stats` | Admin | Dashboard metrics |
| POST | `/api/admin/bans` | Admin | Ban user |

All mutating routes: CSRF token (double-submit cookie) + Zod body validation.

---

## 7. Realtime Event Protocol

### Envelope (every event)
```typescript
interface EventEnvelope<T = unknown> {
  id: string;              // UUID for idempotency
  room: string;            // room slug
  sender: string;          // user/guest id
  ts: number;              // sender timestamp (ms)
  v: 1;                    // protocol version
  type: EventType;
  payload: T;              // Zod-validated per type
}
```

### Event types (typed union)
- **Room:** ROOM_JOIN, ROOM_LEAVE, ROOM_STATE_SNAPSHOT
- **Presence:** PRESENCE_UPDATE, PRESENCE_HEARTBEAT
- **Roles:** ROLE_UPDATE
- **Settings:** ROOM_SETTINGS_UPDATE
- **Chat:** CHAT_MESSAGE, CHAT_DELETE, CHAT_REACTION, TYPING_START, TYPING_STOP
- **Media:** MEDIA_PLAY, MEDIA_PAUSE, MEDIA_SEEK, MEDIA_RATE_CHANGE, MEDIA_SOURCE_CHANGE, MEDIA_SYNC_REQUEST, MEDIA_SYNC_RESPONSE, PLAYLIST_ADD/REMOVE/REORDER/NEXT/PREVIOUS
- **WebRTC:** WEBRTC_OFFER, WEBRTC_ANSWER, WEBRTC_ICE, WEBRTC_PEER_LEAVE
- **Screen:** SCREEN_SHARE_START, SCREEN_SHARE_STOP
- **Games:** GAME_START, GAME_ACTION, GAME_STATE, GAME_END
- **Whiteboard:** WHITEBOARD_OPERATION, WHITEBOARD_UNDO, WHITEBOARD_CLEAR
- **Files:** FILE_OFFER, FILE_ACCEPT, FILE_REJECT, FILE_PROGRESS, FILE_COMPLETE, FILE_CANCEL

### Server-side validation pipeline (every incoming event)
1. Auth check (JWT signature + expiry)
2. Room membership check
3. Rate limit check (per-event token bucket)
4. Permission check (per room settings)
5. Zod schema validation
6. Apply (mutate state, broadcast)
7. Audit log (persistent events only; never signaling/presence)

### Sync math (watch party)
```
clockOffset = serverNow - clientNow   // computed per join, refined periodically

// Host issues MEDIA_PLAY at T_host:
targetPlaybackTime = 0 + (serverNow - T_host) / 1000 * playbackRate
targetWallClock    = T_host

// Each client:
localSeek = targetPlaybackTime + (localNow - targetWallClock + clockOffset) / 1000 * playbackRate
drift     = |localVideo.currentTime - localSeek|
if drift > 1.5s: hard seek
if drift > 0.5s: gently accelerate to 1.05x until converged
```

Same algorithm as SyncPlay/Watch2Gether. No per-frame broadcasting.

---

## 8. WebRTC Architecture

**Topology:** Full mesh ≤6. Above 6, UI refuses new voice/video joins (chat/watch still work).

**Media provider abstraction:**
```typescript
interface MediaProvider {
  type: "mesh" | "sfu";
  connect(peerId: string): Promise<MediaStream>;
  disconnect(peerId: string): void;
  onRemoteStream(cb: (peerId, stream) => void): void;
  onConnectionQuality(cb: (peerId, quality) => void): void;
}
class MeshMediaProvider implements MediaProvider { ... }
// Future: class LiveKitSFUProvider implements MediaProvider { ... }
```

**Peer lifecycle:**
1. New peer joins → server emits `PEER_JOIN` to existing peers
2. Existing peers create `RTCPeerConnection`, add local tracks, create offer, send `WEBRTC_OFFER`
3. New peer receives offers, creates answers, sends `WEBRTC_ANSWER`
4. Trickle ICE via `WEBRTC_ICE`
5. `ontrack` fires → tile renders
6. Reconnect on `iceConnectionState === "failed"`: restart ICE
7. Peer leaves: `pc.close()` + remove tile

**Screen share:** Presenter calls `getDisplayMedia()`, resulting stream added to all peers as one-way track.

**Connection quality:** Stats polled every 5s via `pc.getStats()`. 3-tier indicator: 🟢/🟡/🔴.

**Device management:** `enumerateDevices()` on join + `devicechange` listener. `replaceTrack()` for same-codec switches (no renegotiation).

---

## 9. Authentication Flow

**3 session types:**
1. **Guest** — JWT in HTTP-only cookie. Contains `{ id, displayName, isGuest: true, exp }`. No DB row. 24h TTL.
2. **Google OAuth** — NextAuth. Persists `User` + `Account`. 30d TTL.
3. **Room-scoped JWT** — Issued by `POST /api/rooms/[id]/join` after access validation. 4h TTL. Used for Socket.IO handshake.

**Room access flow:**
```
[User clicks /join/abc123]
  → GET /api/rooms/abc123 → { title, isPublic, hasPassword, theme }
  → If hasPassword: prompt
  → POST /api/rooms/abc123/join { password? }
      → Verify password (bcrypt)
      → Check ban list
      → Check capacity
      → Issue room JWT (4h)
      → Return { roomToken, room, initialState }
  → Redirect to /room/abc123
      → Socket.IO handshake with `auth: { token: roomToken }`
      → Server verifies, adds to room namespace
      → Sends ROOM_STATE_SNAPSHOT
      → Broadcasts PRESENCE_UPDATE
```

---

## 10. Room Lifecycle

```
[Creating] → POST /api/rooms → generate slug → hash password → create Room + Settings → add creator as OWNER
   ↓
[Active] → members join/leave, mode switches, media state changes, chat, WebRTC mesh forms
   ↓
[Owner disconnects] → heartbeat timeout 60s → if no return in 5min → elect next eligible (HOST → MODERATOR → earliest MEMBER) → ROLE_UPDATE → refresh JWTs
   ↓
[Empty room] → no online members 30min → private: keep DB row, tear down in-memory; public: mark expired, remove from lobby, keep DB 7d
   ↓
[Deleted] → owner clicks Delete → soft delete (deletedAt) → hard delete after 30d → cascade
```

---

## 11. Security Model

| Threat | Mitigation |
|---|---|
| XSS | React escapes; chat as text; link previews sanitized; CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' wss: https:; frame-src https://www.youtube.com https://player.twitch.tv` |
| CSRF | Double-submit cookie + SameSite=Lax + token match on mutating routes |
| SSRF | `/api/url-metadata`: https-only, DNS resolve → reject private IPs, 5s timeout, 1MB cap, parse `<title>` only, no redirects to private IPs |
| CORS | Strict origin allowlist; Socket.IO `cors: { origin: [NEXT_PUBLIC_URL], credentials: true }` |
| Auth bypass | Every event: JWT verify + room membership + permission check. Client-sent role NEVER trusted. |
| Guest abuse | Display name sanitized (24 chars, no HTML). Stricter rate limits (chat 10/min vs 30/min). IP-based 5/min guest creation. |
| WebSocket abuse | Per-socket rate limit per event type. Max 5 concurrent sockets/user. Disconnect on violation. |
| WebRTC signaling abuse | Signaling only between same-room members. SDP sanity check. |
| Spam | 2000 char max, 30/min (10/min guests), identical-message detection (last 5). |
| File upload | P2P only, no server storage. Metadata only. Receiver accepts. 500MB default limit. Executable warning. |
| Malicious URLs | `url-safety.ts`: scheme allowlist, private-IP check, length cap. |
| Brute-force passwords | bcrypt + 5-attempt lockout per IP per room per 10min. |
| Session fixation | Regenerate session ID on auth level change. |
| Session expiry | Guest 24h, User 30d, Room 4h. Sliding refresh. |

**Secrets:** `.env.local` (gitignored) for dev, `.env.example` checked in. Production: Vercel + Railway env vars. `NEXT_PUBLIC_*` only for client-safe values.

---

## 12. Deployment Architecture

### Dev (this sandbox)
```
Frontend:  http://localhost:3000    (Next.js dev, auto-run)
Realtime:  http://localhost:3003    (mini-service, manual start)
Database:  file:./db/darko.db      (SQLite)
Frontend → Realtime: io("/?XTransformPort=3003")
```

### Production (free-tier)
```
Frontend:  https://darko.vercel.app          (Vercel free)
Realtime:  https://darko-realtime.onrender.com  (Render free, sleeps)
Database:  Supabase Postgres free (500MB)

Frontend env (Vercel):
  NEXTAUTH_URL, NEXTAUTH_SECRET
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  DATABASE_URL
  NEXT_PUBLIC_SOCKET_URL
  NEXT_PUBLIC_SITE_URL

Realtime env (Render):
  JWT_SECRET (same as NEXTAUTH_SECRET)
  DATABASE_URL (same Supabase)
  CORS_ORIGIN
  PORT=3003
```

### Self-hosted (optional)
`docker-compose.yml`: Next.js + realtime + Postgres + coturn on single $5 VPS. Documented in `docs/DEPLOYMENT.md`.

---

## 13. Free-Tier Plan (₹0)

### Free
| Component | Free tier | Limit |
|---|---|---|
| Vercel | Hobby | 100GB bandwidth, 100h serverless/month |
| Render | Free | 750h/month, sleeps 15min idle |
| Supabase | Free | 500MB DB, 1GB egress, pauses 7d idle |
| Google OAuth | Free | No quota issues normal use |
| Google STUN | Free | No auth, no quota |
| Cloudflare R2 | Free | 10GB storage, 1M class-A ops/month |
| YouTube IFrame API | Free | ToS-compliant |

### Costs money if you scale
| Component | Trigger | Cost |
|---|---|---|
| TURN server | ~15% symmetric NAT users | coturn on $5 VPS, or Twilio $0.001/min |
| SFU | Rooms >6 voice/video | LiveKit Cloud free 1000min, then $0.005/min |
| Postgres | DB >500MB | Supabase Pro $25/mo |
| Realtime server | Need always-on | Render Starter $7/mo |
| Bandwidth | Vercel egress >100GB | Vercel Pro $20/mo |

All trigger points documented in `docs/DEPLOYMENT.md`.

---

## 14. Implementation Roadmap

### Phase 1 — Foundation
- Clean Next.js project (remove India scaffolding)
- DARKO design system (tokens, type, motion, dark primary)
- Landing page (`/`) with hero, features, CTA
- NextAuth: Google + guest strategy
- Prisma schema, migrations, seed
- Room CRUD: create, list, join, delete
- `/join/[roomId]` flow with password prompt
- `/room/[roomId]` shell (empty state with "Invite friends" CTA)
- `.env.example`, README

**Gate:** Guest creates room → shares link → second browser joins as guest → both see each other's name (no realtime yet — REST join only)

### Phase 2 — Realtime
- Socket.IO mini-service on 3003
- Auth middleware (JWT + guest)
- Room namespace + membership
- Presence (join/leave/heartbeat/timeout)
- Chat (send/receive/delete/reaction/typing)
- Roles (server-authoritative, ROLE_UPDATE)
- Permissions (per-event check)
- Host transfer (auto on timeout + manual)

**Gate:** Two browsers → live presence → chat works → host kicks → kicked socket disconnects server-side

### Phase 3 — WebRTC
- `MediaProvider` + `MeshMediaProvider`
- Signaling relay (offer/answer/ICE)
- Mic/cam toggle, device selector
- Screen share via `getDisplayMedia`
- Connection quality indicator
- Reconnect on ICE failure
- Mobile: bottom-sheet device picker

**Gate:** Two browsers → both enable cam → see each other → one shares screen → other sees → toggle mic → switch camera without renegotiation

### Phase 4 — Watch Party
- YouTube IFrame API wrapper
- Direct video player
- Media state machine
- Sync algorithm (timestamp + clock offset + drift)
- Playlist CRUD + autoplay
- Host vs anyone control toggle

**Gate:** Host loads YouTube → all clients load → host plays → all play within 200ms → host seeks → all seek → drift >1.5s auto-corrects

### Phase 5 — Games
- Game registry + lobby
- Tic-Tac-Toe (authoritative state, spectators, rematch)
- Connect Four
- Chess (using `chess.js` MIT)
- Drawing mini-game
- Reconnect: re-fetch game state

**Gate:** Two players start Tic-Tac-Toe → moves sync → win detected → rematch → spectator watches → reconnect preserves state

### Phase 6 — Collaboration
- WebRTC DataChannel file transfer
- Offer/accept/reject UI
- Chunked transfer + progress
- Cancel mid-transfer
- Whiteboard (pen, highlighter, shapes, text, eraser)
- Operation-based sync (not full canvas)
- Undo/redo per user
- Link sharing with safe preview

**Gate:** User A offers 100MB file → B accepts → progress → downloads on B → cancel works → whiteboard strokes sync → undo → link preview shows title+favicon

### Phase 7 — Public Ecosystem
- Public lobby with active rooms
- Room/user report flow
- Admin dashboard (overview, reports, users, bans, system health)
- Feature flags (env-based)
- Auto-expiry of public rooms (24h)

**Gate:** Public room in lobby → join from lobby → report user → admin sees → bans → banned user can't rejoin

### Phase 8 — Polish
- PWA (manifest, icons, SW, install prompt)
- Mobile (bottom sheets, safe-area, low-bandwidth)
- Accessibility (keyboard, screen reader, reduced motion)
- Performance (lazy-load, virtualize chat, throttle presence)
- Security audit (full checklist)
- Tests (unit + integration + e2e Playwright)
- Deployment docs

**Gate (PRD §41 acceptance criteria 1-17):**
1. ✅ Create room without paying
2. ✅ Guest joins via link without account
3. ✅ Google login works
4. ✅ Multiple users realtime
5. ✅ Chat works
6. ✅ Voice/video where WebRTC permits
7. ✅ Screen sharing works
8. ✅ YouTube playback synchronizes
9. ✅ Host controls enforced server-side
10. ✅ 3+ multiplayer games
11. ✅ Room permissions work
12. ✅ Reconnect preserves state
13. ✅ Mobile usable
14. ✅ PWA installable
15. ✅ No paid API for MVP
16. ✅ No DRM bypass
17. ✅ Security validation implemented

---

## 15. Design System Direction

**Not Kosmi. Not Discord. Not Slack. Not a Tailwind demo.**

DARKO's visual language:
- **Cinematic dark** — deep navy/charcoal base (`#0A0B14`), not pure black
- **Layered surfaces** — 3-tier elevation (background → card → floating)
- **Soft glass** — `backdrop-blur` on overlay panels only, never whole UI
- **Subtle grain** — SVG noise at 3% opacity for film texture
- **Large expressive type** — display `clamp(2.5rem, 5vw, 4.5rem)`, body 16px
- **Ambient gradients** — slow-moving radial, never on text
- **Premium cards** — 1px subtle border + soft shadow, 8-12px radius max
- **Floating controls** — room controls hover, don't push layout
- **Spatial hierarchy** — depth via blur + shadow

### Color palette (preliminary, refined in Phase 1)
```css
--bg-base:        #0A0B14;
--bg-elevated:    #11131F;
--bg-overlay:     #1A1D2E;
--bg-input:       #0F1119;
--text-primary:   #F5F6FA;
--text-secondary: #B4B8C7;
--text-muted:     #6B7180;
--border-subtle:  rgba(255,255,255,0.06);
--border-strong:  rgba(255,255,255,0.12);
--accent-primary: #6366F1;   /* indigo — DARKO signature */
--accent-glow:    rgba(99,102,241,0.35);
--accent-success: #10B981;
--accent-warning: #F59E0B;
--accent-danger:  #EF4444;
```

**Indigo is intentional** — distinct from Kosmi (pink) and Discord (blurple). Premium, calm, slightly mysterious — fits "cinematic evening hangout".

### 7 Room themes
1. Midnight Lounge (default) — navy + indigo
2. Neon Arcade — black + magenta/cyan
3. Cozy Cinema — warm brown + amber
4. Cyber Loft — graphite + electric green
5. Space Station — black + cold blue
6. Sunset Drive-In — purple + orange
7. Minimal Studio — neutral gray + white

### Motion tokens
```css
--ease-out-cubic:    cubic-bezier(0.33, 1, 0.68, 1);
--ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
--dur-fast: 150ms; --dur-base: 250ms; --dur-slow: 400ms; --dur-cinematic: 800ms;
```

---

## 16. What I Build vs What Needs User Configuration

### I build (no user action)
- Full Next.js + TypeScript + Tailwind frontend
- DARKO design system
- Landing page + all marketing routes
- Auth scaffolding (NextAuth config + UI for Google + guest)
- Database schema + Prisma + seed
- Room CRUD + join flow
- Socket.IO realtime server
- Presence + chat + roles + permissions
- WebRTC mesh + signaling
- Watch party with YouTube + direct video + sync
- 3+ multiplayer games
- P2P file transfer
- Whiteboard
- Public lobby + reports + admin
- PWA manifest + service worker
- Tests (unit + integration + e2e)
- Security hardening
- Deployment docs

### User must configure
1. **Google OAuth credentials** — Create Google Cloud project, enable OAuth, paste `GOOGLE_CLIENT_ID`/`SECRET` to `.env.local`. README provided.
2. **Production database** (optional) — SQLite works zero-config for dev. Supabase for prod (signup, paste connection string). README provided.
3. **Production realtime host** (optional) — Mini-service runs locally for dev. Deploy to Render/Railway for prod. Dockerfile + deploy button provided.
4. **TURN server** (optional, ~15% NAT cases) — Self-host coturn on $5 VPS or paid provider. `docs/SELF_HOSTED_TURN.md` provided.

### Works end-to-end in this sandbox
- Guest session creation
- Room creation
- Room joining (two browsers)
- Realtime presence + chat
- WebRTC voice/video between two tabs
- YouTube watch sync
- Tic-Tac-Toe game
- Whiteboard
- P2P file transfer (between two tabs)

### Scaffolded but requires external config
- Google OAuth (button visible, needs user's credentials to actually auth — guest login works fully)
- Production deployment (code is ready, user runs `vercel deploy`)

---

## 17. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| WebRTC fails on symmetric NAT | Med | Med | Document; TURN setup guide |
| P2P mesh melts at 8+ | High if popular | Med | Hard cap 6 in UI; SFU stub for future |
| Render free tier sleeps | High | Low | Reconnect logic; upgrade path documented |
| Supabase pauses 7d idle | Med | Low | Ping endpoint or upgrade |
| YouTube IFrame rate limits | Low | Low | Cache player; debounce state |
| Socket.IO memory grows | Med | Med | Active rooms only in-memory; idle evicted 30min |

---

## 18. Decision Log

1. **Socket.IO over raw WebSocket** — Slightly heavier, but rooms/acks/reconnect/binary save weeks. Acceptable for ₹0.
2. **SQLite for dev** — Zero-config. Schema Postgres-compatible (only `enum` differs — Prisma handles).
3. **Full mesh over SFU** — Honestly limited to ~6, but free. Provider abstraction = LiveKit drop-in later.
4. **NextAuth over custom JWT** — Battle-tested, handles Google OAuth edge cases, CSRF out of box.
5. **In-memory room state over Redis** — Free. Trade-off: state lost on restart. Clients reconnect, server rehydrates from DB (settings, playlist, last 200 msgs) + presence rebuilds from heartbeats.
6. **No ORM abstraction** — Prisma is the only ORM. Adapter interface exists for non-Prisma providers but default is Prisma everywhere.
7. **Indigo as signature** — Distinct from Kosmi (pink) and Discord (blurple). Premium, calm, cinematic.

---

## Ready to start Phase 1?

This architecture is complete and honest. Every decision has a rationale tied to either the PRD or a real constraint.

**Next step:** Begin Phase 1 (Foundation) — clean the sandbox, set up the DARKO design system, build the landing page, wire up NextAuth + guest sessions, define the Prisma schema, and ship room creation/joining.

Type **"go"** or **"start Phase 1"** to begin.
