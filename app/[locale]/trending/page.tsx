"use client";

import { useTranslations } from "next-intl";
import VideoGrid from "@/components/VideoGrid";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

// Public — no auth required (see Sidebar.tsx / middleware.ts). Reuses
// VideoGrid wholesale (pagination, sort bar, FeedCard grid) rather than
// a bespoke ranking algorithm: "Trending" starts on the Most Viewed
// sort, and a viewer can switch to any other option same as anywhere
// else VideoGrid appears.
export default function TrendingPage() {
  const t = useTranslations("Trending");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ZuvaSunIcon size={36} glow />
          <h1 className="text-3xl md:text-4xl font-bold gold-shimmer">{t("title")}</h1>
        </div>
        <p className="text-zinc-500 text-sm">{t("subtitle")}</p>
      </div>

      <VideoGrid initialSort="most_viewed" />
    </div>
  );
}
