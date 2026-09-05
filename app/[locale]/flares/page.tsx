"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { FlareItem, FlareStoryCreator } from "@/lib/types";
import { getFlaresFeed, getFlareStoryRow, getVideoDetail } from "@/lib/api";
import { withSponsoredFlareSlots, isSponsoredFlareSlot } from "@/lib/utils";
import FlareSlide from "@/components/FlareSlide";
import FlareCommentsSheet from "@/components/FlareCommentsSheet";
import FlareStoryBar from "@/components/FlareStoryBar";
import FlareCreateSheet from "@/components/FlareCreateSheet";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import { useUserRole } from "@/components/UserRoleProvider";
import BecomeCreatorModal from "@/components/BecomeCreatorModal";

// How many live-player slides stay mounted around the active one — the
// requested "preload the next 1-2" plus one behind for swipe-back. Every
// OTHER fetched slide still gets a lightweight thumbnail placeholder (see
// SlideFrame below) so scroll-snap positions and IntersectionObserver
// targets stay stable across the whole fetched list — only the *live
// video* is windowed, not the DOM height itself.
const WINDOW_BEFORE = 1;
const WINDOW_AFTER = 2;

const SEEN_STORAGE_KEY = "zuva_flares_seen";
const SEEN_CAP = 200;

function loadSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSeen(ids: string[]) {
  try {
    sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids.slice(-SEEN_CAP)));
  } catch {
    // Storage unavailable (private mode etc.) — seen-tracking is a nice-to-have, not fatal.
  }
}

