"use client";

/**
 * Instagram-Stories-style row atop the Flares tab (/flares). First item is
 * always the signed-in viewer's own "Your Flare" entry — tapping it opens
 * FlareCreateSheet. The rest are followed creators who've posted a Flare
 * in the last 7 days (see GET /api/flares/story-row), most recent first;
 * tapping one jumps the feed below straight to their latest Flare. Flares
 * themselves never expire — the 7-day window only limits who surfaces
 * here, same as Instagram's own row.
 */

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import type { FlareStoryCreator } from "@/lib/types";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

export default function FlareStoryBar({
  creators,
  seenFlareIds,
  onCreateFlare,
  onOpenCreatorFlare,
}: {
  creators: FlareStoryCreator[];
  seenFlareIds: Set<string>;
  onCreateFlare: () => void;
  onOpenCreatorFlare: (flareId: string) => void;
}) {
  const t = useTranslations("Flares");
  const { user } = useUser();

  return (
    <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide px-4 py-3">
      {/* Own entry — always first, always present regardless of who's
          followed. Sun badge overlaid top-left distinguishes "create"
          from a regular followed-creator avatar. */}
      <button
        type="button"
        onClick={onCreateFlare}
        className="shrink-0 flex flex-col items-center gap-1.5 w-16 group"
      >
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-200 border border-white/15 flex items-center justify-center text-zinc-300 text-lg font-bold group-hover:border-white/30 transition-colors">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.username ?? user?.firstName ?? "?").charAt(0).toUpperCase()
            )}
          </div>
          <span className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full bg-black border border-black flex items-center justify-center">
            <ZuvaSunIcon size={13} glow />
          </span>
        </div>
        <span className="text-zinc-400 text-[11px] truncate max-w-full">{t("yourFlare")}</span>
      </button>

      {creators.length === 0 ? (
        <div className="flex items-center h-16 pl-1">
          <span className="text-zinc-600 text-xs max-w-[180px]">{t("followHint")}</span>
        </div>
      ) : (
        creators.map((creator) => {
          const name = creator.display_name ?? creator.username;
          const unseen = !seenFlareIds.has(creator.latest_flare_id);
          return (
            <button
              key={creator.id}
              type="button"
              onClick={() => onOpenCreatorFlare(creator.latest_flare_id)}
              className="shrink-0 flex flex-col items-center gap-1.5 w-16 group"
            >
              <div
                className={`w-16 h-16 rounded-full overflow-hidden bg-surface-200 flex items-center justify-center text-gold-400 text-lg font-bold transition-colors
                  ${unseen ? "border-2 border-gold-400" : "border border-white/15 group-hover:border-white/30"}`}
              >
                {creator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-zinc-400 text-[11px] truncate max-w-full">{name}</span>
            </button>
          );
        })
      )}
    </div>
  );
}
