"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FeedItem } from "@/lib/types";
import { formatSuns, formatDuration, timeAgo, truncateDescription } from "@/lib/utils";
import TipModal from "./TipModal";
import ZuvaSunIcon from "./ZuvaSunIcon";

interface FeedCardProps {
  item: FeedItem;
}

export default function FeedCard({ item }: FeedCardProps) {
  const t = useTranslations("FeedCard");
  const [showTip, setShowTip] = useState(false);

  const creatorName = item.creator.display_name ?? item.creator.username ?? item.creator.id.slice(0, 8);
  const descriptionSnippet = item.description ? truncateDescription(item.description) : null;

  return (
    <>
      <div className="group rounded-2xl overflow-hidden bg-surface-300 border border-gold-400/10 hover:border-gold-400/30 card-hover transition-colors">
        {/* Thumbnail — a static image, not a live player; the real watch
            experience lives at /video/:id (Cloudflare Stream iframe). */}
        <Link href={`/video/${item.id}`} className="relative block aspect-landscape bg-surface-200">
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

          {item.duration_seconds != null && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded-md font-mono">
              {formatDuration(item.duration_seconds)}
            </span>
          )}

          {item.tags?.length > 0 && (
            <div className="absolute top-2 left-2 right-2 hidden group-hover:flex flex-wrap gap-1 pointer-events-none">
              {item.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-black/70 text-gold-400/80 text-[10px] px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </Link>

        <div className="p-4">
          <Link href={`/video/${item.id}`}>
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 hover:text-gold-300 transition-colors">
              {item.title}
            </h3>
          </Link>

          {descriptionSnippet && (
            <p className="text-zinc-500 text-xs leading-snug mt-1.5 line-clamp-1">
              {descriptionSnippet}
            </p>
          )}

          <Link href={`/channel/${item.creator.username}`} className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400 text-[10px] font-bold overflow-hidden shrink-0">
              {item.creator.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.creator.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                creatorName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-zinc-400 text-xs hover:text-gold-300 transition-colors truncate">
              {creatorName}
            </span>
          </Link>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-zinc-500 text-xs">
              <span className="flex items-center gap-1">
                <HeartIcon />
                {formatSuns(item.like_count)}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon />
                {formatSuns(item.view_count)}
              </span>
              <span>{timeAgo(item.created_at)}</span>
            </div>

            <button
              onClick={() => setShowTip(true)}
              aria-label={t("tip")}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-400/15 hover:bg-gold-400/25 border border-gold-400/35 transition-all"
            >
              <ZuvaSunIcon size={16} />
            </button>
          </div>
        </div>
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
