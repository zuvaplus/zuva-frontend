"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
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
  LayoutDashboard,
  UploadCloud,
  Flame,
} from "lucide-react";
import { useUserRole } from "./UserRoleProvider";

const AMBER = "#f37b0d";

// Canonical (English) category values — these are the actual data values
// used in URLs and sent to the backend (must match VALID_VIDEO_CATEGORIES
// in zuva-backend/zuva-api.js). Only the *displayed* label is translated,
// via the shared "Categories" namespace (also used by VideoUploadForm).
const CATEGORIES = ["Comedy", "Drama", "Music", "News", "Sports", "Lifestyle", "Education", "Other"];

const MAIN_LINKS = [
  { href: "/feed",     labelKey: "home",     icon: Home },
  { href: "/trending", labelKey: "trending", icon: TrendingUp },
];

const LIBRARY_LINKS = [
  { href: "/following", labelKey: "following",    icon: Users },
  { href: "/history",   labelKey: "watchHistory",  icon: History },
  { href: "/saved",     labelKey: "savedVideos",   icon: Bookmark },
];

const STUDIO_LINKS = [
  { href: "/creator-dashboard", labelKey: "creatorDashboard", icon: LayoutDashboard },
  { href: "/upload",            labelKey: "uploadVideo",      icon: UploadCloud },
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

// Flares gets its own distinct, always-amber treatment (not the plain
// grey-until-active style of the other links) — it's a different *mode*
// of the app (full-screen swipe feed), not another item in the regular
// browse list, and the sidebar should make that legible at a glance.
function FlaresLink({ active }: { active: boolean }) {
  const t = useTranslations("Sidebar");
  return (
    <Link
      href="/flares"
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all border
        ${active
          ? "bg-gold-400 text-black border-gold-400 shadow-gold"
          : "bg-gold-400/10 text-gold-400 border-gold-400/25 hover:bg-gold-400/20"
        }`}
    >
      <Flame size={18} className={active ? "" : "fill-gold-400/30"} />
      {t("flares")}
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
  const t = useTranslations("Sidebar");
  const tCategories = useTranslations("Categories");
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { role } = useUserRole();

  return (
    <aside className="hidden md:flex md:flex-col fixed top-14 left-0 bottom-0 w-60 bg-black border-r border-gold-400/10 overflow-y-auto scrollbar-hide z-40">
      <nav className="flex-1 px-2 py-3">
        <div className="px-1 pb-3">
          <FlaresLink active={pathname === "/flares" || pathname.startsWith("/flares/")} />
        </div>

        <SectionLabel>{t("main")}</SectionLabel>
        <div className="space-y-0.5">
          {MAIN_LINKS.map(({ href, labelKey, icon }) => (
            <SidebarLink key={href} href={href} label={t(labelKey)} icon={icon} active={pathname === href} />
          ))}
        </div>

        {role === "creator" && (
          <>
            <SectionLabel>{t("studio")}</SectionLabel>
            <div className="space-y-0.5">
              {STUDIO_LINKS.map(({ href, labelKey, icon }) => (
                <SidebarLink key={href} href={href} label={t(labelKey)} icon={icon} active={pathname === href} />
              ))}
            </div>
          </>
        )}

        <SectionLabel>{t("library")}</SectionLabel>
        <div className="space-y-0.5">
          {LIBRARY_LINKS.map(({ href, labelKey, icon }) => (
            <SidebarLink key={href} href={href} label={t(labelKey)} icon={icon} active={pathname === href} />
          ))}
        </div>

        <SectionLabel>{t("browse")}</SectionLabel>
        <div>
          <button
            onClick={() => setCategoriesOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-gold-300 hover:bg-white/5 transition-colors"
          >
            <span>{t("categories")}</span>
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
                    {tCategories(category)}
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
          {t("about")}
        </Link>
        <Link href="/terms" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-gold-300 hover:bg-white/5 transition-colors">
          <FileText size={16} />
          {t("terms")}
        </Link>
        {role !== "creator" && (
          <Link href="/creator-signup" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-gold-300 hover:bg-white/5 transition-colors">
            <UserPlus size={16} />
            {t("creatorSignUp")}
          </Link>
        )}
      </div>
    </aside>
  );
}
