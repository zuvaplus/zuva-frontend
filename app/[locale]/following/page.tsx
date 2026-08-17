"use client";

import { useTranslations } from "next-intl";
import SimpleVideoList from "@/components/SimpleVideoList";

// Signed-in only — protected in middleware.ts. Sidebar.tsx points here
// (and redirects to /sign-in instead while signed out).
export default function FollowingPage() {
  const t = useTranslations("Following");
  return (
    <SimpleVideoList
      kind="following"
      title={t("title")}
      subtitle={t("subtitle")}
      emptyTitle={t("emptyTitle")}
      emptyBody={t("emptyBody")}
      loadErrorText={t("loadError")}
      tryAgainText={t("tryAgain")}
    />
  );
}
