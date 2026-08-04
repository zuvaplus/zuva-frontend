"use client";

/**
 * Two-step signup modal for the /advertise page's "Get Started" buttons.
 * See app/[locale]/advertise/page.tsx's header comment for the fuller
 * audit trail this component was built from.
 *
 * Modal shell deliberately does NOT match TipModal/ReportModal/AdsTab's
 * bottom-sheet-on-mobile convention (items-end + rounded-t-3xl) — this
 * task explicitly asked for the modal to be full-screen on mobile
 * specifically, which is a real, distinct instruction from the rest of
 * this codebase's modals, not something to silently normalize away.
 *
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is used only as a presence check
 * (stripeEnabled below) — its value is never read or sent anywhere.
 * Stripe Checkout is a backend-hosted redirect; this component only
 * ever calls this frontend's own backend, never the Stripe API directly.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/countries";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
const STRIPE_ENABLED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export type PackageTier = "starter" | "growth" | "brand";

interface PackageSummary {
  tier: PackageTier;
  name: string;
  price: number;
  features: string[];
}

const BUSINESS_CATEGORIES: { value: string; label: string }[] = [
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "hair_beauty", label: "Hair & Beauty" },
  { value: "fashion_apparel", label: "Fashion & Apparel" },
  { value: "events_entertainment", label: "Events & Entertainment" },
  { value: "professional_services", label: "Professional Services" },
  { value: "money_remittance", label: "Money & Remittance" },
  { value: "education", label: "Education" },
  { value: "africa_based_brand", label: "Africa-Based Brand" },
  { value: "other", label: "Other" },
];

const REFERRAL_SOURCES = ["Social media", "Creator referral", "Business association", "Friend or colleague", "Other"];

interface FormState {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  businessCategory: string;
  referralSource: string;
}

const INITIAL_FORM: FormState = {
  businessName: "", contactName: "", email: "", phone: "",
  city: "", country: "", businessCategory: "", referralSource: "",
};

const inputClass =
  "w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-300 text-sm mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}

type Step = "details" | "payment" | "inquiry_sent";

export default function AdvertisePaymentModal({ pkg, onClose }: { pkg: PackageSummary; onClose: () => void }) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [cardLoading, setCardLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One key for this modal's whole lifetime — generated once at mount,
  // reused across retries of "Pay with Card" (e.g. a network timeout
  // followed by clicking again) so the backend's idempotency check
  // recognizes it as the same attempt instead of creating a duplicate
  // Stripe customer/checkout session. A fresh modal open (new component
  // instance) naturally gets a fresh key, which is correct — that's a
  // genuinely new attempt.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const detailsValid =
    form.businessName.trim() !== "" &&
    form.contactName.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.city.trim() !== "" &&
    form.country !== "" &&
    form.businessCategory !== "";

  // Signup happens before Clerk sign-in exists for this business, so
  // there is no auth token in the normal sense — a token is attached
  // only if the person happens to already be signed in (e.g. an
  // existing creator advertising their own business); both new routes
  // are public and don't require one either way.
  async function callBackend<T>(path: string, body: unknown): Promise<T> {
    const token = await getToken().catch(() => null);
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      const validatorMsgs = Array.isArray(responseBody?.errors)
        ? responseBody.errors.map((e: { msg?: string }) => e.msg).filter(Boolean).join("; ")
        : "";
      throw new Error(responseBody?.error ?? (validatorMsgs || `Request failed (${res.status})`));
    }
    return res.json() as Promise<T>;
  }

  function requestPayload() {
    return {
      business_name: form.businessName,
      contact_name: form.contactName,
      email: form.email,
      phone: form.phone || undefined,
      city: form.city,
      country: form.country,
      business_category: form.businessCategory,
      package_tier: pkg.tier,
      referral_source: form.referralSource || undefined,
    };
  }

  async function handleCardPayment() {
    setError(null);
    setCardLoading(true);
    try {
      const data = await callBackend<{ url: string }>("/api/ads/advertise/stripe-checkout", {
        ...requestPayload(),
        idempotency_key: idempotencyKey,
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setCardLoading(false);
    }
  }

  async function handlePaymentLink() {
    setError(null);
    setLinkLoading(true);
    try {
      await callBackend("/api/ads/advertise/inquiry", requestPayload());
      setStep("inquiry_sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit inquiry");
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-fade-in flex md:items-center md:justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Full-screen on mobile, centered card on desktop — see file
          header note on why this diverges from this codebase's usual
          bottom-sheet modal convention. */}
      <div className="w-full h-full md:h-auto md:max-w-lg md:max-h-[90vh] overflow-y-auto bg-surface-200 md:border md:border-gold-400/20 md:rounded-3xl p-6 sm:p-8 animate-slide-up shadow-gold-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">
              {step === "inquiry_sent" ? "Inquiry Received" : `Get Started — ${pkg.name}`}
            </h2>
            {step !== "inquiry_sent" && (
              <p className="text-zinc-500 text-sm">${pkg.price}/month</p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        {/* ── STEP 1: business details ─────────────────────── */}
        {step === "details" && (
          <div className="space-y-4">
            <Field label="Business name *">
              <input className={inputClass} value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
            </Field>
            <Field label="Your name *">
              <input className={inputClass} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
            </Field>
            <Field label="Email address *">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Phone number">
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City *">
                <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field label="Country *">
                <select className={inputClass} value={form.country} onChange={(e) => update("country", e.target.value)}>
                  <option value="" disabled>Select country</option>
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Business category *">
              <select className={inputClass} value={form.businessCategory} onChange={(e) => update("businessCategory", e.target.value)}>
                <option value="" disabled>Select category</option>
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="How did you hear about Zuva Ads?">
              <select className={inputClass} value={form.referralSource} onChange={(e) => update("referralSource", e.target.value)}>
                <option value="">Prefer not to say</option>
                {REFERRAL_SOURCES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>

            <button
              onClick={() => setStep("payment")}
              disabled={!detailsValid}
              className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {/* ── STEP 2: payment method ───────────────────────── */}
        {step === "payment" && (
          <div className="space-y-5">
            <div className="bg-surface-100 border border-gold-400/10 rounded-xl px-4 py-4">
              <p className="text-white font-bold">{pkg.name} — ${pkg.price}/month</p>
              <ul className="mt-2 space-y-1">
                {pkg.features.slice(0, 3).map((f) => (
                  <li key={f} className="text-zinc-400 text-xs">• {f}</li>
                ))}
              </ul>
            </div>

            {STRIPE_ENABLED && (
              <div className="border border-gold-400/15 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-gold-400" />
                  <p className="text-white font-semibold text-sm">Pay with Card — Visa, Mastercard, Apple Pay, Google Pay</p>
                </div>
                <p className="text-zinc-500 text-xs mb-3">For businesses in Canada, UK, US, France, and Europe</p>
                <button
                  onClick={handleCardPayment}
                  disabled={cardLoading || linkLoading}
                  className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cardLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {cardLoading ? "Redirecting…" : `Pay $${pkg.price}/month with Card`}
                </button>
              </div>
            )}

            <div className="border border-gold-400/15 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone size={16} className="text-gold-400" />
                <p className="text-white font-semibold text-sm">Pay via Mobile Money or African Bank Transfer</p>
              </div>
              <p className="text-zinc-500 text-xs mb-3">
                For businesses in Africa and the Caribbean — Nigeria, Ghana, Zimbabwe, Jamaica, Trinidad, and more
              </p>
              <button
                onClick={handlePaymentLink}
                disabled={cardLoading || linkLoading}
                className="w-full bg-gold-400/15 text-gold-400 border border-gold-400/25 hover:bg-gold-400/25 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {linkLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {linkLoading ? "Submitting…" : "Get Payment Link"}
              </button>
            </div>

            <button
              onClick={() => setStep("details")}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors"
            >
              ← Back to business details
            </button>
          </div>
        )}

        {/* ── inquiry confirmation ──────────────────────────── */}
        {step === "inquiry_sent" && (
          <div className="text-center py-4">
            <p className="text-zinc-300 text-sm leading-relaxed">
              We will send a payment link to <span className="text-white font-semibold">{form.email}</span> within
              24 hours. You can also email us directly at{" "}
              <a href="mailto:hello@zuva.tv" className="text-gold-400 hover:underline">hello@zuva.tv</a> to get
              started immediately.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3 rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
