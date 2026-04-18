"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AMBER = "#ff8a00";
const MUTED = "#555555";

const NAV_LINKS = [
  { href: "/feed",    label: "Feed",    icon: HomeIcon    },
  { href: "/wallet",  label: "Wallet",  icon: WalletIcon  },
  { href: "/sign-in", label: "Sign In", icon: UserIcon    },
];

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? AMBER : MUTED;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={c} strokeWidth="2" fill={active ? `${AMBER}20` : "none"} strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke={c} strokeWidth="2"/>
    </svg>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  const c = active ? AMBER : MUTED;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="15" rx="2"
        stroke={c} strokeWidth="2" fill={active ? `${AMBER}20` : "none"}/>
      <circle cx="16" cy="12" r="1.2" fill={c}/>
      <path d="M2 9h20" stroke={c} strokeWidth="2"/>
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  const c = active ? AMBER : MUTED;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4"
        stroke={c} strokeWidth="2" fill={active ? `${AMBER}20` : "none"}/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function Navbar() {
  const pathname  = usePathname();
  const isLanding = pathname === "/";

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gold-400/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" aria-label="Zuva home">
            <Image
              src="/zuva-logo.svg"
              alt="Zuva"
              width={60}
              height={60}
              unoptimized
              priority
            />
          </Link>

          {/* Desktop nav — hidden on landing page to keep it minimal */}
          {!isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href === "/feed" && pathname.startsWith("/feed"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                      ${active
                        ? "bg-gold-400/12 text-gold-400 border border-gold-400/25"
                        : "text-zinc-500 hover:text-gold-300 hover:bg-white/4"
                      }`}
                  >
                    <Icon active={active} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Landing page: just a Sign In button */}
          {isLanding && (
            <Link
              href="/sign-in"
              className="hidden md:inline-flex items-center gap-2 border border-gold-400/30 text-gold-400 hover:bg-gold-400/10 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ── Bottom mobile nav — hidden on landing ─────────── */}
      {!isLanding && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-gold-400/10">
          <div className="flex items-center justify-around py-2 px-4">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href === "/feed" && pathname.startsWith("/feed"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 px-4 py-1 transition-all
                    ${active ? "text-gold-400" : "text-zinc-600"}`}
                >
                  <Icon active={active} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
