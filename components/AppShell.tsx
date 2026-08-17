"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "@/i18n/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import ProfileMenu from "./ProfileMenu";
import Footer from "./Footer";
import { UserRoleProvider } from "./UserRoleProvider";

// The footer is for public-facing pages — hidden on the creator/admin
// tools below, where it'd just be dead weight under a dashboard UI.
const NO_FOOTER_PATHS = ["/creator-dashboard", "/admin", "/settings"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const signedIn = isLoaded && Boolean(isSignedIn);
  const pathname = usePathname();
  const hideFooter = NO_FOOTER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

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

      {/* Visible to signed-out visitors too — see Sidebar.tsx for how
          the library links (Following/Watch History/Saved Videos)
          redirect to sign-in instead of their real routes while
          signed out, while Home/Trending/Flares/Categories stay open. */}
      <Sidebar signedIn={signedIn} />

      <main className={`pt-14 md:pl-60 min-h-screen flex flex-col ${signedIn ? "pb-20 md:pb-6" : "pb-6"}`}>
        <div className="flex-1">{children}</div>
        {!hideFooter && <Footer />}
      </main>

      {signedIn && <BottomNav onOpenProfileMenu={() => setProfileMenuOpen(true)} />}

      {profileMenuOpen && signedIn && <ProfileMenu onClose={() => setProfileMenuOpen(false)} />}
    </UserRoleProvider>
  );
}
