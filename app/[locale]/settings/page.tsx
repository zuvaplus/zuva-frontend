"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import type { MyAccount, CaptionLanguage } from "@/lib/types";
import { getMyAccount, updateMyPreferences } from "@/lib/api";
import { ALL_COUNTRIES } from "@/lib/countries";

// Matches VideoUploadForm.tsx's local CAPTION_LANGUAGES — duplicated
// rather than shared/exported, same convention as routes/ads.js's
// duplicated CONTENT_CATEGORIES on the backend.
const LANGUAGES: { code: CaptionLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "sw", label: "Kiswahili" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "ht", label: "Kreyòl Ayisyen" },
  { code: "yo", label: "Yorùbá" },
  { code: "ha", label: "Hausa" },
  { code: "zu", label: "isiZulu" },
  { code: "am", label: "አማርኛ" },
];

// Signed-in only — protected in middleware.ts. Private ranking/discovery
// preferences + read-only account info. Public identity (display name,
// bio, avatar, country) is edited on the Profile/Channel page instead —
// see the "How to apply" split noted in CLAUDE.md.
export default function SettingsPage() {
  const t = useTranslations("Settings");
  const { getToken } = useAuth();

  const [account, setAccount] = useState<MyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preferredCountry, setPreferredCountry] = useState("");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await getMyAccount(token);
      setAccount(data.user);
      setPreferredCountry(data.user.preferred_country ?? "");
      setPreferredLanguages(data.user.preferred_languages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [getToken, t]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleLanguage(code: string) {
    setSaved(false);
    setPreferredLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const token = await getToken();
      const data = await updateMyPreferences(token, {
        preferred_country: preferredCountry || undefined,
        preferred_languages: preferredLanguages,
      });
      setAccount(data.user);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-400 mb-4">{error ?? t("loadError")}</p>
        <button
          onClick={load}
          className="bg-gold-400/20 text-gold-300 border border-gold-400/30 px-6 py-2.5 rounded-xl font-medium"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-white font-bold text-2xl mb-1">{t("title")}</h1>
      <p className="text-zinc-500 text-sm mb-6">{t("subtitle")}</p>

      {/* Read-only account info */}
      <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-5 mb-6 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Mail size={16} className="text-zinc-500 shrink-0" />
          <span className="text-zinc-400">{account.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <ShieldCheck size={16} className="text-zinc-500 shrink-0" />
          <span className="text-zinc-400">@{account.username}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-gold-400/80 capitalize">{account.role}</span>
        </div>
        <p className="text-zinc-600 text-xs pt-1">
          {t("profileHint")}{" "}
          <Link href="/profile" className="text-gold-400 hover:underline">
            {t("profileLink")}
          </Link>
        </p>
      </div>

      {/* Preferences */}
      <form onSubmit={handleSave} className="bg-surface-200 border border-gold-400/15 rounded-2xl p-5 space-y-5">
        <h2 className="text-white font-semibold text-sm">{t("preferencesTitle")}</h2>

        <div>
          <label className="block text-zinc-300 text-xs font-medium mb-1">
            {t("preferredCountryLabel")}
          </label>
          <p className="text-zinc-600 text-xs mb-1.5">{t("preferredCountryHint")}</p>
          <select
            value={preferredCountry}
            onChange={(e) => { setPreferredCountry(e.target.value); setSaved(false); }}
            className="bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-2.5 outline-none w-full"
          >
            <option value="">{t("noPreference")}</option>
            {ALL_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-300 text-xs font-medium mb-1">
            {t("preferredLanguagesLabel")}
          </label>
          <p className="text-zinc-600 text-xs mb-2">{t("preferredLanguagesHint")}</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const active = preferredLanguages.includes(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => toggleLanguage(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${active
                      ? "bg-gold-400 text-black border-gold-400"
                      : "bg-surface-300 text-zinc-400 border-gold-400/20 hover:text-gold-300"
                    }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
        {saved && <p className="text-green-400 text-xs">{t("saved")}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-gold-400 hover:bg-gold-300 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? t("savingEllipsis") : t("saveChanges")}
        </button>
      </form>
    </div>
  );
}
