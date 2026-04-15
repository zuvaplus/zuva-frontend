"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { FeedItem } from "@/lib/types";
import { getFeed } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
import { FeedSkeleton } from "@/components/LoadingSkeleton";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

type OrientationFilter = "both" | "vertical" | "landscape";

const FILTERS: { value: OrientationFilter; label: string }[] = [
  { value: "both",      label: "For You"  },
  { value: "vertical",  label: "Shorts"   },
  { value: "landscape", label: "Videos"   },
];

export default function FeedPage() {
  const [feed,        setFeed]        = useState<FeedItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [filter,      setFilter]      = useState<OrientationFilter>("both");
  const [offset,      setOffset]      = useState(0);
  const [hasMore,     setHasMore]     = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(
    async (f: OrientationFilter, off: number, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const data  = await getFeed(f, 30, off);
        const items = data.feed ?? [];
        setFeed((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length === 30);
        setOffset(off + items.length);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load feed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => { setOffset(0); loadFeed(filter, 0, false); }, [filter, loadFeed]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasMore && !loadingMore && !loading) loadFeed(filter, offset, true); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, filter, offset, loadFeed]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ZuvaSunIcon size={36} glow />
          <h1 className="text-3xl md:text-4xl font-bold gold-shimmer">Discover Creators</h1>
        </div>
        <p className="text-zinc-500 text-sm">
          Trending &amp; personalised — powered by your interest graph
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-surface-300 p-1 rounded-xl border border-gold-400/10 w-fit mx-auto">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
              ${filter === value
                ? "bg-gold-400 text-black shadow-gold"
                : "text-zinc-500 hover:text-gold-300"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <FeedSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadFeed(filter, 0)} />
      ) : feed.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {filter === "landscape" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feed.map((item) => <FeedCard key={item.id} item={item} />)}
            </div>
          ) : filter === "vertical" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
              {feed.map((item) => <FeedCard key={item.id} item={item} />)}
            </div>
          ) : (
            <MixedFeed items={feed} />
          )}

          <div ref={loaderRef} className="mt-10 flex justify-center">
            {loadingMore && (
              <span className="flex items-center gap-2 text-gold-400 text-sm animate-pulse">
                <ZuvaSunIcon size={16} glow /> Loading more…
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MixedFeed({ items }: { items: FeedItem[] }) {
  const verticals  = items.filter((i) => i.orientation === "vertical");
  const landscapes = items.filter((i) => i.orientation === "landscape");
  return (
    <div className="space-y-10">
      {verticals.length > 0 && (
        <section>
          <SectionDivider label="Shorts" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
            {verticals.map((item) => <FeedCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
      {landscapes.length > 0 && (
        <section>
          <SectionDivider label="Videos" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {landscapes.map((item) => <FeedCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-gold-400 font-bold text-base">{label}</span>
      <div className="flex-1 h-px bg-gold-400/15" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="text-zinc-500 mb-1">Could not load feed</p>
      <p className="text-red-400 text-sm mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="bg-gold-400/15 hover:bg-gold-400/25 text-gold-300 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <ZuvaSunIcon size={52} glow className="mx-auto mb-5" />
      <h2 className="text-white font-semibold text-xl mb-2">No content yet</h2>
      <p className="text-zinc-600 text-sm">Feed will fill up as creators publish content.</p>
    </div>
  );
}
