import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function SiteFooter() {
  const t = useTranslations("SiteFooter");
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" aria-label={t("homeAriaLabel")}>
          <img
            src="/zuva-logo.svg"
            alt="Zuva"
            style={{ width: "80px", height: "auto", background: "transparent" }}
          />
        </Link>
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-zinc-600 text-xs">
          <Link href="/about"    className="hover:text-gold-400 transition-colors">{t("about")}</Link>
          <Link href="/privacy"  className="hover:text-gold-400 transition-colors">{t("privacyPolicy")}</Link>
          <Link href="/terms"    className="hover:text-gold-400 transition-colors">{t("termsOfService")}</Link>
          <Link href="/creator-signup" className="hover:text-gold-400 transition-colors">{t("creatorSignUp")}</Link>
        </nav>
        <p className="text-zinc-700 text-xs">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
