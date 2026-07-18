"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useUserRole } from "./UserRoleProvider";
import BecomeCreatorModal from "./BecomeCreatorModal";

const AMBER = "#f37b0d";
const MUTED = "#71717a";

interface BottomNavProps {
  onOpenProfileMenu: () => void;
}

export default function BottomNav({ onOpenProfileMenu }: BottomNavProps) {
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
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link href="/search" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive("/search") ? "text-gold-400" : "text-zinc-500"}`}>
            <Search size={20} color={isActive("/search") ? AMBER : MUTED} />
            <span className="text-[10px] font-medium">Search</span>
          </Link>

          {role === "creator" ? (
            <Link href="/upload" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive("/upload") ? "text-gold-400" : "text-zinc-500"}`}>
              <Plus size={20} color={isActive("/upload") ? AMBER : MUTED} />
              <span className="text-[10px] font-medium">Upload</span>
            </Link>
          ) : (
            <button onClick={() => setShowCreatorModal(true)} className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-500">
              <Plus size={20} color={MUTED} />
              <span className="text-[10px] font-medium">Upload</span>
            </button>
          )}

          <Link href="/notifications" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive("/notifications") ? "text-gold-400" : "text-zinc-500"}`}>
            <Bell size={20} color={isActive("/notifications") ? AMBER : MUTED} />
            <span className="text-[10px] font-medium">Alerts</span>
          </Link>

          <button onClick={onOpenProfileMenu} className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-500">
            <User size={20} color={MUTED} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {showCreatorModal && <BecomeCreatorModal onClose={() => setShowCreatorModal(false)} />}
    </>
  );
}
