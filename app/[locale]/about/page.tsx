import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const MARKET_KEYS = ["westAfrica", "eastAfrica", "southernAfrica", "caribbean", "globalDiaspora"] as const;

function StepCard({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-6">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold-400/15 text-gold-400 text-sm font-bold mb-4">
        {step}
      </span>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

export default async function AboutPage() {
  const t = await getTranslations("About");

  return (
    <div className="min-h-screen bg-black text-foreground">

      {/* Hero */}
      <div className="relative bg-surface-300 border-b border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-400/[0.06] to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <ZuvaSunIcon size={40} glow className="mx-auto mb-6" />
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-4">{t("ourMission")}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t("heroLine1")}<br />{t("heroLine2")}
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xl mx-auto">{t("heroBody")}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Our story */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">{t("whyZuvaExists")}</h2>
          <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
            <p>
              {t("story3Prefix")} <em className="text-zinc-400">{t("sun")}</em> {t("story3Suffix")}
            </p>
          </div>
        </section>

        {/* Markets served */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">{t("marketsWeServe")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MARKET_KEYS.map((key) => (
              <div key={key} className="bg-surface-200 border border-gold-400/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-gold-400 mt-0.5 shrink-0">›</span>
                <div>
                  <p className="text-white font-semibold text-sm">{t(`markets.${key}.name`)}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{t(`markets.${key}.blurb`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">{t("howItWorks")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StepCard step="V" title={t("forViewers")}>
              {t("forViewersBody")}
            </StepCard>
            <StepCard step="C" title={t("forCreators")}>
              {t("forCreatorsBody")}
            </StepCard>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-surface-200 border border-gold-400/20 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">{t("ctaTitle")}</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">{t("ctaBody")}</p>
          <Link
            href="/creator-signup"
            className="inline-block bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3.5 rounded-xl transition-all shadow-gold"
          >
            {t("ctaButton")}
          </Link>
        </section>

      </div>
    </div>
  );
}
