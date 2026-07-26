"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  User,
  Wallet,
  History,
  Bookmark,
  Settings,
  UserPlus,
  LogOut,
  Tv,
  LayoutDashboard,
  UploadCloud,
  Repeat,
} from "lucide-react";
import { useUserRole } from "./UserRoleProvider";
import LanguageSwitcher from "./LanguageSwitcher";

interface MenuItem {
  href:  string;
  labelKey: string;
  icon:  React.ComponentType<{ size?: number }>;
}

const VIEWER_ITEMS: MenuItem[] = [
  { href: "/profile",        labelKey: "myProfile",      icon: User },
  { href: "/wallet",         labelKey: "wallet",          icon: Wallet },
  { href: "/history",        labelKey: "watchHistory",    icon: History },
  { href: "/saved",          labelKey: "savedVideos",     icon: Bookmark },
  { href: "/settings",       labelKey: "accountSettings", icon: Settings },
  { href: "/creator-signup", labelKey: "becomeCreator",   icon: UserPlus },
];

function creatorItems(username: string | null): MenuItem[] {
  return [
    { href: username ? `/channel/${username}` : "/channel", labelKey: "myChannel",       icon: Tv },
    { href: "/creator-dashboard",                            labelKey: "creatorDashboard", icon: LayoutDashboard },
    { href: "/upload",                                       labelKey: "uploadVideo",      icon: UploadCloud },
    { href: "/wallet",                                       labelKey: "wallet",           icon: Wallet },
    { href: "/history",                                      labelKey: "watchHistory",     icon: History },
    { href: "/saved",                                        labelKey: "savedVideos",      icon: Bookmark },
    { href: "/settings",                                     labelKey: "accountSettings",  icon: Settings },
    { href: "/feed",                                         labelKey: "switchToViewer",   icon: Repeat },
  ];
}

export default function ProfileMenu({ onClose }: { onClose: () => void }) {
  const t = useTranslations("ProfileMenu");
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { role, username } = useUserRole();
  const items = role === "creator" ? creatorItems(username) : VIEWER_ITEMS;

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed md:absolute inset-x-0 md:inset-x-auto bottom-0 md:bottom-auto md:top-16 md:right-4
                   w-full md:w-64 bg-surface-200 border border-gold-400/20 rounded-t-3xl md:rounded-2xl
                   p-2 animate-slide-up md:animate-fade-in shadow-gold-lg"
      >
        {user && (
          <div className="px-3 py-3 border-b border-gold-400/10 mb-2">
            <p className="text-white font-semibold text-sm truncate">
              {user.fullName ?? user.username ?? t("account")}
            </p>
            <p className="text-zinc-500 text-xs truncate">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        )}

        <div className="space-y-0.5 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {items.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-gold-400 hover:bg-white/5 transition-colors"
            >
              <Icon size={17} />
              {t(labelKey)}
            </Link>
          ))}

          <div className="border-t border-gold-400/10 mt-1 pt-1">
            <LanguageSwitcher />
          </div>

          <button
            onClick={() => {
              onClose();
              signOut(() => router.push("/"));
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors mt-1"
          >
            <LogOut size={17} />
            {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
