"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { FlareItem } from "@/lib/types";
import { getFlaresFeed } from "@/lib/api";
import FlareSlide from "@/components/FlareSlide";
import FlareCommentsSheet from "@/components/FlareCommentsSheet";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

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
      className="h-dvh w-full snap-start snap-always shrink-0 flex items-center justify-center bg-black relative"
    >
      {/* Vertical frame, centered and height-locked — on a wide desktop
          viewport this keeps the video at a natural phone-like column
          instead of stretching a 9:16 clip across a 21:9 monitor. Within
          this frame the video is genuinely edge-to-edge (no letterboxing). */}
      <div className="relative h-full w-full max-w-[calc(100dvh*9/16)] mx-auto">
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

export default function FlaresPage() {
  const t = useTranslations("Flares");
  const { getToken } = useAuth();
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

  const seenRef = useRef<string[]>(loadSeen());
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

  // Mark the active slide seen + persist for next session (or a refresh
  // within this one) — server-side exclusion via the `exclude` param.
  useEffect(() => {
    const flare = flares[activeIndex];
    if (!flare) return;
    if (!seenRef.current.includes(flare.id)) {
      seenRef.current = [...seenRef.current, flare.id];
      saveSeen(seenRef.current);
    }
  }, [activeIndex, flares]);

  // Paginate a few slides before the viewer actually runs out.
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    if (activeIndex >= flares.length - 3) {
      loadPage(cursor);
    }
  }, [activeIndex, flares.length, hasMore, loadingMore, loading, cursor, loadPage]);

  // Drives activeIndex from real scroll position — scroll-snap (not a
  // custom touch-gesture library) handles the actual swipe physics
  // natively for touch, wheel, and keyboard alike; this just observes
  // which snapped slide is dominant.
  useEffect(() => {
    if (!containerRef.current || flares.length === 0) return;
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
  }, [flares.length]);

  function registerSlideRef(index: number, el: HTMLDivElement | null) {
    if (el) slideRefs.current.set(index, el);
    else slideRefs.current.delete(index);
  }

  const activeCommentsFlare = flares.find((f) => f.id === commentsFlareId) ?? null;

  return (
    <div className="fixed inset-0 bg-black">
      {/* Minimal chrome — back arrow + small Zuva mark, per spec */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          onClick={() => router.push("/feed")}
          aria-label={t("back")}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <ZuvaSunIcon size={22} glow />
        <span className="w-9" aria-hidden />
      </div>

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
          {flares.map((flare, index) => (
            <SlideFrame
              key={flare.id}
              index={index}
              flare={flare}
              isLive={index >= activeIndex - WINDOW_BEFORE && index <= activeIndex + WINDOW_AFTER}
              isActive={index === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onOpenComments={setCommentsFlareId}
              registerRef={registerSlideRef}
            />
          ))}
        </div>
      )}

      {activeCommentsFlare && (
        <FlareCommentsSheet
          flareId={activeCommentsFlare.id}
          initialCount={activeCommentsFlare.comment_count}
          onClose={() => setCommentsFlareId(null)}
        />
      )}
    </div>
  );
}
