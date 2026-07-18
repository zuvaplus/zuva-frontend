"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Search, User as UserIcon } from "lucide-react";

interface NavbarProps {
  onOpenProfileMenu: () => void;
}

export default function Navbar({ onOpenProfileMenu }: NavbarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const isAdmin   = pathname.startsWith("/admin");
  const { isSignedIn, user } = useUser();

  const [query, setQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gold-400/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3 md:gap-6">

        {/* Logo — inline SVG crops zuva-logo.svg to sun only.
             viewBox="300 100 900 900" derived from SVG geometry:
             sun raster at x=351–1149, y=150–947 (matrix-scaled);
             ZUVA text starts at y=1272 — safely excluded. */}
        <Link href="/" aria-label="Zuva home" className="shrink-0">
          <svg
            viewBox="300 100 900 900"
            width="40"
            height="40"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Zuva sun"
          >
            <image
              href="/zuva-logo.svg"
              x="0"
              y="0"
              width="1500"
              height="1500"
            />
          </svg>
        </Link>

        {isAdmin && (
          <span className="hidden sm:inline bg-gold-400 text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0">
            Admin
          </span>
        )}

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators, videos, tags..."
              aria-label="Search creators, videos, tags"
              className="w-full bg-surface-200 border border-gold-400/10 focus:border-gold-400/40 rounded-full pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
            />
          </div>
        </form>

        {/* Right — sign in / profile */}
        <div className="shrink-0">
          {isSignedIn ? (
            <button
              onClick={onOpenProfileMenu}
              aria-label="Open profile menu"
              className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border border-gold-400/25 hover:border-gold-400/50 transition-colors bg-surface-200"
            >
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} className="text-gold-400" />
              )}
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 border border-gold-400/30 text-gold-400 hover:bg-gold-400/10 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
