import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

// Every protected path, once per locale (e.g. /en/wallet, /fr/wallet) —
// derived from routing.locales so adding a language never requires
// touching this list again.
// NOTE: creator-dashboard was missing from this list before locale
// routing was added — the page already self-redirected client-side via
// useUserRole, but that leaves a moment of exposed content for a
// signed-out visitor before the JS-side redirect fires. Added here for
// parity with the other creator-only routes.
//
// "/feed" is deliberately NOT here (removed) — it's now the filtered-
// results view reached from the homepage's category/country bar, which
// anonymous visitors browse too (GET /api/feed already supports
// optionalAuth with the shuffled-fallback ranking for anyone with no
// watch history). "/" itself was never protected either, for the same
// reason — the homepage is the universal signed-in/signed-out experience.
const PROTECTED_PATHS = ["/wallet", "/creator/", "/admin", "/upload", "/creator-dashboard"];

const isProtectedRoute = createRouteMatcher(
  routing.locales.flatMap((locale) => PROTECTED_PATHS.map((p) => `/${locale}${p}(.*)`))
);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    // Runs on every route except Next internals, static files, and
    // /api/* — /api/* is a server-side rewrite proxy to the Express
    // backend (see next.config.mjs), not a page: letting next-intl's
    // locale routing touch it would 307-redirect every fetch("/api/...")
    // call to "/en/api/..." and break the entire proxy, since the
    // rewrite only matches the literal "/api/:path*" source.
    "/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
