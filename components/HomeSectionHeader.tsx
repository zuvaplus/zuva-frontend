import { Link } from "@/i18n/navigation";

// Shared row header for every homepage section (Trending, Flares, each
// category row, Recommended) — bold white ~20px title, amber "See
// more" right-aligned when a destination is given.
export default function HomeSectionHeader({
  title,
  seeMoreHref,
  seeMoreLabel,
}: {
  title: string;
  seeMoreHref?: string;
  seeMoreLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-bold text-xl">{title}</h2>
      {seeMoreHref && (
        <Link
          href={seeMoreHref}
          className="text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors shrink-0"
        >
          {seeMoreLabel}
        </Link>
      )}
    </div>
  );
}
