"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import type { FeedItem } from "@/lib/types";
import { getFeed } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
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
  country,
}: {
  contentCategory?: string;
  country?: string;
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

  const loadFeed = useCallback(
    async (off: number, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const data = await getFeed(token, { limit: PAGE_SIZE, offset: off, contentCategory, country });
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
    [getToken, t, contentCategory, country]
  );

  // Re-fires whenever contentCategory/country change too, since those
  // flow into loadFeed's own dependency array above.
  useEffect(() => { loadFeed(0, false); }, [loadFeed]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasMore && !loadingMore && !loading) loadFeed(offset, true); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, offset, loadFeed]);

  if (loading) return <FeedSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => loadFeed(0)} />;
  if (feed.length === 0) return <EmptyState />;

  return (
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
