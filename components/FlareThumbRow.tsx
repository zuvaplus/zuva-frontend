import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FlareItem } from "@/lib/types";
import { withSponsoredFlareSlots, isSponsoredFlareSlot } from "@/lib/utils";

// Sponsored Flare-shaped placeholder, interleaved every 5th position by
// withSponsoredFlareSlots below. Not a Link (unlike real thumbnails) —
// placeholder state is deliberately non-clickable. This is where the
// full-screen Flares native ad unit will be served once ad serving is
// wired up; only the thumbnail-row appearance lives here.
function SponsoredFlareCard() {
  const t = useTranslations("Flares");
  return (
    <div className="shrink-0 flex flex-col items-center gap-2 w-[120px]">
      <div className="flare-shape w-[120px] h-[200px] bg-[#111] flex items-center justify-center">
        <span className="text-[11px] text-zinc-500">{t("ad")}</span>
      </div>
      <span className="text-[10px] font-semibold" style={{ color: "#f37b0d" }}>
        {t("sponsored")}
      </span>
    </div>
  );
}

// Horizontal-scrolling row of Flare-shaped video thumbnails for the
// homepage. There's no per-Flare deep link into the /flares swipe
// feed (it always starts from the top of the ranked feed) — every
// thumbnail links to /flares itself, same as the sidebar's own Flares
// entry, rather than inventing a new deep-linking route just for this.
export default function FlareThumbRow({ flares }: { flares: FlareItem[] }) {
  if (flares.length === 0) return null;

  const items = withSponsoredFlareSlots(flares, 5);

  return (
    <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-1">
      {items.map((item) => {
        if (isSponsoredFlareSlot(item)) {
          return <SponsoredFlareCard key={item.id} />;
        }
        const flare = item;
        const creatorName = flare.creator.display_name ?? flare.creator.username;
        return (
          <Link
            key={flare.id}
            href="/flares"
            className="shrink-0 flex flex-col items-center gap-2 w-[120px] group"
          >
            <div className="flare-shape w-[120px] h-[200px] bg-surface-300 overflow-hidden border border-gold-400/15 group-hover:border-gold-400/40 transition-colors">
              {flare.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={flare.thumbnail_url}
                  alt={flare.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface-200" />
              )}
            </div>
            <div className="flex items-center gap-1.5 max-w-full px-1">
              <div className="w-5 h-5 rounded-full bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400 text-[9px] font-bold overflow-hidden shrink-0">
                {flare.creator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={flare.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  creatorName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-zinc-400 text-xs truncate">{creatorName}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
