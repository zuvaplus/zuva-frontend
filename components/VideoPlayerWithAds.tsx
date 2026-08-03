"use client";

/**
 * Zuva Ads pre-roll wrapper around the Cloudflare Stream player.
 *
 * AUDIT NOTES (Part 1 of the task this file was built from):
 *  - There is no src/app/[locale]/watch/ route and no existing
 *    src/components/*Player* component — the video watch page is
 *    app/[locale]/video/[id]/page.tsx, and it renders
 *    @cloudflare/stream-react's <Stream> directly inline (streamRef,
 *    src=video.cloudflare_video_id, controls, responsive={false},
 *    preload="metadata", className, onPause/onEnded wired to that
 *    page's own watch-progress polling). This file wraps that same
 *    <Stream> usage rather than replacing it with something new.
 *  - content_category: UploadedVideo.content_category (lib/types.ts)
 *    already exists and is typed as the exact 11-value ContentCategory
 *    union this task asked about — see the summary below.
 *  - "Is the viewer the creator": Clerk's useUser().id is the Clerk
 *    identity (e.g. user_2xxx), not the DB users.id the video's
 *    creator_id is stored as — those are different id spaces. The
 *    existing UserRoleProvider (components/UserRoleProvider.tsx,
 *    mounted at the AppShell root) already resolves and exposes the
 *    signed-in viewer's DB users.id via useUserRole().userId, which is
 *    what the watch page now compares against video.creator_id.
 *  - Geo data: grepped for navigator.geolocation / ipapi / cf-ipcountry
 *    / x-vercel-ip-country and any existing city/country detection —
 *    none exists anywhere in this frontend. city/country are wired
 *    through as optional props exactly as instructed, but nothing
 *    supplies them yet from the watch page (see Part 3 integration) —
 *    the backend serves country-agnostic ads until that's built.
 *
 * NEXT_PUBLIC_BACKEND_URL is the env var used for the GET /api/ads/serve
 * and POST /api/ads/impression calls below (same var every other
 * component in this repo uses for backend calls — see lib/api.ts).
 */

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { Stream } from "@cloudflare/stream-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

// A skip below this many seconds doesn't count as an impression — see
// handleSkip below. A completed view always counts regardless of length.
const MIN_VIEW_SECONDS_FOR_IMPRESSION = 5;

interface AdServeResponse {
  campaign_id: string;
  creative_id: string;
  advertiser_id: string;
  type: "video" | "image";
  file_url: string;
  duration_seconds: number | null;
  click_through_url: string | null;
  skip_after_seconds: number;
}

type StreamProps = ComponentProps<typeof Stream>;

interface VideoPlayerWithAdsProps extends Omit<StreamProps, "src"> {
  /** Cloudflare Stream video ID for the main content. */
  videoId: string;
  /** Our DB videos.id (UUID) — used for impression tracking's content_id. */
  contentId: string;
  contentCategory: string;
  /** True when the signed-in viewer is this video's own creator — skips ad logic entirely. */
  skipAds: boolean;
  city?: string;
  country?: string;
}

type PlayerState = "checking" | "preroll" | "main";

interface ImpressionOutcome {
  wasSkipped: boolean;
  skipTimeSeconds: number | null;
  completed: boolean;
  clicked: boolean;
  // Whether this outcome clears MIN_VIEW_SECONDS_FOR_IMPRESSION — false
  // only reaches here via a skip below the threshold (shouldn't normally
  // happen, since the skip button doesn't render before skip_after_seconds,
  // but a timing edge case could still let a click through just under it).
  // A completed view is always true, regardless of length.
  meetsMinimumView: boolean;
}

