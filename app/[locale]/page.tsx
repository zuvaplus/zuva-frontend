"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COUNTRIES } from "@/lib/countries";
import VideoGrid from "@/components/VideoGrid";

// Matches CONTENT_CATEGORIES in zuva-backend/zuva-api.js — kept as an
// explicit ordered list (rather than deriving from the ContentCategory
// union type) so the bar's order is deliberate, not whatever order the
// type happens to declare its members in.
const CONTENT_CATEGORY_ORDER = [
  "entertainment", "music", "comedy", "drama_series", "documentary",
  "discussion_debate", "interview", "lifestyle_culture", "news", "nature",
  "sports", "tech_innovation", "science_education", "health_wellness", "other",
];

// The universal "/" experience — same page for signed-in and signed-out
// visitors alike (see HomePage.md notes / CLAUDE.md). The grid itself
// (VideoGrid, no filters) is where the personalization actually
// happens: GET /api/feed decides server-side between the personalized
// computeFeedScore ranking (signed in with watch history) and the
// shuffled top-ranked fallback (signed out, or signed in with none) —
// this page doesn't need to know which one it's getting.
export default function HomePage() {
  const t = useTranslations("Homepage");
  const tContentCategories = useTranslations("ContentCategories");

  return (
    <div>
      {/* Tagline — the nav bar above already carries the Zuva logo and
          its own search, so this is just the slogan, centered, with no
          redundant logo/search of its own. Deliberately compact so at
          least 1.5 rows of the grid below stay above the fold on a
          standard desktop viewport. */}
      <div className="border-b border-gold-400/10">
        <div className="px-4 sm:px-6 py-4 text-center">
          <p className="text-zinc-500 text-sm font-medium">{t("slogan")}</p>
        </div>
      </div>

      {/* Category / country bar — clicking either navigates to the
          filtered /feed view (?content_category= or ?country=) rather
          than filtering this grid in place. */}
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {CONTENT_CATEGORY_ORDER.map((c) => (
            <Link
              key={c}
              href={`/feed?content_category=${c}`}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gold-400/10 text-gold-400 border border-gold-400/25 hover:bg-gold-400/20 transition-colors whitespace-nowrap"
            >
              {tContentCategories(c)}
            </Link>
          ))}
          <span className="shrink-0 w-px h-5 bg-gold-400/15 mx-1" aria-hidden />
          {COUNTRIES.map((country) => (
            <Link
              key={country.code}
              href={`/feed?country=${country.code}`}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium bg-surface-200 text-zinc-400 border border-white/10 hover:text-gold-300 hover:border-gold-400/25 transition-colors whitespace-nowrap"
            >
              {country.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 sm:px-6 pb-10">
        <VideoGrid />
      </div>
    </div>
  );
}
