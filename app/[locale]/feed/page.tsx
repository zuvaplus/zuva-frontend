"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { COUNTRIES } from "@/lib/countries";
import VideoGrid from "@/components/VideoGrid";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

// The filtered-results view — reached from the homepage's category/
// country bar (?content_category=documentary or ?country=NG). The
// unfiltered browse experience lives at "/" now; this page exists so
// clicking a category/country has somewhere to land without cluttering
// the homepage itself with in-place filtering.
function FeedContent() {
  const t = useTranslations("Feed");
  const tContentCategories = useTranslations("ContentCategories");
  const searchParams = useSearchParams();
  const contentCategory = searchParams.get("content_category") ?? undefined;
  const countryCode = searchParams.get("country") ?? undefined;
  const countryName = countryCode
    ? COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode
    : undefined;

  const filterLabel = contentCategory
    ? (tContentCategories.has(contentCategory) ? tContentCategories(contentCategory) : contentCategory)
    : countryName;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ZuvaSunIcon size={36} glow />
          <h1 className="text-3xl md:text-4xl font-bold gold-shimmer">
            {filterLabel ?? t("title")}
          </h1>
        </div>
        {filterLabel ? (
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-gold-300 text-sm transition-colors"
          >
            <X size={14} /> {t("clearFilter")}
          </Link>
        ) : (
          <p className="text-zinc-500 text-sm">{t("subtitle")}</p>
        )}
      </div>

      <VideoGrid contentCategory={contentCategory} country={countryCode} />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <FeedContent />
    </Suspense>
  );
}
