import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware drop-ins for next/link and next/navigation — every Link,
// useRouter, and usePathname in this app must import from here instead
// of "next/link"/"next/navigation", or navigation silently drops the
// locale prefix (e.g. a click on /fr/feed would land on /wallet, not
// /fr/wallet). router.push/replace still take plain paths like "/wallet";
// the wrapper prepends the current locale automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
