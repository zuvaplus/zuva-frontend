"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import CommentsSection from "@/components/CommentsSection";

// Reuses CommentsSection as-is (same composer, replies, pagination,
// sign-in prompt for anonymous viewers) — only the surrounding chrome
// differs from the long-form video page: a sheet instead of an
// in-page section, per the Flares spec ("opens a bottom sheet, not a
// separate page").
export default function FlareCommentsSheet({
  flareId,
  initialCount,
  onClose,
}: {
  flareId: string;
  initialCount: number;
  onClose: () => void;
}) {
  const t = useTranslations("Flares");

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-surface-200 border-t border-gold-400/20 rounded-t-3xl animate-slide-up shadow-gold-lg flex flex-col h-[75vh]">
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
          <span className="w-8" aria-hidden />
          <div className="w-10 h-1 rounded-full bg-white/15 mx-auto" aria-hidden />
          <button
            onClick={onClose}
            aria-label={t("closeComments")}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <CommentsSection videoId={flareId} initialCount={initialCount} />
        </div>
      </div>
    </div>
  );
}
