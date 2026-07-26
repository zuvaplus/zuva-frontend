"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

// Display names are written in their OWN language ("Français" not
// "French") so a user can recognize their language even if the current
// UI locale isn't theirs yet.
const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  fr: "Français",
};

// This switches the UI language only — a separate future "content
// language preference" (which videos get recommended) is a different
// field entirely and doesn't belong here.
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: AppLocale) {
    if (next === locale) return;
    // router.replace(..., {locale}) both navigates and persists the
    // choice in next-intl's NEXT_LOCALE cookie — no manual cookie code
    // needed, and it always overrides browser-based detection afterward.
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className={compact ? "" : "px-3 py-2"}>
      {!compact && (
        <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1.5">
          <Globe size={13} />
          {t("label")}
        </div>
      )}
      <div className="flex gap-1.5">
        {routing.locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={isPending}
            aria-current={l === locale}
            className={`flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50
              ${l === locale
                ? "bg-gold-400 text-black border-gold-400"
                : "bg-transparent text-zinc-400 border-gold-400/20 hover:border-gold-400/50 hover:text-gold-300"
              }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
