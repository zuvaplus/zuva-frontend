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

export default function FeedPage() {
  const t = useTranslations("Feed");
  const { getToken } = useAuth();
  const [feed,        setFeed]        = useState<FeedItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [offset,      setOffset]      = useState(0);
  const [hasMore,     setHasMore]     = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(
    async (off: number, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const data  = await getFeed(token, PAGE_SIZE, off);
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
    [getToken, t]
  );

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
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ZuvaSunIcon size={36} glow />
          <h1 className="text-3xl md:text-4xl font-bold gold-shimmer">{t("title")}</h1>
        </div>
        <p className="text-zinc-500 text-sm">{t("subtitle")}</p>
      </div>

      {/* Content */}
      {loading ? (
        <FeedSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadFeed(0)} />
      ) : feed.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
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
