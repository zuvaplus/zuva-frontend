import { defineRouting } from "next-intl/routing";

// Adding a language later (pt, sw, ...) is just one entry here — every
// route, the middleware's protected-path matcher, and the language
// switcher all derive from this list, nothing else needs touching.
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
