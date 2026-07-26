# Zuva Frontend — CLAUDE.md

## Overview
Next.js 15 frontend for Zuva.TV — African & Caribbean streaming with a Suns tipping economy.
Dark gold design system. App Router, TypeScript, Tailwind CSS.

## Stack
| Layer | Tech |
|-------|------|
| Framework | Next.js 15.3 (App Router) |
| Auth | Clerk (`@clerk/nextjs`) |
| Styling | Tailwind CSS 3 + custom gold/surface tokens |
| Language | TypeScript 5 |
| Dev bundler | Turbopack (`next dev --turbopack`) |
| Deployment | Railway |

## Key Files
```
app/
  layout.tsx               Root layout (Navbar, fonts, metadata)
  page.tsx                 Home feed (For You / Shorts / Videos tabs, infinite scroll)
  feed/page.tsx            Feed page
  watch/[id]/page.tsx      Video player (portrait 9:16 + landscape 16:9)
  creator/[username]/      Creator profile (UUID-based username param)
  wallet/page.tsx          Balance card + Overview/History/Buy Suns tabs
  sign-in/page.tsx         Sign-in / create account (auth shim, wire to Clerk)
  terms/page.tsx           Terms of Service
  about/page.tsx           About page + CTA to /creator-signup
  creator-signup/page.tsx  Creator application form (Turnstile-protected)
  admin/page.tsx           Admin dashboard: Applications / Content / Users tabs

components/
  FeedCard.tsx             Card for both orientations + tip button
  TipModal.tsx             Sun tip modal (slider + quick amounts)
  Navbar.tsx               Fixed top bar + mobile bottom nav

lib/
  api.ts                   Typed API calls using NEXT_PUBLIC_API_URL
  types.ts                 TypeScript types matching backend response shapes
  utils.ts                 formatSuns, formatDuration, timeAgo, tierInfo
```

## Required Environment Variables
```
NEXT_PUBLIC_API_URL=http://localhost:3000   # dev default
BACKEND_URL=https://your-backend.railway.app  # used by next.config.mjs rewrites in production

# Clerk (required after auth wiring)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Cloudflare Turnstile (bot protection on /creator-signup)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key

# Admin dashboard — must match backend's ADMIN_EMAIL
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@zuva.tv
```

## Architecture Notes

### API Proxy
`next.config.mjs` rewrites `/api/*` → `BACKEND_URL/api/*` server-side.
In dev `BACKEND_URL` defaults to `http://localhost:3000`. No CORS issues.

### Design System
- Background: `#0A0A0A`
- Gold primary: `#D4AF37`
- Custom Tailwind scales: `gold-*`, `surface-*` (see `tailwind.config.ts`)

### Auth (Clerk) — fully wired
- `app/layout.tsx` wraps everything in `<ClerkProvider>`
- `middleware.ts` uses `clerkMiddleware` + `createRouteMatcher` to protect `/wallet`, `/creator/*`, `/admin`,
  `/upload`, `/creator-dashboard`. `/` and `/feed` are deliberately NOT protected — both are browsable
  signed-out (see Homepage & Navigation below)
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk `<SignIn>` with Zuva branding wrapper
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk `<SignUp>` with Zuva branding wrapper
- `lib/clerk-appearance.ts` — shared appearance config (vantablack `#000000` bg, amber `#F5A623` primary)

### Admin Dashboard (`/admin`)
Client-side gated: `useUser()` compares the signed-in Clerk email against `NEXT_PUBLIC_ADMIN_EMAIL`;
non-matching users are redirected to `/` (or `/sign-in` if signed out). `middleware.ts` additionally
requires sign-in before the page loads at all. Every request to `/api/admin/*` sends an
`x-admin-email` header, which the backend's `requireAdmin` guard checks — see the note in
`zuva-backend/CLAUDE.md` about this being a temporary, spoofable check that needs real session
verification before production.

Catch-all routes (`[[...sign-in]]` / `[[...sign-up]]`) are required for Clerk's multi-step auth flows (MFA, email verification, etc.).

**To go live:** add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to Railway env vars.
**Backend:** replace the `req.user` shim in `server.js` with JWT verification from Clerk session tokens.

### Turbopack
Dev server uses Turbopack for fast HMR: `npm run dev` → `next dev --turbopack`

### Homepage & Navigation
- `app/[locale]/page.tsx` ("/") is the **universal homepage** — identical for
  signed-in and signed-out visitors, and identical for creators and viewers
  (no separate "viewer mode"). Thin logo+slogan banner → search bar →
  category/country bar → `<VideoGrid />` (no filters). All the personalization
  happens server-side inside `GET /api/feed` — this page doesn't know or care
  whether it got the personalized ranking or the shuffled fallback
- `components/VideoGrid.tsx` — the shared fetch/pagination/grid component
  behind `GET /api/feed`, parameterized by optional `contentCategory`/`country`.
  Used by both the homepage (unfiltered) and `/feed` (filtered results)
- `app/[locale]/feed/page.tsx` is now the **filtered-results view** — reached
  by clicking a category or country pill on the homepage
  (`/feed?content_category=documentary`, `/feed?country=NG`), not a "Home" nav
  destination itself. Country codes come from `lib/countries.ts` (ISO alpha-2,
  matches `users.country_code`), the same list `creator-signup` derives its
  (names-only) country dropdown from
- Sidebar's "Home" and BottomNav's Home both point at `/`, not `/feed`
- Sidebar's Studio section (creator-only): My Channel, Creator Dashboard,
  Upload Video, Go Live — Go Live renders as a disabled "Soon" placeholder
  since no live-streaming build exists yet, not a dead link
- No "Switch to Viewer Mode" anywhere — removed from `ProfileMenu.tsx`.
  Creators and viewers see identical Home/Trending/Flares/Following/Watch
  History/Saved Videos navigation at all times
- **Known gap, pre-existing**: Trending/Following/Watch History/Saved Videos
  are linked from the sidebar/profile menu but the pages themselves don't
  exist yet (dead links) — out of scope for the nav-simplification work above,
  which was specifically about removing the viewer/creator split, not building
  those four features

## Running Locally
```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # starts on :3001 (or :3000 if PORT not set)
```

## Pages + API Endpoints Used
| Page | Backend call |
|------|-------------|
| Home feed | `GET /api/feed?orientation=&cursor=` |
| Watch | `POST /api/feed/view-complete` |
| Creator | `GET /api/creator/earnings/:id` |
| Wallet overview | `GET /api/wallet/balance` + `GET /api/wallet/transactions` |
| Buy Suns | `POST /api/suns/checkout` |
| Tip | `POST /api/suns/tip` |
