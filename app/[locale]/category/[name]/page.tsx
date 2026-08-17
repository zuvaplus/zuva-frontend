"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Film } from "lucide-react";
import VideoGrid from "@/components/VideoGrid";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

// The older VALID_VIDEO_CATEGORIES taxonomy (videos.category —
// Comedy/Drama/Music/... in zuva-backend/zuva-api.js), separate from
// the newer content_category rows on the homepage. Sidebar.tsx's
// Browse > Categories dropdown already links to /category/:name
// (lowercased) for each of these; this page is what makes those links
// real instead of dead. Keyed by the lowercase URL segment.
const CATEGORY_BY_SLUG: Record<string, string> = {
  comedy: "Comedy",
  drama: "Drama",
  music: "Music",
  news: "News",
  sports: "Sports",
  lifestyle: "Lifestyle",
  education: "Education",
  other: "Other",
};

export default function CategoryPage() {
  const t = useTranslations("CategoryPage");
  const tCategories = useTranslations("Categories");
  const { name } = useParams<{ name: string }>();
  const category = CATEGORY_BY_SLUG[name?.toLowerCase() ?? ""];

  if (!category) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Film size={40} className="mx-auto mb-4 text-zinc-700" />
        <h1 className="text-white font-bold text-xl mb-2">{t("notFound")}</h1>
        <Link href="/" className="bg-gold-400/15 text-gold-400 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium">
          {t("backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ZuvaSunIcon size={36} glow />
          <h1 className="text-3xl md:text-4xl font-bold gold-shimmer">
            {tCategories.has(category) ? tCategories(category) : category}
          </h1>
        </div>
      </div>

      <VideoGrid category={category} />
    </div>
  );
}
