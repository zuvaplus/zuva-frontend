import { useTranslations } from "next-intl";
import { SignIn } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  const t = useTranslations("Auth");
  const pills = [
    { icon: "🌍", key: "diasporaFirst" },
    { icon: "☀️",  key: "earnSuns"     },
    { icon: "💸", key: "mobileMoney"  },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-black">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Brand header */}
        <div className="text-center mb-8">
          <img src="/zuva-logo.svg" alt="Zuva" style={{ width: "140px", height: "auto", background: "transparent", margin: "0 auto" }} />
          <p className="text-zinc-600 text-sm mt-3">{t("signInTagline")}</p>
        </div>

        {/* Clerk sign-in widget */}
        <SignIn appearance={clerkAppearance} />

        {/* Feature pills */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {pills.map(({ icon, key }) => (
            <div key={key} className="bg-surface-300/60 border border-gold-400/8 rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-zinc-600 text-[10px] font-medium">{t(`pills.${key}`)}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-700 text-xs mt-5">
          {t("agreeToTerms")}{" "}
          <Link href="/terms"   className="text-gold-400/60 hover:text-gold-400 transition-colors">{t("terms")}</Link>
          {" & "}
          <Link href="/privacy" className="text-gold-400/60 hover:text-gold-400 transition-colors">{t("privacyPolicy")}</Link>
        </p>
      </div>
    </div>
  );
}
