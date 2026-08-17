"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Stream, StreamPlayerApi } from "@cloudflare/stream-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import type { FlareItem } from "@/lib/types";
import {
  getVideoDetail,
  likeVideo,
  unlikeVideo,
  subscribeCreator,
  unsubscribeCreator,
  recordFlareSwipeEvent,
} from "@/lib/api";
import { formatCount } from "@/lib/utils";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import TipModal from "@/components/TipModal";

export default function FlareSlide({
  flare,
  isActive,
  muted,
  onToggleMute,
  onOpenComments,
}: {
  flare: FlareItem;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onOpenComments: (flareId: string) => void;
}) {
  const t = useTranslations("Flares");
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const streamRef = useRef<StreamPlayerApi | undefined>(undefined);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(flare.like_count);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false); // brief scale-up animation on like
  const [subscribed, setSubscribed] = useState(false);
  const [followerCount, setFollowerCount] = useState(flare.creator.follower_count);
  const [subBusy, setSubBusy] = useState(false);
  const [commentCount, setCommentCount] = useState(flare.comment_count);
  const [showTip, setShowTip] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const detailFetchedRef = useRef(false);

  // Loop detection state — the Stream player's native `loop` attribute
  // seeks back to 0 internally without firing 'ended' (same as a looping
  // HTML5 <video>), so a loop is inferred from the currentTime series
  // instead: a big backward jump from near-the-end to near-the-start
  // while still active means it looped.
  const hasLoopedRef = useRef(false);
  const prevTimeRef = useRef(0);

  // Best-effort, fire-and-forget — feeds computeFlareScore
  // (completion/loop/swipe-away), deliberately independent from the main
  // feed's watch-progress endpoint.
  async function reportSwipeEvent(payload: {
    watchedSeconds: number;
    videoDurationSeconds: number;
    swipedAway: boolean;
    looped: boolean;
  }) {
    try {
      const token = await getToken().catch(() => null);
      await recordFlareSwipeEvent(token, { videoId: flare.id, ...payload });
    } catch {
      // best-effort — a missed event just means slightly sparser signal
    }
  }

  const creatorName = flare.creator.display_name || flare.creator.username;

  // Fires once per slide the first time it becomes active — registers the
  // view (GET /api/video/:id increments view_count server-side) and syncs
  // authoritative like_count/viewer state, same endpoint the long-form
  // watch page uses.
  useEffect(() => {
    if (!isActive || detailFetchedRef.current) return;
    detailFetchedRef.current = true;
    (async () => {
      try {
        const token = await getToken().catch(() => null);
        const data = await getVideoDetail(token, flare.id);
        setLiked(data.viewer?.has_liked ?? false);
        setLikeCount(data.video.like_count ?? flare.like_count);
        setCommentCount(data.video.comment_count ?? flare.comment_count);
        setSubscribed(data.viewer?.is_subscribed ?? false);
        setFollowerCount(data.creator.follower_count ?? flare.creator.follower_count);
      } catch {
        // Non-fatal — the slide already has reasonable data from the feed list.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Imperative play/pause — never rely on the Stream `autoplay` prop after
  // mount (it's a one-time iframe-src parameter, not a live control), so
  // every slide mounts with autoplay=false and this effect drives playback
  // based on which slide the IntersectionObserver says is active.
  //
  // The cleanup (fires when isActive flips to false, or on unmount —
  // covering both "swiped to the next slide" and "left the Flares page
  // entirely") is also where the swipe/loop event is reported: it's the
  // natural moment we know how far the viewer actually got.
  useEffect(() => {
    const api = streamRef.current;
    if (!api) return;
    if (isActive) {
      api.play().catch(() => {}); // browser may block until a user gesture; muted start avoids this in practice
    }
    return () => {
      const watchedSeconds = Math.round(api.currentTime);
      const videoDurationSeconds = flare.duration_seconds ?? (Math.round(api.duration) || 0);
      if (watchedSeconds > 0 && videoDurationSeconds > 0) {
        const swipedAway = watchedSeconds / videoDurationSeconds < 0.75;
        reportSwipeEvent({ watchedSeconds, videoDurationSeconds, swipedAway, looped: hasLoopedRef.current });
      }
      api.pause();
      api.currentTime = 0; // next time this slide is reached, it starts fresh
      hasLoopedRef.current = false;
      prevTimeRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Periodic progress ping while active — same "every 10-15s" cadence as
  // the main feed's watch-progress tracking, reported as a non-swipe-away
  // event so a long, still-being-watched Flare doesn't get penalized
  // just because the viewer hasn't swiped away yet.
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const api = streamRef.current;
      if (!api) return;
      const watchedSeconds = Math.round(api.currentTime);
      const videoDurationSeconds = flare.duration_seconds ?? (Math.round(api.duration) || 0);
      if (watchedSeconds <= 0 || videoDurationSeconds <= 0) return;
      reportSwipeEvent({ watchedSeconds, videoDurationSeconds, swipedAway: false, looped: hasLoopedRef.current });
    }, 12000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Loop inference — see hasLoopedRef's declaration above for why this
  // can't just be an 'ended' handler.
  function handleStreamTimeUpdate() {
    const api = streamRef.current;
    if (!api || !api.duration) return;
    if (prevTimeRef.current > api.duration * 0.85 && api.currentTime < 1) {
      hasLoopedRef.current = true;
    }
    prevTimeRef.current = api.currentTime;
  }

  // Same reasoning as autoplay — mute is driven imperatively so the toggle
  // works on an already-mounted player, not just at mount time.
  useEffect(() => {
    if (streamRef.current) streamRef.current.muted = muted;
  }, [muted]);

  async function toggleLike() {
    if (likeBusy) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    if (!prevLiked) {
      setLikeBurst(true);
      setTimeout(() => setLikeBurst(false), 400);
    }
    setLikeBusy(true);
    try {
      const token = await getToken();
      const resp = prevLiked ? await unlikeVideo(token, flare.id) : await likeVideo(token, flare.id);
      setLiked(resp.liked);
      setLikeCount(resp.like_count);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleSubscribe() {
    if (subBusy) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const prevSub = subscribed;
    const prevCount = followerCount;
    setSubscribed(!prevSub);
    setFollowerCount(prevCount + (prevSub ? -1 : 1));
    setSubBusy(true);
    try {
      const token = await getToken();
      const resp = prevSub
        ? await unsubscribeCreator(token, flare.creator.id)
        : await subscribeCreator(token, flare.creator.id);
      setSubscribed(resp.subscribed);
      setFollowerCount(resp.follower_count);
    } catch {
      setSubscribed(prevSub);
      setFollowerCount(prevCount);
    } finally {
      setSubBusy(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/video/${flare.id}`;
    if (navigator.share) {
      navigator.share({ title: flare.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  function handleTipClick() {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    setShowTip(true);
  }

  const description = flare.description ?? "";
  const isLongDesc = description.length > 90;

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {/* Video — full-bleed within its own vertical frame; see FlaresPage
          for why the frame itself is centered/height-constrained rather
          than stretched across very wide desktop viewports. */}
      <div
        className="flare-stream-fill absolute inset-0"
        onClick={onToggleMute}
      >
        <Stream
          streamRef={streamRef}
          src={flare.cloudflare_video_id}
          controls={false}
          autoplay={false}
          muted={muted}
          loop
          responsive={false}
          preload="auto"
          className="w-full h-full"
          onTimeUpdate={handleStreamTimeUpdate}
        />
      </div>

      {/* Mute indicator (top-right) */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
        aria-label={muted ? t("unmute") : t("mute")}
      >
        {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>

      {/* Right action stack */}
      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5">
        <button onClick={toggleLike} disabled={likeBusy} className="flex flex-col items-center gap-1">
          <span
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform ${likeBurst ? "scale-125" : "scale-100"}`}
          >
            <Heart
              size={28}
              className={liked ? "text-gold-400 fill-gold-400" : "text-white"}
              strokeWidth={liked ? 0 : 2}
            />
          </span>
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(likeCount)}</span>
        </button>

        <button onClick={() => onOpenComments(flare.id)} className="flex flex-col items-center gap-1">
          <span className="w-11 h-11 rounded-full flex items-center justify-center">
            <MessageCircle size={26} className="text-white" />
          </span>
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(commentCount)}</span>
        </button>

        <button onClick={handleTipClick} aria-label={t("tip")} className="flex flex-col items-center gap-1">
          <span className="w-11 h-11 rounded-full bg-gold-400 flex items-center justify-center shadow-gold">
            <ZuvaSunIcon size={22} interactive />
          </span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <span className="w-11 h-11 rounded-full flex items-center justify-center">
            <Share2 size={24} className="text-white" />
          </span>
          <span className="text-white text-xs font-semibold drop-shadow">{t("share")}</span>
        </button>
      </div>

      {/* Bottom-left creator info + caption */}
      <div className="absolute left-0 right-16 bottom-6 z-10 px-4">
        <Link href={`/channel/${flare.creator.username}`} className="flex items-center gap-2.5 mb-2 w-fit">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gold-400/20 border-2 border-white/80 flex items-center justify-center text-sm font-bold text-gold-300 shrink-0">
            {flare.creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={flare.creator.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              creatorName.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-white font-semibold text-sm drop-shadow">{creatorName}</span>
        </Link>

        <button
          onClick={(e) => { e.stopPropagation(); toggleSubscribe(); }}
          disabled={subBusy}
          className={`mb-2.5 text-xs font-bold px-4 py-1.5 rounded-full transition-all disabled:opacity-60
            ${subscribed
              ? "bg-transparent text-white border border-white/60"
              : "bg-gold-400 text-black shadow-gold"
            }`}
        >
          {subBusy ? "…" : subscribed ? t("following") : t("follow")}
        </button>

        {flare.title && (
          <p className="text-white text-sm font-semibold drop-shadow mb-0.5">{flare.title}</p>
        )}
        {description && (
          <p
            onClick={(e) => { e.stopPropagation(); setDescExpanded((v) => !v); }}
            className={`text-white/90 text-xs leading-relaxed drop-shadow cursor-pointer ${descExpanded ? "" : "line-clamp-2"}`}
          >
            {description}
            {isLongDesc && !descExpanded && <span className="text-white/60"> {t("more")}</span>}
          </p>
        )}
      </div>

      {showTip && (
        <TipModal
          creatorId={flare.creator.id}
          contentId={flare.id}
          orientation="vertical"
          creatorName={creatorName}
          onClose={() => setShowTip(false)}
        />
      )}
    </div>
  );
}
