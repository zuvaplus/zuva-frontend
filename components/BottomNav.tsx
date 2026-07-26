"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, Search, Plus, Bell, User, Flame } from "lucide-react";
import { useUserRole } from "./UserRoleProvider";
import BecomeCreatorModal from "./BecomeCreatorModal";

const AMBER = "#f37b0d";
const MUTED = "#71717a";

interface BottomNavProps {
  onOpenProfileMenu: () => void;
}

export default function BottomNav({ onOpenProfileMenu }: BottomNavProps) {
  const t = useTranslations("BottomNav");
  const pathname = usePathname();
  const { role } = useUserRole();
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-gold-400/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-2 px-2">
          <Link href="/feed" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive("/feed") ? "text-gold-400" : "text-zinc-500"}`}>
            <Home size={20} color={isActive("/feed") ? AMBER : MUTED} />
            <span className="text-[10px] font-medium">{t("home")}</span>
          </Link>

          {/* Flares — always-amber Flame icon, distinct from the other
              items which only turn amber when active, since it's a
              different mode of the app rather than another browse tab. */}
          <Link href="/flares" className="flex flex-col items-center gap-1 px-3 py-1 text-gold-400">
            <Flame size={20} color={AMBER} fill={isActive("/flares") ? AMBER : "none"} />
            <span className="text-[10px] font-bold">{t("flares")}</span>
          </Link>

          <Link href="/search" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive("/search") ? "text-gold-400" : "text-zinc-500"}`}>
            <Search size={20} color={isActive("/search") ? AMBER : MUTED} />
            <span className="text-[10px] font-medium">{t("search")}</span>
          </Link>

          {role === "creator" ? (
            <Link href="/upload" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive("/upload") ? "text-gold-400" : "text-zinc-500"}`}>
              <Plus size={20} color={isActive("/upload") ? AMBER : MUTED} />
              <span className="text-[10px] font-medium">{t("upload")}</span>
            </Link>
          ) : (
            <button onClick={() => setShowCreatorModal(true)} className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-500">
              <Plus size={20} color={MUTED} />
              <span className="text-[10px] font-medium">{t("upload")}</span>
            </button>
          )}

          <Link href="/notifications" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive("/notifications") ? "text-gold-400" : "text-zinc-500"}`}>
            <Bell size={20} color={isActive("/notifications") ? AMBER : MUTED} />
            <span className="text-[10px] font-medium">{t("alerts")}</span>
          </Link>

          <button onClick={onOpenProfileMenu} className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-500">
            <User size={20} color={MUTED} />
            <span className="text-[10px] font-medium">{t("profile")}</span>
          </button>
        </div>
      </nav>

      {showCreatorModal && <BecomeCreatorModal onClose={() => setShowCreatorModal(false)} />}
    </>
  );
}