function SlideFrame({
  index,
  flare,
  isLive,
  isActive,
  muted,
  onToggleMute,
  onOpenComments,
  registerRef,
}: {
  index: number;
  flare: FlareItem;
  isLive: boolean;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onOpenComments: (flareId: string) => void;
  registerRef: (index: number, el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={(el) => registerRef(index, el)}
      data-index={index}
      className="h-full w-full snap-start snap-always shrink-0 flex items-center justify-center bg-black relative"
    >
      {/* Vertical frame, centered and height-locked — on a wide desktop
          viewport this keeps the video at a natural phone-like column
          instead of stretching a 9:16 clip across a 21:9 monitor. Within
          this frame the video is genuinely edge-to-edge (no letterboxing).
          aspect-[9/16] derives width from the slide's own (now dynamic,
          not fixed-dvh) height; max-w-full is the safety net for narrow
          mobile viewports where that derived width would otherwise
          slightly overflow. */}
      <div className="relative h-full max-w-full aspect-[9/16] mx-auto">
        {isLive ? (
          <FlareSlide
            flare={flare}
            isActive={isActive}
            muted={muted}
            onToggleMute={onToggleMute}
            onOpenComments={onOpenComments}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flare.thumbnail_url ?? ""}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  );
}

// Full-screen sponsored Flare ad slide, interleaved into the swipe
// sequence every 5th position (see withSponsoredFlareSlots). Registers
// with the same IntersectionObserver via registerRef as a real slide so
// it expands full-screen and drives activeIndex the same way regular
// Flares do — it just renders no video. This is where the real
// full-screen Flares native ad unit will be served once ad serving is
// wired up.
function SponsoredFlareAdSlide({
  index,
  registerRef,
}: {
  index: number;
  registerRef: (index: number, el: HTMLDivElement | null) => void;
}) {
  const t = useTranslations("Flares");
  return (
    <div
      ref={(el) => registerRef(index, el)}
      data-index={index}
      className="h-full w-full snap-start snap-always shrink-0 flex items-center justify-center bg-black relative"
    >
      <div className="relative h-full max-w-full aspect-[9/16] mx-auto bg-[#111] flex flex-col items-center justify-center gap-2">
        <span className="text-[13px] text-[rgba(255,255,255,0.3)]">{t("ad")}</span>
        <span className="text-[11px] font-semibold" style={{ color: "#f37b0d" }}>
          {t("sponsored")}
        </span>
      </div>
    </div>
  );
}

export default function FlaresPage() {
  const t = useTranslations("Flares");
  const { getToken, isSignedIn } = useAuth();
  const { role, userId } = useUserRole();
  const router = useRouter();

  const [flares, setFlares] = useState<FlareItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsFlareId, setCommentsFlareId] = useState<string | null>(null);

  // Stories row — followed creators who've posted a Flare in the last 7
  // days (see GET /api/flares/story-row). Empty for signed-out visitors,
  // who still get the swipe feed below.
  const [storyCreators, setStoryCreators] = useState<FlareStoryCreator[]>([]);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  const seenRef = useRef<string[]>(loadSeen());
  // Bumped whenever seenRef changes, so FlareStoryBar's "unseen" ring
  // re-renders immediately after watching a creator's Flare rather than
  // only on next visit (seenRef itself is a plain ref, not state).
  const [seenVersion, setSeenVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (cursorParam: string | null) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      cursorParam ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const token = await getToken().catch(() => null);
        const data = await getFlaresFeed(token, { cursor: cursorParam, exclude: seenRef.current, limit: 10 });
        setFlares((prev) => (cursorParam ? [...prev, ...data.flares] : data.flares));
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("loadError"));
        // Stop the auto-pagination effect below from immediately retrying
        // the same failed cursor in a tight loop — the "Try Again" button
        // (which calls loadPage directly) is the intended retry path.
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [getToken, t]
  );

  useEffect(() => {
    loadPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signed-out visitors still get the swipe feed above — the story row
  // just requires a real viewer to have follows, so it's skipped entirely
  // rather than hitting an endpoint that would 401.
  useEffect(() => {
    if (!isSignedIn) {
      setStoryCreators([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken().catch(() => null);
        const data = await getFlareStoryRow(token);
        if (!cancelled) setStoryCreators(data.creators);
      } catch {
        // Non-fatal — the row just stays empty (own entry still shows).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  // Ad slides interleaved every 5th position — the rendered swipe
  // sequence (and therefore activeIndex/IntersectionObserver indices)
  // operates on this list, not the raw fetched `flares`, since ad slides
  // take real vertical space in the snap-scroll container too.
  const displayItems = useMemo(() => withSponsoredFlareSlots(flares, 5), [flares]);
  const activeItem = displayItems[activeIndex];

  // Mark the active slide seen + persist for next session (or a refresh
  // within this one) — server-side exclusion via the `exclude` param.
  // Ad slides are never "seen" (they're not real content to exclude).
  useEffect(() => {
    if (!activeItem || isSponsoredFlareSlot(activeItem)) return;
    if (!seenRef.current.includes(activeItem.id)) {
      seenRef.current = [...seenRef.current, activeItem.id];
      saveSeen(seenRef.current);
      setSeenVersion((v) => v + 1);
    }
  }, [activeItem]);

  const seenFlareIds = useMemo(() => new Set(seenRef.current), [seenVersion]);

  // Paginate a few slides before the viewer actually runs out — measured
  // against the rendered list (ads included) so ad slides near the end
  // don't delay the fetch.
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    if (activeIndex >= displayItems.length - 3) {
      loadPage(cursor);
    }
  }, [activeIndex, displayItems.length, hasMore, loadingMore, loading, cursor, loadPage]);

  // Drives activeIndex from real scroll position — scroll-snap (not a
  // custom touch-gesture library) handles the actual swipe physics
  // natively for touch, wheel, and keyboard alike; this just observes
  // which snapped slide is dominant.
  useEffect(() => {
    if (!containerRef.current || displayItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: containerRef.current, threshold: [0.6] }
    );
    slideRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [displayItems.length]);

  function registerSlideRef(index: number, el: HTMLDivElement | null) {
    if (el) slideRefs.current.set(index, el);
    else slideRefs.current.delete(index);
  }

  // "Your Flare" tap — signed out goes to sign-in, signed in but not yet
  // a creator gets the same BecomeCreatorModal prompt used elsewhere
  // (BottomNav's Upload entry), otherwise opens the creation sheet. Never
  // navigates away from /flares in any case.
  function handleCreateFlareTap() {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (role !== "creator") {
      setShowCreatorModal(true);
      return;
    }
    setShowCreateSheet(true);
  }

  // Tapping a followed creator's story avatar — fetches their most recent
  // Flare's full detail (same GET /api/video/:id the feed's own slides
  // use) and jumps the feed straight to it, without leaving /flares.
  async function handleOpenCreatorFlare(flareId: string) {
    try {
      const token = await getToken().catch(() => null);
      const data = await getVideoDetail(token, flareId);
      const item: FlareItem = {
        id: data.video.id,
        title: data.video.title,
        description: data.video.description,
        cloudflare_video_id: data.video.cloudflare_video_id,
        thumbnail_url: data.video.thumbnail_url,
        duration_seconds: data.video.duration_seconds,
        view_count: data.video.view_count,
        like_count: data.video.like_count,
        comment_count: data.video.comment_count,
        category: data.video.category,
        tags: data.video.tags,
        created_at: data.video.created_at,
        creator: data.creator,
      };
      setFlares((prev) => [item, ...prev.filter((f) => f.id !== item.id)]);
      setActiveIndex(0);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Best-effort — a failed jump just means nothing happens; the feed
      // below is unaffected.
    }
  }

  const activeCommentsFlare = flares.find((f) => f.id === commentsFlareId) ?? null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Minimal chrome — back arrow + small Zuva mark, per spec */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
        <button
          onClick={() => router.push("/feed")}
          aria-label={t("back")}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <ZuvaSunIcon size={22} glow />
        <span className="w-9" aria-hidden />
      </div>

      {/* Instagram-Stories-style row: own "Your Flare" entry + followed
          creators with a Flare posted in the last 7 days. */}
      <div className="shrink-0 border-b border-white/5">
        <FlareStoryBar
          creators={storyCreators}
          seenFlareIds={seenFlareIds}
          onCreateFlare={handleCreateFlareTap}
          onOpenCreatorFlare={handleOpenCreatorFlare}
        />
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <ZuvaSunIcon size={40} glow className="animate-spin-slow" />
          </div>
        ) : error && flares.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-zinc-400 text-sm">{error}</p>
            <button
              onClick={() => loadPage(null)}
              className="bg-gold-400 text-black font-semibold px-6 py-2.5 rounded-xl"
            >
              {t("tryAgain")}
            </button>
          </div>
        ) : flares.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 px-6 text-center">
            <ZuvaSunIcon size={40} className="opacity-40" />
            <p className="text-zinc-400 text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          >
            {displayItems.map((item, index) =>
              isSponsoredFlareSlot(item) ? (
                <SponsoredFlareAdSlide key={item.id} index={index} registerRef={registerSlideRef} />
              ) : (
                <SlideFrame
                  key={item.id}
                  index={index}
                  flare={item}
                  isLive={index >= activeIndex - WINDOW_BEFORE && index <= activeIndex + WINDOW_AFTER}
                  isActive={index === activeIndex}
                  muted={muted}
                  onToggleMute={() => setMuted((m) => !m)}
                  onOpenComments={setCommentsFlareId}
                  registerRef={registerSlideRef}
                />
              )
            )}
          </div>
        )}
      </div>

      {activeCommentsFlare && (
        <FlareCommentsSheet
          flareId={activeCommentsFlare.id}
          initialCount={activeCommentsFlare.comment_count}
          onClose={() => setCommentsFlareId(null)}
        />
      )}

      {showCreateSheet && (
        <FlareCreateSheet userId={userId} onClose={() => setShowCreateSheet(false)} />
      )}

      {showCreatorModal && <BecomeCreatorModal onClose={() => setShowCreatorModal(false)} />}
    </div>
  );
}
