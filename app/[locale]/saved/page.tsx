"use client";

import { useTranslations } from "next-intl";
import SimpleVideoList from "@/components/SimpleVideoList";

// Signed-in only — protected in middleware.ts. Sidebar.tsx points here
// (and redirects to /sign-in instead while signed out).
export default function SavedPage() {
  const t = useTranslations("SavedVideos");
  return (
    <SimpleVideoList
      kind="saved"
      title={t("title")}
      subtitle={t("subtitle")}
      emptyTitle={t("emptyTitle")}
      emptyBody={t("emptyBody")}
      loadErrorText={t("loadError")}
      tryAgainText={t("tryAgain")}
    />
  );
}
