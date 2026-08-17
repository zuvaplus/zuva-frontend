"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import type { FeedItem, SortOption } from "@/lib/types";
import { getFeed } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
import SortBar from "@/components/SortBar";
import { FeedSkeleton } from "@/components/LoadingSkeleton";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

const PAGE_SIZE = 30;

// Shared grid + fetch/pagination logic behind GET /api/feed — used both
// by the homepage (no filters — signed-in gets computeFeedScore
// ranking, signed-out/no-history gets the shuffled top-ranked fallback,
// entirely a backend decision) and by /feed as the filtered-results view
// (content_category/country from the homepage's category/country bar).
export default function VideoGrid({
  contentCategory,
  category,
  country,
  initialSort,
}: {
  contentCategory?: string;
  /** Older VALID_VIDEO_CATEGORIES taxonomy (Comedy/Drama/Music/...) —
   *  separate from contentCategory above. Backs /category/:name. */
  category?: string;
  country?: string;
  /** Seeds the sort bar's starting selection (e.g. "most_viewed" for
   *  /trending) instead of the personalized-ranking default. Only read
   *  once, at mount — callers pass a constant, never a changing value. */
  initialSort?: SortOption;
}) {
  const t = useTranslations("Feed");
  const { getToken } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // null = no explicit sort yet — the personalized computeFeedScore
  // ranking (or shuffled fallback) stays the default. The bar still
  // shows "Latest" as its active pill for this state (see SortBar
  // value below), but nothing is sent to the backend until a viewer
  // actually clicks an option — at which point it's a real, literal
  // sort that replaces the ranking algorithm's output entirely.
  const [sort, setSort] = useState<SortOption | null>(initialSort ?? null);

  const loadFeed = useCallback(
    async (off: number, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const data = await getFeed(token, { limit: PAGE_SIZE, offset: off, contentCategory, category, country, sort: sort ?? undefined });
        const items = data.feed ?? [];
        setFeed((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length === PAGE_SIZE);
        setOffset(off + items.length);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t("loadError"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [getToken, t, contentCategory, category, country, sort]
  );

  // Re-fires whenever contentCategory/category/country/sort change too,
  // since those flow into loadFeed's own dependency array above — always
  // resetting to offset 0 so a sort change never appends onto a page
  // that was fetched under a different order.
  useEffect(() => { loadFeed(0, false); }, [loadFeed]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasMore && !loadingMore && !loading) loadFeed(offset, true); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, offset, loadFeed]);

  return (
    <>
      <SortBar value={sort ?? "latest"} onChange={setSort} />

      {loading ? (
        <FeedSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadFeed(0)} />
      ) : feed.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {feed.map((item) => <FeedCard key={item.id} item={item} />)}
          </div>

          <div ref={loaderRef} className="mt-10 flex justify-center">
            {loadingMore && (
              <span className="flex items-center gap-2 text-gold-400 text-sm animate-pulse">
                <ZuvaSunIcon size={16} glow /> {t("loadingMore")}
              </span>
            )}
          </div>
        </>
      )}
    </>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations("Feed");
  return (
    <div className="text-center py-16">
      <p className="text-zinc-500 mb-1">{t("loadError")}</p>
      <p className="text-red-400 text-sm mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="bg-gold-400/15 hover:bg-gold-400/25 text-gold-300 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium transition-colors"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("Feed");
  return (
    <div className="text-center py-24">
      <ZuvaSunIcon size={52} glow className="mx-auto mb-5" />
      <h2 className="text-white font-semibold text-xl mb-2">{t("emptyTitle")}</h2>
      <p className="text-zinc-600 text-sm">{t("emptyBody")}</p>
    </div>
  );
}
