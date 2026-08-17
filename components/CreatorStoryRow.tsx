import { Link } from "@/i18n/navigation";
import type { FollowedCreator } from "@/lib/types";

// Signed-in-only, homepage-only story-style row of followed creators —
// same .flare-shape as FlareThumbRow but smaller (56x80) and clipping
// the creator's own avatar image rather than a video thumbnail. Hidden
// entirely (returns null) when the viewer follows no one.
export default function CreatorStoryRow({ creators }: { creators: FollowedCreator[] }) {
  if (creators.length === 0) return null;

  return (
    <div className="flex items-start gap-3 overflow-x-auto scrollbar-hide pb-1 mb-8">
      {creators.map((creator) => {
        const name = creator.display_name ?? creator.username;
        return (
          <Link
            key={creator.id}
            href={`/channel/${creator.username}`}
            className="shrink-0 flex flex-col items-center gap-1.5 w-14 group"
          >
            <div className="flare-shape w-14 h-20 bg-gold-400/15 border border-gold-400/30 group-hover:border-gold-400/60 transition-colors flex items-center justify-center text-gold-400 text-sm font-bold overflow-hidden">
              {creator.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-zinc-400 text-[11px] truncate max-w-full">{name}</span>
          </Link>
        );
      })}
    </div>
  );
}
