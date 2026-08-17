"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUserRole } from "@/components/UserRoleProvider";

// "My Profile" has no dedicated page of its own — it's a stable redirect
// to the signed-in user's own /channel/[username], the same public-profile
// page creators already see (GET /api/channel/:username doesn't gate by
// role, so it's a valid destination for viewers too). Signed-in only —
// protected in middleware.ts.
export default function ProfileRedirectPage() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const { username, loading } = useUserRole();

  useEffect(() => {
    if (loading) return;
    if (username) {
      router.replace(`/channel/${username}`);
    } else {
      router.replace("/sign-in");
    }
  }, [loading, username, router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-zinc-500 text-sm">{t("redirecting")}</p>
    </div>
  );
}
