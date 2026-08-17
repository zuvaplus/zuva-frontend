"use client";

import { useTranslations } from "next-intl";

// Premium homepage takeover — sold directly to advertisers (not a
// programmatic/GAM slot like the video-page banner/sidebar placeholders),
// shown above the Trending row on both the signed-in and signed-out
// homepage. `hasBookedCampaign` stands in for a real fill-check once
// direct-sold masthead campaigns are wired up; when there's no booked
// campaign this renders null so the row collapses entirely rather than
// leaving empty space — no wrapping margin lives outside this component,
// so a null return leaves nothing behind.
const hasBookedCampaign = true;

export default function HomepageMastheadAd() {
  const t = useTranslations("Homepage");

  if (!hasBookedCampaign) return null;

  return (
    <div
      className="relative w-full h-[180px] rounded-xl flex flex-col items-center justify-center mb-10"
      style={{ background: "#0a0a0a", border: "1px solid rgba(243,123,13,0.2)" }}
    >
      <span
        className="absolute top-3 right-4 text-[10px] font-semibold"
        style={{ color: "#f37b0d" }}
      >
        {t("mastheadSponsored")}
      </span>
      <p className="text-[13px] font-semibold" style={{ color: "#f37b0d" }}>
        {t("mastheadFeatured")}
      </p>
      <p className="text-[11px] text-zinc-500 mt-1">{t("mastheadSubtitle")}</p>
    </div>
  );
}
