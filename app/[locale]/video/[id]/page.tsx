"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import type { StreamPlayerApi } from "@cloudflare/stream-react";
import { Eye, Clock, Tag, Flag, X, Film, Heart, Mail, Bookmark } from "lucide-react";
import type { VideoResponse, ReportCategory, RelatedVideo } from "@/lib/types";
import {
  likeVideo,
  unlikeVideo,
  saveVideo,
  unsaveVideo,
  subscribeCreator,
  unsubscribeCreator,
  recordWatchProgress,
  reportVideo,
} from "@/lib/api";
import { formatDuration, formatCount, timeAgoLong } from "@/lib/utils";
import CommentsSection from "@/components/CommentsSection";
import VideoPlayerWithAds from "@/components/VideoPlayerWithAds";
import TipModal from "@/components/TipModal";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import { useUserRole } from "@/components/UserRoleProvider";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

// Canonical wire values — must match REPORT_CATEGORIES in
// zuva-backend/zuva-api.js. Only the displayed label is translated
// (Video.report.categories.*).
const REPORT_CATEGORIES: ReportCategory[] = [
  "nudity", "minors", "violence", "animal_cruelty", "hate_speech",
  "misinformation", "spam", "copyright", "other",
];

const LEGAL_CONTACT = "legal@zuva.tv";

// How long the autoplay-next overlay counts down before navigating.
const AUTOPLAY_SECONDS = 5;

// Persisted on/off preference for the whole autoplay feature (countdown
// + auto-navigate), remembered across sessions.
const AUTOPLAY_PREF_KEY = "zuva_autoplay_enabled";

// One-shot signal for "the video about to load at this id should start
// playing immediately" — set right before navigating via the countdown
// or Play Now, read and cleared the moment the destination page mounts.
// sessionStorage (not a query param) so this page doesn't need a
// Suspense boundary for useSearchParams just for this.
const AUTOPLAY_NEXT_KEY = "zuva_autoplay_next_video_id";

function VideoSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="skeleton aspect-video rounded-2xl mb-5" />
      <div className="skeleton h-6 w-2/3 rounded mb-3" />
      <div className="skeleton h-4 w-1/3 rounded" />
    </div>
  );
}

function ReportModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  const t = useTranslations("Video.report");
  const { getToken } = useAuth();
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [details, setDetails]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const isCopyright = category === "copyright";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setSubmitting(true);
    setError(null);
    try {
      // Reporting works for signed-out viewers too — only attach a token
      // when one is available so the report can be attributed if signed in.
      const token = await getToken().catch(() => null);
      await reportVideo(token, videoId, {
        category,
        additional_details: details.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm bg-surface-200 border border-gold-400/20 rounded-t-3xl md:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>

        {done ? (
          isCopyright ? (
            // Copyright never files a report — this mirrors the backend's
            // redirect response rather than showing a false "submitted"
            // confirmation for something that was never recorded.
            <div className="text-center py-4">
              <Mail size={32} className="text-gold-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">{t("copyright.title")}</p>
              <p className="text-zinc-500 text-sm mb-4">{t("copyright.body")}</p>
              <a
                href={`mailto:${LEGAL_CONTACT}`}
                className="inline-block bg-gold-400 hover:bg-gold-300 text-black font-bold px-6 py-2.5 rounded-xl transition-all"
              >
                {t("copyright.emailButton", { email: LEGAL_CONTACT })}
              </a>
            </div>
          ) : (
            <div className="text-center py-4">
              <Flag size={32} className="text-gold-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">{t("submitted")}</p>
              <p className="text-zinc-500 text-sm">{t("thanks")}</p>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-white font-bold text-lg mb-1">{t("title")}</h2>
            <p className="text-zinc-500 text-xs mb-4">{t("subtitle")}</p>
            <div className="space-y-2 mb-4">
              {REPORT_CATEGORIES.map((key) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors
                    ${category === key ? "border-gold-400/50 bg-gold-400/10 text-white" : "border-gold-400/15 text-zinc-400 hover:border-gold-400/30"}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={category === key}
                    onChange={() => setCategory(key)}
                    className="accent-gold-400 shrink-0"
                  />
                  {t(`categories.${key}`)}
                </label>
              ))}
            </div>

            {category && !isCopyright && (
              <div className="mb-4">
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">{t("detailsLabel")}</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder={t("detailsPlaceholder")}
                  className="w-full bg-surface-100 border border-gold-400/15 focus:border-gold-400/40 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors resize-none"
                />
              </div>
            )}

            {isCopyright && (
              <p className="text-zinc-500 text-xs mb-4 bg-surface-100 border border-gold-400/10 rounded-xl px-3 py-2.5">
                {t("copyright.hint", { email: LEGAL_CONTACT })}
              </p>
            )}

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              type="submit"
              disabled={!category || submitting}
              className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-40"
            >
              {submitting ? t("submitting") : isCopyright ? t("copyright.continueButton") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/** Render description text with bare URLs converted to safe links. */
function AutoLinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300 underline underline-offset-2 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Description({ text, containsSyntheticMedia }: { text: string; containsSyntheticMedia?: boolean }) {
  const t = useTranslations("Video");
  const [expanded, setExpanded] = useState(false);
  // Cheap heuristic for whether the collapse control is worth showing.
  const isLong = text.length > 180 || text.split("\n").length > 3;

  return (
    <div className="relative bg-surface-200 border border-gold-400/10 rounded-xl px-4 py-3 pb-7 mb-5">
      <p
        className={`text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        <AutoLinkedText text={text} />
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-zinc-500 hover:text-gold-400 text-xs font-semibold mt-1.5 transition-colors"
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}
      {/* Links / merch shelf lands here in the upcoming monetization task */}

      {/* AI-content disclosure badge — self-disclosed by the creator at
          upload (contains_synthetic_media), same compact "CC"-style pill
          convention: just big enough for the two letters, amber-outlined,
          tucked in the corner rather than a banner across the player. */}
      {containsSyntheticMedia && (
        <span
          title={t("aiDisclosureBadgeTooltip")}
          className="absolute bottom-2.5 right-3 inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-gold-400/70 text-gold-400 text-[10px] font-bold leading-none tracking-wide"
        >
          {t("aiDisclosureBadge")}
        </span>
      )}
    </div>
  );
}

// Display-ad placeholder for the right-column sidebar — 300x250 is
// IAB's standard "Medium Rectangle" unit. Swap this box's contents for
// the real GAM (Google Ad Manager) slot (googletag.defineSlot(...) /
// ad tag markup) once ad serving is wired up; nothing here should
// survive that change except the outer sizing. Same dark styling as
// BannerAdPlaceholder below, just at this unit's own size.
function AdPlaceholder() {
  const t = useTranslations("Video");
  return (
    <div className="w-[300px] h-[250px] max-w-full mx-auto lg:mx-0 flex items-center justify-center bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-lg">
      {/* GAM DISPLAY AD SLOT — insert the ad tag/slot definition here. */}
      <span className="text-[11px] text-[rgba(255,255,255,0.3)]">{t("advertisementPlaceholder")}</span>
    </div>
  );
}

// Horizontal banner-ad placeholder between the tags row and comments —
// ~90px tall at the full column width is IAB's standard "Leaderboard"
// size. Swap this box's contents for the real GAM (Google Ad Manager)
// banner slot (googletag.defineSlot(...) / ad tag markup) once ad
// serving is wired up; nothing here should survive that change except
// the outer sizing.
function BannerAdPlaceholder() {
  const t = useTranslations("Video");
  return (
    <div className="w-full h-[90px] flex items-center justify-center bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-lg mb-5">
      {/* GAM BANNER AD SLOT — insert the ad tag/slot definition here. */}
      <span className="text-[11px] text-[rgba(255,255,255,0.3)]">{t("advertisementPlaceholder")}</span>
    </div>
  );
}

// One row in the "Up Next" list — compact horizontal card, matches the
// same /video/:id destination the old grid-of-cards related-videos
// section used, just relaid out for the sidebar column.
function UpNextCard({ video }: { video: RelatedVideo }) {
  const creatorName = video.creator_display_name || video.creator_username;
  return (
    <Link
      href={`/video/${video.id}`}
      className="flex items-start gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
    >
      <div className="relative w-[120px] h-[68px] shrink-0 rounded-lg overflow-hidden bg-surface-300">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-200" />
        )}
        {video.duration_seconds != null && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1 py-0.5 rounded flex items-center gap-1">
            <Clock size={9} /> {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
        <p className="text-zinc-500 text-xs mt-1 truncate">{creatorName}</p>
      </div>
    </Link>
  );
}

export default function VideoPlayerPage() {
  const t = useTranslations("Video");
  const tCategories = useTranslations("Categories");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  // DB users.id, not Clerk's user.id — see VideoPlayerWithAds's header
  // note on why those are two different id spaces.
  const { userId: viewerDbId } = useUserRole();

  const [data, setData]       = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Engagement state (seeded from the video response, mutated optimistically)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [subBusy, setSubBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  // null = no autoplay overlay showing. Set to AUTOPLAY_SECONDS when the
  // player fires onEnded (see toggleLike-adjacent handlers below);
  // ticks down to 0, then navigates to the first "Up Next" video.
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  // Defaults true; corrected from localStorage in the effect below once
  // mounted (can't read localStorage during the initial server render).
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  // True only for the one render right after arriving here via the
  // countdown/Play Now — tells the player to start playing immediately.
  const [autoplayThisLoad, setAutoplayThisLoad] = useState(false);

  const streamRef = useRef<StreamPlayerApi | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTOPLAY_PREF_KEY);
      if (stored !== null) setAutoplayEnabled(stored === "true");
    } catch {
      // localStorage unavailable (private mode etc.) — keep the default.
    }
  }, []);

  function toggleAutoplayEnabled() {
    setAutoplayEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTOPLAY_PREF_KEY, String(next));
      } catch {
        // best-effort — see comment above
      }
      return next;
    });
  }

  // Consumes the one-shot "autoplay this video" signal for whichever id
  // we've just navigated to — re-runs on every id change, unlike a
  // useState lazy initializer, which only ever runs once for this
  // component instance (client-side nav here doesn't remount it).
  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTOPLAY_NEXT_KEY) === id) {
        sessionStorage.removeItem(AUTOPLAY_NEXT_KEY);
        setAutoplayThisLoad(true);
        return;
      }
    } catch {
      // sessionStorage unavailable — just don't autoplay this load.
    }
    setAutoplayThisLoad(false);
  }, [id]);

  // Derived from state (not a hook) — safe to compute unconditionally
  // even before data has loaded, so the effects below can depend on it.
  const nextVideo = data?.related_videos?.[0] ?? null;
  const nextVideoId = nextVideo?.id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Send the token when available so viewer.has_liked / is_subscribed /
      // has_saved reflect the signed-in user; anonymous viewers get
      // false/false/false.
      const token = await getToken().catch(() => null);
      const res = await fetch(`${BACKEND_URL}/api/video/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? t("notFound"));
      }
      const json: VideoResponse = await res.json();
      setData(json);
      setLiked(json.viewer?.has_liked ?? false);
      setLikeCount(json.video.like_count ?? 0);
      setSubscribed(json.viewer?.is_subscribed ?? false);
      setFollowerCount(json.creator.follower_count ?? 0);
      setSaved(json.viewer?.has_saved ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("notFound"));
    } finally {
      setLoading(false);
    }
  }, [id, getToken, t]);

  useEffect(() => {
    load();
  }, [load]);

  // A new video id means a fresh player — drop any countdown left over
  // from the previous one (there shouldn't be, since navigating away
  // unmounts/remounts this effect's owner, but this is the belt for
  // the client-side-nav-without-full-reload case).
  useEffect(() => {
    setAutoplayCountdown(null);
  }, [id]);

  // Ticks the autoplay overlay down once a second; navigates once it
  // reaches 0. Cancel (below) just resets this back to null, which
  // this effect's own guard clause turns into a no-op.
  useEffect(() => {
    if (autoplayCountdown === null) return;
    if (autoplayCountdown === 0) {
      goToNextVideo();
      setAutoplayCountdown(null);
      return;
    }
    const timer = setTimeout(() => setAutoplayCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayCountdown]);

  // Flags the destination video to autoplay on arrival, then navigates —
  // used by both the countdown reaching 0 and Play Now, so either path
  // into the next video starts it playing immediately.
  function goToNextVideo() {
    if (!nextVideoId) return;
    try {
      sessionStorage.setItem(AUTOPLAY_NEXT_KEY, nextVideoId);
    } catch {
      // best-effort — worst case the next page just doesn't autoplay
    }
    router.push(`/video/${nextVideoId}`);
  }

  function cancelAutoplay() {
    setAutoplayCountdown(null);
  }

  function playNextNow() {
    goToNextVideo();
  }

  // Watch-progress tracking — the missing signal computeFeedScore's
  // completion rate depends on. Fired periodically (every 12s, within
  // the requested 10-15s cadence) while playing, on pause, on 'ended',
  // and once more on unmount (route navigation away) — not just a
  // single on-leave guess like the old (removed) view-complete route.
  // Best-effort throughout: a missed ping just means slightly sparser
  // signal, never something to surface to the viewer.
  const sendProgress = useCallback(async () => {
    const api = streamRef.current;
    if (!api || !data) return;
    const watchedSeconds = Math.round(api.currentTime);
    const videoDurationSeconds = data.video.duration_seconds ?? Math.round(api.duration) ?? 0;
    if (!videoDurationSeconds || watchedSeconds <= 0) return;
    try {
      const token = await getToken().catch(() => null);
      await recordWatchProgress(token, {
        videoId: data.video.id,
        watchedSeconds,
        videoDurationSeconds,
      });
    } catch {
      // best-effort — see comment above
    }
  }, [data, getToken]);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(sendProgress, 12000);
    return () => {
      clearInterval(interval);
      sendProgress();
    };
  }, [data, sendProgress]);

  async function toggleLike() {
    if (!data || likeBusy) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    // Optimistic flip; rollback on failure.
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    setLikeBusy(true);
    try {
      const token = await getToken();
      const resp = prevLiked
        ? await unlikeVideo(token, data.video.id)
        : await likeVideo(token, data.video.id);
      // Server count is authoritative (trigger-recomputed)
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
    if (!data || subBusy) return;
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
        ? await unsubscribeCreator(token, data.creator.id)
        : await subscribeCreator(token, data.creator.id);
      setSubscribed(resp.subscribed);
      setFollowerCount(resp.follower_count);
    } catch {
      setSubscribed(prevSub);
      setFollowerCount(prevCount);
    } finally {
      setSubBusy(false);
    }
  }

  async function toggleSave() {
    if (!data || saveBusy) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const prevSaved = saved;
    setSaved(!prevSaved);
    setSaveBusy(true);
    try {
      const token = await getToken();
      const resp = prevSaved
        ? await unsaveVideo(token, data.video.id)
        : await saveVideo(token, data.video.id);
      setSaved(resp.saved);
    } catch {
      setSaved(prevSaved);
    } finally {
      setSaveBusy(false);
    }
  }

  if (loading) return <VideoSkeleton />;

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Film size={40} className="mx-auto mb-4 text-zinc-700" />
        <h1 className="text-white font-bold text-xl mb-2">{t("notFound")}</h1>
        <p className="text-zinc-500 text-sm mb-6">{error}</p>
        <Link href="/feed" className="bg-gold-400/15 text-gold-400 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium">
          {t("backToFeed")}
        </Link>
      </div>
    );
  }

  const { video, creator, related_videos } = data;
  const creatorName = creator.display_name || creator.username;
  // Skip pre-roll ads entirely when the viewer is watching their own
  // upload — matches !!viewerDbId so a null/unresolved viewer id never
  // accidentally matches a null/undefined creator_id.
  const isOwnContent = !!viewerDbId && viewerDbId === video.creator_id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6 lg:grid lg:grid-cols-[65%_35%] lg:gap-x-6 lg:items-start animate-fade-in">
    {/* LEFT COLUMN (~65%): player + everything that was already here —
        title, meta, channel bar, description, tags, comments. */}
    <div>
      {/* Player — Stream (not a raw iframe) so streamRef gives us
          imperative currentTime/duration/paused access for watch-progress
          tracking, same verified pattern as FlareSlide.tsx. controls=true
          here (unlike Flares) since this page has no custom overlay UI.
          Wrapped in VideoPlayerWithAds for the Zuva Ads pre-roll — city/
          country are omitted (no geolocation source exists anywhere in
          this frontend yet), so the backend serves country-agnostic ads. */}
      <div className="video-stream-fill relative aspect-video bg-surface-300 rounded-2xl overflow-hidden mb-5 border border-gold-400/10">
        <VideoPlayerWithAds
          videoId={video.cloudflare_video_id}
          contentId={video.id}
          contentCategory={video.content_category}
          skipAds={isOwnContent}
          streamRef={streamRef}
          controls
          responsive={false}
          preload="metadata"
          className="w-full h-full"
          onPause={() => { sendProgress(); }}
          onEnded={() => {
            sendProgress();
            if (autoplayEnabled && nextVideoId) setAutoplayCountdown(AUTOPLAY_SECONDS);
          }}
          autoplayMain={autoplayThisLoad}
        />

        {/* Autoplay-next overlay — shows once the player fires onEnded,
            counts down, then navigates to the first "Up Next" video
            unless the viewer cancels or jumps ahead with Play Now. */}
        {autoplayCountdown !== null && nextVideo && (
          <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">{t("autoplayNext")}</p>
            <div className="flex items-center gap-3 max-w-xs">
              {nextVideo.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nextVideo.thumbnail_url} alt="" className="w-20 h-12 object-cover rounded-lg shrink-0" />
              )}
              <p className="text-white font-semibold text-sm text-left line-clamp-2">{nextVideo.title}</p>
            </div>
            <p className="text-gold-400 text-3xl font-bold tabular-nums">{autoplayCountdown}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={cancelAutoplay}
                className="text-zinc-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/20 transition-colors"
              >
                {t("cancelAutoplay")}
              </button>
              <button
                onClick={playNextNow}
                className="bg-gold-400 hover:bg-gold-300 text-black text-sm font-bold px-5 py-2 rounded-full transition-all"
              >
                {t("playNow")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-white font-bold text-xl sm:text-2xl mb-2">{video.title}</h1>

      {/* Meta row: views · date on the left, like (+ future tip) on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-x-3 text-zinc-500 text-sm">
          <span className="flex items-center gap-1.5">
            <Eye size={14} /> {t("viewsCount", { count: formatCount(video.view_count) })}
          </span>
          <span aria-hidden>·</span>
          <span>{timeAgoLong(video.created_at)}</span>
          <span className="bg-gold-400/10 text-gold-400 border border-gold-400/25 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {tCategories.has(video.category) ? tCategories(video.category) : video.category}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLike}
            disabled={likeBusy}
            aria-pressed={liked}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all disabled:opacity-60
              ${liked
                ? "bg-gold-400 text-black border-gold-400 shadow-gold"
                : "bg-surface-200 text-zinc-300 border-gold-400/25 hover:border-gold-400/60 hover:text-gold-300"
              }`}
          >
            <Heart size={16} className={liked ? "fill-current" : ""} />
            {formatCount(likeCount)}
          </button>
          <button
            onClick={toggleSave}
            disabled={saveBusy}
            aria-pressed={saved}
            title={saved ? t("saved") : t("save")}
            className={`p-2.5 rounded-full border transition-all disabled:opacity-60
              ${saved
                ? "bg-gold-400 text-black border-gold-400 shadow-gold"
                : "bg-surface-200 text-zinc-300 border-gold-400/25 hover:border-gold-400/60 hover:text-gold-300"
              }`}
          >
            <Bookmark size={16} className={saved ? "fill-current" : ""} />
          </button>
          {/* Same classes as FeedCard.tsx's Tip button, verbatim — kept
              pixel-consistent with the feed grid's own tip button rather
              than a new one-off style. */}
          <button
            onClick={() => setShowTip(true)}
            aria-label={t("tip")}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gold-400/15 hover:bg-gold-400/25 border border-gold-400/35 transition-all"
          >
            <ZuvaSunIcon size={18} />
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
            title={t("reportThisVideo")}
          >
            <Flag size={15} />
          </button>
        </div>
      </div>

      {/* Channel bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-200 border border-gold-400/15 rounded-xl px-4 py-3 mb-5">
        <Link href={`/channel/${creator.username}`} className="flex items-center gap-3 group min-w-0">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-base font-bold text-gold-400 shrink-0">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              creatorName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold group-hover:text-gold-400 transition-colors truncate">
              {creatorName}
            </p>
            <p className="text-zinc-500 text-xs">
              {followerCount === 1
                ? t("followerCountOne", { count: formatCount(followerCount) })
                : t("followerCountOther", { count: formatCount(followerCount) })}
            </p>
          </div>
        </Link>

        <button
          onClick={toggleSubscribe}
          disabled={subBusy}
          className={`shrink-0 text-sm font-bold px-5 py-2 rounded-full transition-all disabled:opacity-60
            ${subscribed
              ? "bg-transparent text-gold-400 border border-gold-400/50 hover:bg-gold-400/10"
              : "bg-gold-400 hover:bg-gold-300 text-black shadow-gold"
            }`}
        >
          {subBusy ? "…" : subscribed ? t("subscribed") : t("subscribe")}
        </button>
      </div>

      {/* Description (collapsed to 3 lines, auto-linked URLs) */}
      {/* Renders even with no description text when the AI badge needs
          somewhere to live — the badge's home is this box, not the
          player, per the disclosure requirement. */}
      {(video.description || video.contains_synthetic_media) && (
        <Description text={video.description ?? ""} containsSyntheticMedia={video.contains_synthetic_media} />
      )}

      {/* Tags */}
      {video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {video.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-200 text-zinc-400 border border-gold-400/10 text-xs"
            >
              <Tag size={11} /> {tag}
            </span>
          ))}
        </div>
      )}

      <BannerAdPlaceholder />

      {/* Comments */}
      <CommentsSection videoId={video.id} initialCount={video.comment_count ?? 0} />
    </div>

    {/* RIGHT COLUMN (~35%, sticky on desktop): ad placeholder + Up Next.
        gap-x-6 on the grid above already gives this the ~24px separation
        from the player; mt-8 only applies on mobile, where this column
        stacks below the left column's content instead of sitting beside it. */}
    <div className="mt-8 lg:mt-0 lg:sticky lg:top-20 lg:self-start">
      <AdPlaceholder />

      {related_videos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-xl">{t("upNext")}</h2>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs font-medium">{t("autoplayToggle")}</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoplayEnabled}
                aria-label={t("autoplayToggle")}
                onClick={toggleAutoplayEnabled}
                className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${
                  autoplayEnabled ? "bg-gold-400" : "bg-surface-300 border border-white/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    autoplayEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {related_videos.map((rv) => (
              <UpNextCard key={rv.id} video={rv} />
            ))}
          </div>
        </div>
      )}
    </div>

    {showReport && <ReportModal videoId={video.id} onClose={() => setShowReport(false)} />}
    {showTip && (
      <TipModal
        creatorId={creator.id}
        contentId={video.id}
        orientation="landscape"
        creatorName={creatorName}
        onClose={() => setShowTip(false)}
      />
    )}
    </div>
  );
}
