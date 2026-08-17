import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const AMBER = "#f37b0d";

interface FooterLink {
  label: string;
  href: string | null; // null = not built yet, renders as inert text instead of a dead link
}

function FooterColumn({ heading, links }: { heading: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: AMBER }}>
        {heading}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <Link
                href={link.href}
                className="text-sm transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {link.label}
              </Link>
            ) : (
              <span className="text-sm cursor-default" style={{ color: "rgba(255,255,255,0.6)" }}>
                {link.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Global site footer — every public-facing page (see AppShell.tsx's
// NO_FOOTER_PATHS for the creator-dashboard/admin/settings exclusions).
// Supersedes the old page-local SiteFooter.tsx, which was only ever
// manually dropped into About/Privacy/Terms/Creator-Signup/Advertise —
// this covers those same links plus the full Company/Creators/
// Advertisers/Legal structure, so SiteFooter was removed rather than
// left to double up underneath this one on those exact pages.
export default function Footer() {
  const t = useTranslations("Footer");

  const columns: { heading: string; links: FooterLink[] }[] = [
    {
      heading: t("company.heading"),
      links: [
        { label: t("company.about"), href: "/about" },
        { label: t("company.contact"), href: "/contact" },
        { label: t("company.careers"), href: null },
      ],
    },
    {
      heading: t("creators.heading"),
      links: [
        { label: t("creators.signUp"), href: "/creator-signup" },
        { label: t("creators.guidelines"), href: null },
        { label: t("creators.helpCenter"), href: null },
      ],
    },
    {
      heading: t("advertisers.heading"),
      links: [
        { label: t("advertisers.advertiseWithUs"), href: "/advertise" },
        { label: t("advertisers.mediaKit"), href: null },
        { label: t("advertisers.contactSales"), href: "/contact?type=advertiser" },
      ],
    },
    {
      heading: t("legal.heading"),
      links: [
        { label: t("legal.terms"), href: "/terms" },
        { label: t("legal.privacy"), href: "/privacy" },
        { label: t("legal.communityGuidelines"), href: null },
      ],
    },
  ];

  return (
    <footer
      className="w-full pt-12 pb-8 px-6"
      style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {columns.map((col) => (
            <FooterColumn key={col.heading} heading={col.heading} links={col.links} />
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-1.5 text-center">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t("copyright", { year: 2027 })}
          </p>
          <p className="text-xs font-semibold" style={{ color: AMBER }}>
            {t("tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
