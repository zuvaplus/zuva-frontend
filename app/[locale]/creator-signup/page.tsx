"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import SiteFooter from "@/components/SiteFooter";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

const AFRICAN_CARIBBEAN_COUNTRIES = [
  // Africa
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo (Brazzaville)", "Congo (DRC)", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon",
  "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya",
  "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali",
  "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger",
  "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles",
  "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan",
  "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  // Caribbean
  "Antigua and Barbuda", "Bahamas", "Barbados", "Cuba", "Dominica",
  "Dominican Republic", "Grenada", "Haiti", "Jamaica",
  "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Trinidad and Tobago",
];

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Facebook", "Other"];

const CATEGORIES = [
  "Comedy", "Drama", "Music", "News", "Sports", "Lifestyle", "Education", "Other",
];

const FOLLOWER_RANGES = [
  "Under 1K", "1K-10K", "10K-100K", "100K-500K", "500K+",
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

interface FormState {
  fullName: string;
  email: string;
  country: string;
  primaryPlatform: string;
  socialHandle: string;
  contentCategory: string;
  followerCount: string;
  agreedToTerms: boolean;
  marketingConsent: boolean;
}

const INITIAL_STATE: FormState = {
  fullName: "",
  email: "",
  country: "",
  primaryPlatform: "",
  socialHandle: "",
  contentCategory: "",
  followerCount: "",
  agreedToTerms: false,
  marketingConsent: false,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-300 text-sm mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors";

function CreatorSignupForm() {
  const t = useTranslations("CreatorSignup");
  const tCategories = useTranslations("Categories");
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const searchParams = useSearchParams();
  const redirectReason = searchParams.get("from");
  // Non-creators land here with ?from=dashboard|upload when they try to
  // reach a creator-only page — a friendlier explanation than a bare
  // redirect, and a nudge toward the form right below it.
  const redirectMessage =
    redirectReason === "dashboard" ? t("redirect.dashboard")
    : redirectReason === "upload" ? t("redirect.upload")
    : null;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!turnstileSiteKey) {
      console.warn(
        "[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set. Add a real Cloudflare Turnstile site key to " +
        ".env.local (and your production environment) — the widget cannot render without it."
      );
    }
  }, [turnstileSiteKey]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    form.fullName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.country !== "" &&
    form.primaryPlatform !== "" &&
    form.socialHandle.trim() !== "" &&
    form.contentCategory !== "" &&
    form.followerCount !== "" &&
    form.agreedToTerms &&
    !!turnstileToken &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !turnstileToken) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/creator-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          country: form.country,
          primaryPlatform: form.primaryPlatform,
          socialHandle: form.socialHandle,
          contentCategory: form.contentCategory,
          followerCount: form.followerCount,
          marketingConsent: form.marketingConsent,
          turnstileToken,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? t("submissionFailed", { status: res.status }));
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-foreground flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-md text-center">
            <ZuvaSunIcon size={40} glow className="mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-3">{t("checkYourEmail")}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">{t("checkYourEmailBody")}</p>
            <Link
              href="/"
              className="inline-block mt-8 bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-gold"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground">

      {/* Hero */}
      <div className="bg-surface-300 border-b border-gold-400/10">
        <div className="max-w-2xl mx-auto px-6 py-14 text-center">
          <ZuvaSunIcon size={36} glow className="mx-auto mb-5" />
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">{t("eyebrow")}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{t("heroTitle")}</h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">{t("heroBody")}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {redirectMessage && (
          <div className="bg-gold-400/10 border border-gold-400/25 text-gold-300 text-sm rounded-2xl px-5 py-4 mb-6">
            {redirectMessage} {t("redirect.applyBelow")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface-200 border border-gold-400/15 rounded-2xl p-6 sm:p-8 space-y-5">

          <Field label={t("fields.fullName")}>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className={inputClass}
              placeholder={t("fullNamePlaceholder")}
            />
          </Field>

          <Field label={t("fields.email")}>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </Field>

          <Field label={t("fields.country")}>
            <select
              required
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>{t("selectCountry")}</option>
              {AFRICAN_CARIBBEAN_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label={t("fields.primaryPlatform")}>
            <select
              required
              value={form.primaryPlatform}
              onChange={(e) => update("primaryPlatform", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>{t("selectPlatform")}</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>

          <Field label={t("fields.socialHandle")}>
            <input
              type="text"
              required
              value={form.socialHandle}
              onChange={(e) => update("socialHandle", e.target.value)}
              className={inputClass}
              placeholder="@yourhandle"
            />
          </Field>

          <Field label={t("fields.contentCategory")}>
            <select
              required
              value={form.contentCategory}
              onChange={(e) => update("contentCategory", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>{t("selectCategory")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{tCategories(c)}</option>
              ))}
            </select>
          </Field>

          <Field label={t("fields.followerCount")}>
            <select
              required
              value={form.followerCount}
              onChange={(e) => update("followerCount", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>{t("selectRange")}</option>
              {FOLLOWER_RANGES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={form.agreedToTerms}
                onChange={(e) => update("agreedToTerms", e.target.checked)}
                className="mt-0.5 accent-gold-400 w-4 h-4 shrink-0"
              />
              <span>
                {t("agreeToTermsPrefix")}{" "}
                <Link href="/terms" target="_blank" className="text-gold-400 hover:underline">{t("termsOfService")}</Link>
                {" "}{t("and")}{" "}
                <Link href="/privacy" target="_blank" className="text-gold-400 hover:underline">{t("privacyPolicy")}</Link>.
                <span className="text-zinc-600"> {t("required")}</span>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(e) => update("marketingConsent", e.target.checked)}
                className="mt-0.5 accent-gold-400 w-4 h-4 shrink-0"
              />
              <span>
                {t("marketingConsentBody")}
                <span className="text-zinc-600"> {t("optional")}</span>
              </span>
            </label>
          </div>

          {/* Turnstile */}
          <div className="pt-2">
            {turnstileSiteKey ? (
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  console.log("[Turnstile] onSuccess fired, token:", token);
                  setTurnstileToken(token);
                }}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            ) : (
              <p className="text-red-400 text-xs">{t("turnstileNotConfigured")}</p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-gold"
          >
            {submitting ? t("submittingEllipsis") : t("submitApplication")}
          </button>
        </form>
      </div>

      <SiteFooter />
    </div>
  );
}

export default function CreatorSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CreatorSignupForm />
    </Suspense>
  );
}
