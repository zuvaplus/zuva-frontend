"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { FeedItem, Orientation } from "@/lib/types";
import { getFeed, recordViewComplete } from "@/lib/api";
import { formatSuns, formatDuration, timeAgo } from "@/lib/utils";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import TipModal from "@/components/TipModal";

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<number>(0);

  const [item, setItem] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load video — currently searches the feed for the item by ID.
  // When a dedicated /api/content/:id endpoint exists, replace this.
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getFeed("both", 100, 0);
        const found = data.feed?.find((f) => f.id === id);
        if (found) {
          setItem(found);
        }
      } catch (_) {
        // ignore — show error state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Auto-hide controls
  function resetControlsTimer() {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }

  // Record view completion when leaving
  const reportView = useCallback(async () => {
    if (!item || !videoRef.current) return;
    const watchDuration = Math.round(Date.now() / 1000 - startTimeRef.current);
    const totalDuration = item.duration_seconds;
    if (watchDuration > 0 && totalDuration > 0) {
      await recordViewComplete({
        contentId: item.id,
        orientation: item.orientation,
        watchDurationSeconds: watchDuration,
        totalDurationSeconds: totalDuration,
      }).catch(() => {});
    }
  }, [item]);

  useEffect(() => {
    return () => {
      reportView();
    };
  }, [reportView]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
    resetControlsTimer();
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!videoRef.current) return;
    const pct = Number(e.target.value);
    videoRef.current.currentTime = (pct / 100) * videoRef.current.duration;
    setProgress(pct);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <ZuvaSunIcon size={40} glow className="animate-spin-slow" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-zinc-400">Video not found</p>
        <button onClick={() => router.back()} className="text-gold-400 hover:underline text-sm">
          Go back
        </button>
      </div>
    );
  }

  const isVertical = item.orientation === "vertical";

  return (
    <>
      <div
        className={`flex flex-col ${isVertical ? "items-center" : ""} min-h-[calc(100vh-56px)] bg-surface-500`}
        onMouseMove={resetControlsTimer}
        onTouchStart={resetControlsTimer}
      >
        {/* Video container */}
        <div
          className={`relative bg-black overflow-hidden
            ${isVertical
              ? "w-full max-w-sm mx-auto aspect-portrait"
              : "w-full aspect-landscape"
            }`}
          onClick={togglePlay}
        >
          {item.cloudfront_url ? (
            <video
              ref={videoRef}
              src={item.cloudfront_url}
              poster={item.thumbnail_url}
              muted={muted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => { setPlaying(true); startTimeRef.current = Date.now() / 1000; }}
              onPause={() => setPlaying(false)}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={item.thumbnail_url ?? ""}
              alt={item.title}
              className="w-full h-full object-contain"
            />
          )}

          {/* Center play/pause indicator */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
              !playing || showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {!playing && (
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-gold-400/40">
                <PlayIcon />
              </div>
            )}
          </div>

          {/* Overlay controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Progress bar */}
            <div className="px-4 pb-1">
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={handleSeek}
                onClick={(e) => e.stopPropagation()}
                className="gold-range w-full"
              />
            </div>

            {/* Controls row */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-gold-300">
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="text-white hover:text-gold-300"
                >
                  {muted ? <MuteIcon /> : <VolumeIcon />}
                </button>
                <span className="text-white text-xs font-mono">
                  {videoRef.current
                    ? formatDuration(Math.floor(videoRef.current.currentTime))
                    : "0:00"}
                  {" / "}
                  {formatDuration(item.duration_seconds)}
                </span>
              </div>

              <button
                onClick={() => setShowTip(true)}
                className="flex items-center gap-1.5 bg-gold-400 hover:bg-gold-300 text-black text-xs font-bold px-3 py-1.5 rounded-full transition-all"
              >
                <ZuvaSunIcon size={12} />
                Tip
              </button>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className={`${isVertical ? "w-full max-w-sm" : "max-w-4xl w-full mx-auto"} px-4 py-5`}>
          {/* Title */}
          <h1 className="text-white font-bold text-xl mb-2 leading-tight">{item.title}</h1>

          {/* Meta row */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-4 text-zinc-400 text-sm">
              <span className="flex items-center gap-1">
                <EyeIcon size={14} /> {formatSuns(item.view_count)} views
              </span>
              <span className="flex items-center gap-1">
                <HeartIcon size={14} /> {formatSuns(item.like_count)}
              </span>
              {item.total_tips_suns > 0 && (
                <span className="flex items-center gap-1 text-gold-400">
                  <ZuvaSunIcon size={13} /> {formatSuns(item.total_tips_suns)} Suns tipped
                </span>
              )}
            </div>
            <OrientationBadge orientation={item.orientation} />
          </div>

          {/* Creator row */}
          <div className="flex items-center justify-between bg-surface-200 border border-gold-400/15 rounded-xl p-3 mb-4">
            <Link href={`/creator/${item.creator_id}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gold-400/30 border border-gold-400/50 flex items-center justify-center text-gold-300 font-bold">
                {item.creator_display_name?.[0] ?? "C"}
              </div>
              <div>
                <div className="text-white font-semibold text-sm group-hover:text-gold-300 transition-colors">
                  {item.creator_display_name ?? "Creator"}
                </div>
                <div className="text-zinc-500 text-xs">
                  @{item.creator_username ?? item.creator_id.slice(0, 8)}
                </div>
              </div>
            </Link>
            <button
              onClick={() => setShowTip(true)}
              className="flex items-center gap-2 bg-gold-400/15 hover:bg-gold-400/25 text-gold-300 border border-gold-400/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <ZuvaSunIcon size={14} />
              Send Suns
            </button>
          </div>

          {/* Tags */}
          {item.ai_generated_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.ai_generated_tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-surface-200 border border-gold-400/20 text-gold-400/80 text-xs px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => router.back()}
            className="text-zinc-500 hover:text-gold-300 text-sm transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {showTip && item && (
        <TipModal
          creatorId={item.creator_id}
          contentId={item.id}
          orientation={item.orientation}
          creatorName={item.creator_display_name ?? item.creator_id.slice(0, 8)}
          onClose={() => setShowTip(false)}
        />
      )}
    </>
  );
}

function OrientationBadge({ orientation }: { orientation: Orientation }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
        orientation === "vertical"
          ? "text-purple-300 bg-purple-400/15 border-purple-400/30"
          : "text-blue-300 bg-blue-400/15 border-blue-400/30"
      }`}
    >
      {orientation === "vertical" ? "Portrait" : "Landscape"}
    </span>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3l14 9-14 9V3z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function EyeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
