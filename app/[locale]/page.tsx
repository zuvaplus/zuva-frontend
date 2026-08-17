"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import type { ContentCategory, FeedItem, FlareItem, FollowedCreator } from "@/lib/types";
import { getFeed, getFlaresFeed, getFollowedCreators } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
import HomeSectionHeader from "@/components/HomeSectionHeader";
import FlareThumbRow from "@/components/FlareThumbRow";
import CreatorStoryRow from "@/components/CreatorStoryRow";
import CategoryRow from "@/components/CategoryRow";
import VideoGrid from "@/components/VideoGrid";
import { FeedSkeleton } from "@/components/LoadingSkeleton";
import HomepageMastheadAd from "@/components/HomepageMastheadAd";

// Matches CONTENT_CATEGORIES in zuva-backend/zuva-api.js, minus
// "nature" and "other" — the 13 categories that get their own homepage
// row (only rendered if that category actually has videos — see
// CategoryRow), in the exact order requested.
const CATEGORY_ROWS: ContentCategory[] = [
  "documentary", "music", "entertainment", "comedy", "drama_series",
  "discussion_debate", "interview", "lifestyle_culture", "news",
  "health_wellness", "science_education", "tech_innovation", "sports",
];

const ROW_GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";

// Row-based homepage, two experiences sharing one component:
//  - signed out: Trending -> Flares -> 13 category rows -> Browse Everything
//  - signed in:  followed-creator story row -> Recommended for You ->
//                Trending -> Flares (followed creators first) ->
//                13 category rows -> Browse Everything
// "Browse Everything" is the old universal VideoGrid+SortBar experience,
// kept as a catch-all beneath the new curated rows rather than dropped.
export default function HomePage() {
  const t = useTranslations("Homepage");
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const signedIn = isLoaded && Boolean(isSignedIn);

  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([]);
  const [recommended, setRecommended] = useState<FeedItem[] | null>(null);
  const [trending, setTrending] = useState<FeedItem[] | null>(null);
  const [flares, setFlares] = useState<FlareItem[] | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    (async () => {
      const token = await getToken().catch(() => null);

      const [trendingRes, flaresRes] = await Promise.all([
        getFeed(token, { limit: 6, sort: "most_viewed" }).catch(() => ({ success: true as const, feed: [] })),
        getFlaresFeed(token, { limit: 12 }).catch(() => ({ success: true as const, flares: [], nextCursor: null })),
      ]);
      if (cancelled) return;
      setTrending(trendingRes.feed);

      if (!signedIn) {
        setFlares(flaresRes.flares);
        return;
      }

      const [recommendedRes, followedRes] = await Promise.all([
        getFeed(token, { limit: 6 }).catch(() => ({ success: true as const, feed: [] })),
        getFollowedCreators(token).catch(() => ({ success: true as const, creators: [] })),
      ]);
      if (cancelled) return;
      setRecommended(recommendedRes.feed);
      setFollowedCreators(followedRes.creators);

      // Followed-creator Flares first, stable order otherwise.
      const followedIds = new Set(followedRes.creators.map((c) => c.id));
      const reordered = [...flaresRes.flares].sort((a, b) => {
        const aFirst = followedIds.has(a.creator.id) ? 0 : 1;
        const bFirst = followedIds.has(b.creator.id) ? 0 : 1;
        return aFirst - bFirst;
      });
      setFlares(reordered);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, signedIn, getToken]);

  return (
    <div>
      {/* Tagline — the nav bar above already carries the Zuva logo and
          its own search, so this is just the slogan, centered, with no
          redundant logo/search of its own. */}
      <div className="border-b border-gold-400/10">
        <div className="px-4 sm:px-6 py-4 text-center">
          <p className="text-zinc-500 text-sm font-medium">{t("slogan")}</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6">
        {/* Premium masthead takeover — above Trending, shown on both
            signed-in and signed-out homepage. */}
        <HomepageMastheadAd />

        {signedIn && <CreatorStoryRow creators={followedCreators} />}

        {signedIn && (
          <section className="mb-10">
            <HomeSectionHeader title={t("recommendedForYou")} />
            {recommended === null ? (
              <FeedSkeleton />
            ) : (
              <div className={ROW_GRID}>
                {recommended.slice(0, 6).map((item) => <FeedCard key={item.id} item={item} />)}
              </div>
            )}
          </section>
        )}

        <section className="mb-10">
          <HomeSectionHeader title={t("trending")} seeMoreHref="/trending" seeMoreLabel={t("seeMore")} />
          {trending === null ? (
            <FeedSkeleton />
          ) : (
            <div className={ROW_GRID}>
              {trending.slice(0, 6).map((item) => <FeedCard key={item.id} item={item} />)}
            </div>
          )}
        </section>

        <section className="mb-10">
          <HomeSectionHeader title={t("flares")} seeMoreHref="/flares" seeMoreLabel={t("seeMore")} />
          {flares !== null && <FlareThumbRow flares={flares} />}
        </section>

        {CATEGORY_ROWS.map((category) => (
          <CategoryRow key={category} category={category} />
        ))}

        <section>
          <HomeSectionHeader title={t("browseEverything")} />
          <VideoGrid />
        </section>
      </div>
    </div>
  );
}
