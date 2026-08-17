"use client";

import { useTranslations } from "next-intl";
import SimpleVideoList from "@/components/SimpleVideoList";

// Signed-in only — protected in middleware.ts. Sidebar.tsx points here
// (and redirects to /sign-in instead while signed out).
export default function HistoryPage() {
  const t = useTranslations("WatchHistory");
  return (
    <SimpleVideoList
      kind="history"
      title={t("title")}
      subtitle={t("subtitle")}
      emptyTitle={t("emptyTitle")}
      emptyBody={t("emptyBody")}
      loadErrorText={t("loadError")}
      tryAgainText={t("tryAgain")}
    />
  );
}
