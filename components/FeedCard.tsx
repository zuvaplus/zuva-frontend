"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { FeedItem } from "@/lib/types";
import { formatSuns, formatDuration } from "@/lib/utils";
import ZuvaSunIcon from "./ZuvaSunIcon";
import TipModal from "./TipModal";

interface FeedCardProps {
  item: FeedItem;
  autoplay?: boolean;
}

export default function FeedCard({ item, autoplay = false }: FeedCardProps) {
  const [showTip,    setShowTip]    = useState(false);
  const [liked,      setLiked]      = useState(false);
  const [localLikes, setLocalLikes] = useState(item.like_count);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVertical = item.orientation === "vertical";

  useEffect(() => {
    if (!videoRef.current) return;
    autoplay ? videoRef.current.play().catch(() => {}) : videoRef.current.pause();
  }, [autoplay]);

  function handleLike() {
    setLiked((prev) => { setLocalLikes((l) => (prev ? l - 1 : l + 1)); return !prev; });
  }

  return (
    <>
      <div
        className={`relative group rounded-2xl overflow-hidden bg-surface-300 card-hover border border-gold-400/8
          ${isVertical ? "aspect-portrait max-w-sm w-full" : "aspect-landscape w-full"}`}
      >
        {/* Media */}
        {item.cloudfront_url ? (
          <video
            ref={videoRef}
            src={item.cloudfront_url}
            poster={item.thumbnail_url}
            loop muted playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={item.thumbnail_url || "/placeholder-thumb.jpg"}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 video-overlay" />

        {/* Duration */}
        <span className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md font-mono">
          {formatDuration(item.duration_seconds)}
        </span>

        {/* Trending badge */}
        {item._bucket === "trending" && (
          <span className="absolute top-3 left-3 flex items-center gap-1 bg-gold-400/15 border border-gold-400/35 text-gold-400 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
            <ZuvaSunIcon size={10} /> Trending
          </span>
        )}

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Link href={`/watch/${item.id}`}>
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-2 hover:text-gold-300 transition-colors">
              {item.title}
            </h3>
          </Link>

          <Link href={`/creator/${item.creator_id}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400 text-xs font-bold">
                {item.creator_display_name?.[0] ?? "C"}
              </div>
              <span className="text-zinc-400 text-xs hover:text-gold-300 transition-colors">
                @{item.creator_username ?? item.creator_id.slice(0, 8)}
              </span>
            </div>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  liked ? "text-gold-400" : "text-zinc-500 hover:text-gold-300"
                }`}
              >
                <HeartIcon filled={liked} />
                {localLikes > 0 && <span>{formatSuns(localLikes)}</span>}
              </button>
              <span className="flex items-center gap-1 text-zinc-500 text-xs">
                <EyeIcon />
                {formatSuns(item.view_count)}
              </span>
            </div>

            {/* Tip button */}
            <button
              onClick={() => setShowTip(true)}
              className="flex items-center gap-1.5 bg-gold-400/15 hover:bg-gold-400/25 border border-gold-400/35 text-gold-400 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            >
              <ZuvaSunIcon size={12} interactive />
              {item.total_tips_suns > 0 ? formatSuns(item.total_tips_suns) : "Tip"}
            </button>
          </div>
        </div>

        {/* Tags on hover */}
        {item.ai_generated_tags?.length > 0 && (
          <div className="absolute top-10 left-3 right-12 hidden group-hover:flex flex-wrap gap-1 pointer-events-none">
            {item.ai_generated_tags.slice(0, 3).map((tag) => (
              <span key={tag} className="bg-black/70 text-gold-400/80 text-[10px] px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {showTip && (
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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#F5A623" : "none"}>
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={filled ? "#F5A623" : "#555"}
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#555" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="#555" strokeWidth="2"/>
    </svg>
  );
}
