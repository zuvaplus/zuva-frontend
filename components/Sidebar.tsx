"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Users,
  History,
  Bookmark,
  ChevronDown,
  Info,
  FileText,
  UserPlus,
} from "lucide-react";

const AMBER = "#f37b0d";

const CATEGORIES = ["Comedy", "Drama", "Music", "News", "Sports", "Lifestyle", "Education", "Other"];

const MAIN_LINKS = [
  { href: "/feed",     label: "Home",     icon: Home },
  { href: "/trending", label: "Trending", icon: TrendingUp },
];

const LIBRARY_LINKS = [
  { href: "/following", label: "Following",     icon: Users },
  { href: "/history",   label: "Watch History", icon: History },
  { href: "/saved",     label: "Saved Videos",  icon: Bookmark },
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${active ? "bg-gold-400/12 text-gold-400" : "text-zinc-400 hover:text-gold-300 hover:bg-white/5"}`}
    >
      <Icon size={18} color={active ? AMBER : undefined} />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <aside className="hidden md:flex md:flex-col fixed top-14 left-0 bottom-0 w-60 bg-black border-r border-gold-400/10 overflow-y-auto scrollbar-hide z-40">
      <nav className="flex-1 px-2 py-3">
        <SectionLabel>Main</SectionLabel>
        <div className="space-y-0.5">
          {MAIN_LINKS.map(({ href, label, icon }) => (
            <SidebarLink key={href} href={href} label={label} icon={icon} active={pathname === href} />
          ))}
        </div>

        <SectionLabel>Library</SectionLabel>
        <div className="space-y-0.5">
          {LIBRARY_LINKS.map(({ href, label, icon }) => (
            <SidebarLink key={href} href={href} label={label} icon={icon} active={pathname === href} />
          ))}
        </div>

        <SectionLabel>Browse</SectionLabel>
        <div>
          <button
            onClick={() => setCategoriesOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-gold-300 hover:bg-white/5 transition-colors"
          >
            <span>Categories</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
            />
          </button>
          {categoriesOpen && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-gold-400/10 space-y-0.5">
              {CATEGORIES.map((category) => {
                const href = `/category/${category.toLowerCase()}`;
                return (
                  <Link
                    key={category}
                    href={href}
                    className={`block px-3 py-1.5 rounded-lg text-sm transition-colors
                      ${pathname === href ? "text-gold-400" : "text-zinc-500 hover:text-gold-300"}`}
                  >
                    {category}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="px-2 py-3 border-t border-gold-400/10 space-y-0.5">
        <Link href="/about" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-gold-300 hover:bg-white/5 transition-colors">
          <Info size={16} />
          About
        </Link>
        <Link href="/terms" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-gold-300 hover:bg-white/5 transition-colors">
          <FileText size={16} />
          Terms
        </Link>
        <Link href="/creator-signup" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-gold-300 hover:bg-white/5 transition-colors">
          <UserPlus size={16} />
          Creator Sign Up
        </Link>
      </div>
    </aside>
  );
}