// ============================================================
//  Pre-roll ad player — raw <video>, not Cloudflare Stream (the
//  creative's file_url is already a direct playable URL). No
//  controls, no seeking, no pause — standard pre-roll behavior.
// ============================================================
function PrerollPlayer({
  ad,
  onComplete,
  onError,
}: {
  ad: AdServeResponse;
  onComplete: (outcome: ImpressionOutcome) => void;
  onError: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const clickedRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);

  const durationSeconds = ad.duration_seconds; // nullable — see render below
  const skipAfter = ad.skip_after_seconds;
  const canSkip = currentTime >= skipAfter;
  const remaining = durationSeconds !== null ? Math.max(0, Math.ceil(durationSeconds - currentTime)) : null;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Mobile browsers require a muted video to autoplay at all; desktop
    // plays with sound per spec. 768px matches this codebase's existing
    // md: Tailwind breakpoint convention for the mobile/desktop split.
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    el.muted = isMobile;

    el.play().catch(() => {
      // Autoplay was blocked even in the intended muted/unmuted state
      // (e.g. desktop autoplay-with-sound policies vary by browser) —
      // fall back to muted and retry once rather than leaving the ad
      // frozen on its first frame.
      el.muted = true;
      el.play().catch(() => {
        // Still blocked — nothing more to try. The video sits on its
        // poster frame; the countdown/skip UI still works off timeupdate
        // events once/if playback does start, and skip remains available.
      });
    });
  }, []);

  function handleSkip() {
    // Threshold check uses the raw (unrounded) currentTime, matching
    // "currentTime >= 5 at the moment of the click" exactly — rounding
    // first (e.g. 4.6 -> 5) could let a sub-threshold skip pass.
    onComplete({
      wasSkipped: true,
      skipTimeSeconds: Math.round(currentTime),
      completed: false,
      clicked: clickedRef.current,
      meetsMinimumView: currentTime >= MIN_VIEW_SECONDS_FOR_IMPRESSION,
    });
  }

  function handleEnded() {
    onComplete({
      wasSkipped: false,
      skipTimeSeconds: null,
      completed: true,
      clicked: clickedRef.current,
      meetsMinimumView: true, // a completion is always a valid view
    });
  }

  function handleLearnMore() {
    clickedRef.current = true;
    if (ad.click_through_url) {
      window.open(ad.click_through_url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={ad.file_url}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        controls={false}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={handleEnded}
        onError={onError}
        // No seeking: this is the only interaction surface on the
        // element itself, and it has no controls to seek from — the
        // custom overlay below is the entire UI.
      />

      {/* Top right — "Ad" pill */}
      <div className="absolute top-3 right-3 bg-gold-400 text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
        Ad
      </div>

      {/* Bottom left — countdown / skip */}
      <div className="absolute bottom-3 left-3">
        {canSkip ? (
          <button
            onClick={handleSkip}
            className="bg-black/70 hover:bg-black/85 text-white text-xs sm:text-sm font-semibold px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-white/20 transition-colors"
          >
            Skip Ad →
          </button>
        ) : (
          <div className="bg-black/70 text-white text-xs sm:text-sm font-medium px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg">
            Ad{remaining !== null ? ` • ${remaining}s` : ""}
          </div>
        )}
      </div>

      {/* Bottom right — Learn More */}
      {ad.click_through_url && (
        <button
          onClick={handleLearnMore}
          className="absolute bottom-3 right-3 bg-gold-400 hover:bg-gold-300 text-black text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-colors"
        >
          Learn More
        </button>
      )}
    </div>
  );
}

// ============================================================
//  Main export
// ============================================================
export default function VideoPlayerWithAds({
  videoId,
  contentId,
  contentCategory,
  skipAds,
  city,
  country,
  ...streamProps
}: VideoPlayerWithAdsProps) {
  const [playerState, setPlayerState] = useState<PlayerState>(skipAds ? "main" : "checking");
  const [ad, setAd] = useState<AdServeResponse | null>(null);

  const sessionIdRef = useRef<string>("");
  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    if (skipAds) {
      setPlayerState("main");
      setAd(null);
      return;
    }

    let cancelled = false;
    setPlayerState("checking");
    setAd(null);

    const controller = new AbortController();
    // Ads must never block content — a 3s ceiling on the ad-serve
    // check, after which the main video plays with no ad regardless
    // of whether the backend eventually would have responded.
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    (async () => {
      try {
        const params = new URLSearchParams({ content_category: contentCategory });
        if (city) params.set("city", city);
        if (country) params.set("country", country);

        const res = await fetch(`${BACKEND_URL}/api/ads/serve?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`ad serve failed (${res.status})`);

        const data: { ad: AdServeResponse | null } = await res.json();
        if (cancelled) return;

        // Only "video" creatives have a defined pre-roll UI in this
        // task's spec — an "image" creative has nowhere to render in a
        // video pre-roll slot, so it's treated the same as no ad at all
        // (main video plays, no impression fired, since nothing was shown).
        if (data.ad && data.ad.type === "video") {
          setAd(data.ad);
          setPlayerState("preroll");
        } else {
          setPlayerState("main");
        }
      } catch {
        // Timeout, network failure, non-2xx, malformed JSON — every
        // failure path lands here and just plays the main video.
        if (!cancelled) setPlayerState("main");
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
    // Re-runs if the viewer navigates client-side to a different video
    // on this same page (e.g. clicking a related video) without a full
    // reload — videoId in the deps list catches that; content_category/
    // skipAds/city/country changing for the same video is also handled
    // correctly by re-running, though in practice only videoId or
    // skipAds actually change together.
  }, [skipAds, contentCategory, city, country, videoId]);

  const fireImpression = useCallback((outcome: ImpressionOutcome, firedAd: AdServeResponse) => {
    // Fire-and-forget — never awaited, never blocks the transition to
    // the main video. Errors are swallowed; a missed impression ping
    // is not something to surface to the viewer.
    fetch(`${BACKEND_URL}/api/ads/impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: firedAd.campaign_id,
        creative_id: firedAd.creative_id,
        advertiser_id: firedAd.advertiser_id,
        content_id: contentId,
        city: city ?? null,
        country: country ?? null,
        ad_unit: "preroll_main",
        was_skipped: outcome.wasSkipped,
        skip_time_seconds: outcome.skipTimeSeconds,
        completed: outcome.completed,
        clicked: outcome.clicked,
        viewer_session_id: sessionIdRef.current,
      }),
    }).catch(() => {});
  }, [contentId, city, country]);

  function handlePrerollComplete(outcome: ImpressionOutcome) {
    // Below MIN_VIEW_SECONDS_FOR_IMPRESSION, show the main video with
    // no impression fired — silently, no error state.
    if (ad && outcome.meetsMinimumView) fireImpression(outcome, ad);
    setPlayerState("main");
  }

  function handlePrerollError() {
    // Creative failed to load/play — show the main video immediately.
    // Never fires an impression: fireImpression is only ever called
    // from handlePrerollComplete above, which this path doesn't go
    // through, so nothing was actually delivered to the viewer.
    setPlayerState("main");
  }

  if (playerState === "preroll" && ad) {
    return (
      <PrerollPlayer
        key={ad.creative_id}
        ad={ad}
        onComplete={handlePrerollComplete}
        onError={handlePrerollError}
      />
    );
  }

  // "checking" and "main" both render the real player underneath —
  // "checking" only ever lasts up to 3s and showing the main player's
  // poster/frame during that window reads better than a blank/loading
  // state, and it costs nothing since Stream doesn't autoplay here.
  return <Stream src={videoId} {...streamProps} />;
}
