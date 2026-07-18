"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Hash } from "lucide-react";
import type { SearchResponse } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

function SearchSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="skeleton h-5 w-32" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: SearchResponse) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load search results");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q]);

  const hasResults = Boolean(
    results && (results.creators.length || results.videos.length || results.tags.length)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-white font-bold text-xl mb-6">
        {q ? `Results for "${q}"` : "Search"}
      </h1>

      {!q && <p className="text-zinc-500 text-sm">Type something in the search bar to get started.</p>}

      {q && loading && <SearchSkeleton />}

      {q && !loading && error && <p className="text-red-400 text-sm">{error}</p>}

      {q && !loading && !error && !hasResults && (
        <p className="text-zinc-500 text-sm">No results found.</p>
      )}

      {q && !loading && !error && results && hasResults && (
        <div className="space-y-10">
          {results.creators.length > 0 && (
            <section>
              <h2 className="text-zinc-400 text-sm font-semibold uppercase tracking-wide mb-3">Creators</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.creators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.id}`}
                    className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-surface-200 border border-gold-400/10 hover:border-gold-400/30 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-300 border border-gold-400/20 flex items-center justify-center">
                      {creator.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gold-400 font-bold text-lg">
                          {(creator.display_name || creator.username || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm font-medium truncate w-full">
                      {creator.display_name || creator.username}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      {creator.follower_count.toLocaleString()} followers
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.videos.length > 0 && (
            <section>
              <h2 className="text-zinc-400 text-sm font-semibold uppercase tracking-wide mb-3">Videos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="rounded-xl overflow-hidden bg-surface-200 border border-gold-400/10 hover:border-gold-400/30 transition-colors"
                  >
                    <div
                      className={`bg-surface-300 ${video.orientation === "vertical" ? "aspect-portrait" : "aspect-landscape"}`}
                    >
                      {video.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-white text-sm font-medium truncate">{video.title}</p>
                      <p className="text-zinc-500 text-xs truncate">{video.creator_name}</p>
                      <p className="text-zinc-600 text-[11px]">{video.view_count.toLocaleString()} views</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.tags.length > 0 && (
            <section>
              <h2 className="text-zinc-400 text-sm font-semibold uppercase tracking-wide mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {results.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/25 text-sm hover:bg-gold-400/20 transition-colors"
                  >
                    <Hash size={14} />
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-6"><SearchSkeleton /></div>}>
      <SearchResults />
    </Suspense>
  );
}
