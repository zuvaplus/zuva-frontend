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
- `middleware.ts` uses `clerkMiddleware` + `createRouteMatcher` to protect `/feed`, `/wallet`, `/creator`
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk `<SignIn>` with Zuva branding wrapper
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk `<SignUp>` with Zuva branding wrapper
- `lib/clerk-appearance.ts` — shared appearance config (vantablack `#000000` bg, amber `#F5A623` primary)

Catch-all routes (`[[...sign-in]]` / `[[...sign-up]]`) are required for Clerk's multi-step auth flows (MFA, email verification, etc.).

**To go live:** add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to Railway env vars.
**Backend:** replace the `req.user` shim in `server.js` with JWT verification from Clerk session tokens.

### Turbopack
Dev server uses Turbopack for fast HMR: `npm run dev` → `next dev --turbopack`

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
