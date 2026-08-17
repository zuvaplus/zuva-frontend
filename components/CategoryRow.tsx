"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import type { ContentCategory, FeedItem } from "@/lib/types";
import { getFeed } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
import HomeSectionHeader from "@/components/HomeSectionHeader";

// One self-contained, self-fetching homepage row per content_category —
// 3 videos under the personalized ranking (same default as everywhere
// else on this page, just scoped to one category), hidden entirely
// (renders null) once loaded if that category has no videos yet.
export default function CategoryRow({ category }: { category: ContentCategory }) {
  const t = useTranslations("ContentCategories");
  const tHome = useTranslations("Homepage");
  const { getToken } = useAuth();
  const [items, setItems] = useState<FeedItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const data = await getFeed(token, { limit: 3, contentCategory: category });
        if (!cancelled) setItems(data.feed ?? []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, getToken]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title={t(category)}
        seeMoreHref={`/feed?content_category=${category}`}
        seeMoreLabel={tHome("seeMore")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => <FeedCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
