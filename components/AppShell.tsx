"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "@/i18n/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import ProfileMenu from "./ProfileMenu";
import { UserRoleProvider } from "./UserRoleProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const signedIn = isLoaded && Boolean(isSignedIn);
  const pathname = usePathname();

  // Flares is a deliberately full-screen, chrome-free experience (its own
  // back arrow + Zuva mark instead) — no Navbar/Sidebar/BottomNav, and no
  // padded <main> wrapper, since the video itself needs to be full-bleed
  // edge-to-edge with zero letterboxing.
  const isFlares = pathname === "/flares" || pathname.startsWith("/flares/");
  if (isFlares) {
    return <UserRoleProvider>{children}</UserRoleProvider>;
  }

  return (
    <UserRoleProvider>
      <Navbar onOpenProfileMenu={() => setProfileMenuOpen(true)} />

      {signedIn && <Sidebar />}

      <main className={signedIn ? "pt-14 md:pl-60 pb-20 md:pb-6 min-h-screen" : "pt-14 pb-6 min-h-screen"}>
        {children}
      </main>

      {signedIn && <BottomNav onOpenProfileMenu={() => setProfileMenuOpen(true)} />}

      {profileMenuOpen && signedIn && <ProfileMenu onClose={() => setProfileMenuOpen(false)} />}
    </UserRoleProvider>
  );
}
