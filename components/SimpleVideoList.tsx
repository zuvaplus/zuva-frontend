"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { FeedItem, FeedResponse } from "@/lib/types";
import { getFollowingFeed, getHistoryFeed, getSavedFeed } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
import { FeedSkeleton } from "@/components/LoadingSkeleton";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

type ListKind = "following" | "history" | "saved";

// Named-function dispatch, not a fetcher prop — a fresh closure passed
// as a prop would be a new reference every render, retriggering the
// load effect in a loop. `kind` is a stable string instead.
const FETCHERS: Record<ListKind, (token: string | null) => Promise<FeedResponse>> = {
  following: getFollowingFeed,
  history: getHistoryFeed,
  saved: getSavedFeed,
};

// Shared by /following, /history, /saved — all three are a single,
// unpaginated fetch (same simplicity as GET /api/channel/:username)
// rendered through the same FeedCard grid as everywhere else, just
// with no sort bar (each list's own ordering is already the sensible
// one: newest video from someone you follow, most recently watched,
// most recently saved).
export default function SimpleVideoList({
  kind,
  title,
  subtitle,
  emptyTitle,
  emptyBody,
  loadErrorText,
  tryAgainText,
}: {
  kind: ListKind;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  loadErrorText: string;
  tryAgainText: string;
}) {
  const { getToken } = useAuth();
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      const data = await FETCHERS[kind](token);
      setFeed(data.feed ?? []);
    } catch (err) {
      setFeed(null);
      setError(err instanceof Error ? err.message : loadErrorText);
    }
  }, [getToken, kind, loadErrorText]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ZuvaSunIcon size={36} glow />
          <h1 className="text-3xl md:text-4xl font-bold gold-shimmer">{title}</h1>
        </div>
        <p className="text-zinc-500 text-sm">{subtitle}</p>
      </div>

      {feed === null && !error ? (
        <FeedSkeleton />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 mb-1">{loadErrorText}</p>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <button
            onClick={load}
            className="bg-gold-400/15 hover:bg-gold-400/25 text-gold-300 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            {tryAgainText}
          </button>
        </div>
      ) : feed && feed.length === 0 ? (
        <div className="text-center py-24">
          <ZuvaSunIcon size={52} glow className="mx-auto mb-5" />
          <h2 className="text-white font-semibold text-xl mb-2">{emptyTitle}</h2>
          <p className="text-zinc-600 text-sm">{emptyBody}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {feed!.map((item) => <FeedCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
