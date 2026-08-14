"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
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
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div>
      {/* Thin banner — deliberately compact (logo + one-line slogan,
          not a full hero) so at least 1.5 rows of the grid below stay
          above the fold on a standard desktop viewport. */}
      <div className="border-b border-gold-400/10">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zuva-logo.svg" alt="Zuva" className="h-7 w-auto shrink-0" />
          <span className="text-zinc-500 text-sm font-medium truncate">{t("slogan")}</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-5xl mx-auto px-4 pt-3">
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full bg-surface-200 border border-gold-400/15 focus:border-gold-400/40 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
            />
          </div>
        </form>
      </div>

      {/* Category / country bar — clicking either navigates to the
          filtered /feed view (?content_category= or ?country=) rather
          than filtering this grid in place. */}
      <div className="max-w-5xl mx-auto px-4 py-3">
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
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <VideoGrid />
      </div>
    </div>
  );
}
