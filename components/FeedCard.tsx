"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FeedItem } from "@/lib/types";
import { formatSuns, formatDuration } from "@/lib/utils";
import TipModal from "./TipModal";

interface FeedCardProps {
  item: FeedItem;
}

export default function FeedCard({ item }: FeedCardProps) {
  const t = useTranslations("FeedCard");
  const [showTip, setShowTip] = useState(false);

  const creatorName = item.creator.display_name ?? item.creator.username ?? item.creator.id.slice(0, 8);

  return (
    <>
      <div className="relative group rounded-2xl overflow-hidden bg-surface-300 card-hover border border-gold-400/8 aspect-landscape w-full">
        {/* Media — a static thumbnail, not a live player; the real watch
            experience lives at /video/:id (Cloudflare Stream iframe). */}
        <Link href={`/video/${item.id}`}>
          {item.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-200" />
          )}
        </Link>

        <div className="absolute inset-0 video-overlay pointer-events-none" />

        {/* Duration */}
        {item.duration_seconds != null && (
          <span className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md font-mono">
            {formatDuration(item.duration_seconds)}
          </span>
        )}

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Link href={`/video/${item.id}`}>
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-2 hover:text-gold-300 transition-colors">
              {item.title}
            </h3>
          </Link>

          <Link href={`/channel/${item.creator.username}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400 text-xs font-bold overflow-hidden">
                {item.creator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  creatorName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-zinc-400 text-xs hover:text-gold-300 transition-colors">
                @{item.creator.username ?? item.creator.id.slice(0, 8)}
              </span>
            </div>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-zinc-500 text-xs">
                <HeartIcon />
                {formatSuns(item.like_count)}
              </span>
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
              {t("tip")}
            </button>
          </div>
        </div>

        {/* Tags on hover */}
        {item.tags?.length > 0 && (
          <div className="absolute top-3 left-3 right-12 hidden group-hover:flex flex-wrap gap-1 pointer-events-none">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="bg-black/70 text-gold-400/80 text-[10px] px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {showTip && (
        <TipModal
          creatorId={item.creator.id}
          contentId={item.id}
          orientation="landscape"
          creatorName={creatorName}
          onClose={() => setShowTip(false)}
        />
      )}
    </>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke="#555"
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
