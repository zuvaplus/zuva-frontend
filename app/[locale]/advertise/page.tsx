"use client";

/**
 * Zuva Ads public landing page — /advertise.
 *
 * AUDIT NOTES (Part 1 of the task this file was built from):
 *  - Path: this project has no src/ directory anywhere (confirmed
 *    throughout every prior task) — the real convention is
 *    app/[locale]/<route>/page.tsx, so this lives at
 *    app/[locale]/advertise/page.tsx, not src/app/[locale]/advertise/page.tsx.
 *  - Layout/form/styling patterns copied from
 *    app/[locale]/creator-signup/page.tsx: the Field wrapper + inputClass
 *    constant, plain fetch()-based submission with a try/catch/finally
 *    around a `submitting` boolean, and SiteFooter at the bottom.
 *  - Brand color: every existing element on this page family uses the
 *    gold-400 Tailwind token (#f37b0d, tailwind.config.ts), not the
 *    #F5A623 this task named — same discrepancy flagged and resolved
 *    the same way in components/admin/AdsTab.tsx previously. Used
 *    gold-400 throughout for visual consistency with the rest of the site.
 *  - Nodemailer: confirmed in zuva-backend/zuva-api.js (sendApplicantEmail/
 *    sendAdminEmail/brandedEmailHtml, Gmail SMTP) and replicated
 *    server-side in zuva-backend/routes/ads.js's new /advertise/* routes
 *    — nothing to wire up on this side beyond calling those routes.
 *  - Stripe: no existing frontend Stripe integration anywhere (grepped —
 *    zero matches) and none is needed here beyond a redirect: Stripe
 *    Checkout is backend-hosted, so this page never touches the Stripe
 *    SDK or Stripe Elements — it just POSTs business details to
 *    /api/ads/advertise/stripe-checkout and redirects to the { url }
 *    the backend returns.
 *  - Env var: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is used ONLY as a
 *    presence check (stripeEnabled below) to decide whether to show the
 *    card-payment option — its actual value is never read or passed to
 *    any Stripe call from this page, since Checkout Sessions are created
 *    server-side with the secret key.
 *  - This page is explicitly not translated (same call as the admin
 *    dashboard) — no useTranslations anywhere in this file or
 *    AdvertisePaymentModal, matching AdsTab.tsx's precedent.
 */

import { useRef, useState } from "react";
import { Ban, Target, Wallet, CheckCircle2, ChevronDown } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import AdvertisePaymentModal, { type PackageTier } from "@/components/AdvertisePaymentModal";

interface Package {
  tier: PackageTier;
  name: string;
  price: number;
  tagline: string;
  idealFor: string;
  features: string[];
  popular?: boolean;
}

const PACKAGES: Package[] = [
  {
    tier: "starter",
    name: "Starter",
    price: 19,
    tagline: "Entry-level presence",
    idealFor: "Ideal for: Local restaurants, market stalls, event promoters, service providers",
    features: [
      "5,000–8,000 targeted impressions per month",
      "15-second pre-roll ad on culturally matched content",
      "One content category (Food, Music, Beauty, etc.)",
      "City-level geographic targeting",
      "Monthly impressions report",
      "No contract — cancel any time",
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    price: 59,
    tagline: "Consistent reach",
    idealFor: "Ideal for: Restaurants, salons, clothing brands, professional services",
    popular: true,
    features: [
      "20,000–35,000 targeted impressions per month",
      "Pre-roll + Flares feed placement",
      "Two content category selections",
      "City-level geographic targeting",
      "A/B test two creatives",
      "Monthly performance dashboard",
      "No contract — cancel any time",
    ],
  },
  {
    tier: "brand",
    name: "Brand",
    price: 149,
    tagline: "Community presence",
    idealFor: "Ideal for: Growing brands, businesses with diaspora reach, financial services",
    features: [
      "60,000–100,000 targeted impressions per month",
      "Full placement: pre-roll + Flares + homepage featured section",
      "Creator content pairing",
      "Multi-city or country-level targeting",
      "Full performance report + monthly strategy notes",
      "Priority placement",
      "No contract — cancel any time",
    ],
  },
];

const WHY_ZUVA = [
  {
    icon: Ban,
    title: "No Auction",
    body: "Meta puts you in a global auction against brands with 100x your budget. Zuva charges a flat monthly rate. No bidding. No learning phase. No wasted budget.",
  },
  {
    icon: Target,
    title: "Exact Targeting",
    body: "On Meta, “African food” is an interest tag. On Zuva, your ad plays before videos that African and Caribbean viewers are actively watching right now. That is not approximate targeting — it is your customer.",
  },
  {
    icon: Wallet,
    title: "Community Pricing",
    body: "The minimum effective spend on Meta is $2,000–$5,000 per month. Zuva Starter is $19/month with guaranteed delivery. No minimum spend floors that exclude small businesses.",
  },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Sign Up", body: "Choose your package and tell us about your business. Takes 2 minutes." },
  { step: 2, title: "Upload Your Ad", body: "Send us your 15-second video. We review and approve within 48 hours." },
  { step: 3, title: "Go Live", body: "Your ad starts playing before content your community is already watching." },
  { step: 4, title: "See Results", body: "Get a monthly report showing impressions, click-throughs, and engagement." },
];

const WHO_ADVERTISES = [
  "Restaurants & Catering", "Hair & Beauty", "Fashion & Clothing", "Events & Nightlife",
  "Music & Entertainment", "Travel & Tourism", "Financial Services", "Immigration & Legal",
  "Real Estate", "Education & Tutoring", "Remittance & Money Transfer", "Africa-Based Brands",
];

const FAQS = [
  {
    q: "Do I need to sign a contract?",
    a: "No. All packages are month-to-month. Cancel any time with no fees or penalties.",
  },
  {
    q: "What format does my ad need to be in?",
    a: "A 15-second video (MP4 is ideal). If you do not have a video, we can point you to affordable local production options in your city. Contact hello@zuva.tv.",
  },
  {
    q: "How quickly will my ad go live?",
    a: "We review and approve creatives within 48 hours of receiving payment. Once approved, your ad goes live immediately.",
  },
  {
    q: "Can I target a specific city?",
    a: "Yes. All packages include city-level geographic targeting. Your ad will only show to viewers we detect are in your target city.",
  },
  {
    q: "What if I am based in Africa or the Caribbean and cannot pay by card?",
    a: 'We accept mobile money and African bank transfers via Flutterwave. Click "Get Payment Link" when checking out, or email hello@zuva.tv and we will set you up within 24 hours.',
  },
  {
    q: "How do I know the ads are actually running?",
    a: "Every package includes a monthly impressions report sent to your email. Growth and Brand packages also include a performance dashboard.",
  },
  {
    q: "What content categories can I target?",
    a: "Entertainment, Music, Comedy, Drama, Documentary, Discussion, Interviews, Lifestyle, News, Nature. You choose the categories most relevant to your business when you sign up.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gold-400/12 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-surface-200 hover:bg-surface-300/60 transition-colors"
      >
        <span className="text-white font-semibold text-sm">{q}</span>
        <ChevronDown size={18} className={`text-gold-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 py-4 bg-surface-100 text-zinc-400 text-sm leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function AdvertisePage() {
  const packagesRef = useRef<HTMLDivElement | null>(null);
  const [modalTier, setModalTier] = useState<PackageTier | null>(null);

  function scrollToPackages() {
    packagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-black text-foreground">

      {/* ── SECTION 1: HERO ─────────────────────────────────── */}
      <section className="bg-black px-6 py-20 sm:py-28 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gold-400 leading-tight mb-3">
            Your Community Is Already Watching.
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
            Now They Can Find You.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-9">
            Zuva reaches African and Caribbean viewers across Toronto, London, Paris, and beyond.
            Unlike Meta, every viewer on Zuva is already part of your community.
          </p>
          <button
            onClick={scrollToPackages}
            className="bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3.5 rounded-xl transition-all shadow-gold text-base"
          >
            See Packages
          </button>
        </div>
      </section>

      {/* ── SECTION 2: WHY ZUVA ADS ─────────────────────────── */}
      <section className="px-6 py-16 sm:py-20 bg-surface-300/60 border-y border-gold-400/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">
            Built for Your Community. Priced for Your Budget.
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {WHY_ZUVA.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-surface-200 border border-gold-400/15 rounded-2xl p-6">
                <Icon size={28} className="text-gold-400 mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: PACKAGES ─────────────────────────────── */}
      <section id="packages" ref={packagesRef} className="px-6 py-16 sm:py-20 scroll-mt-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">
            Choose Your Package
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.tier}
                className={`relative flex flex-col bg-surface-200 border rounded-2xl p-6 ${
                  pkg.popular ? "border-gold-400 shadow-gold" : "border-gold-400/15"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-white font-extrabold text-xl">{pkg.name}</h3>
                <p className="text-gold-400 text-2xl font-extrabold mt-1 mb-1">
                  ${pkg.price}<span className="text-sm text-zinc-500 font-medium">/month</span>
                </p>
                <p className="text-zinc-500 text-sm mb-4">{pkg.tagline}</p>
                <p className="text-zinc-500 text-xs mb-4">{pkg.idealFor}</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-zinc-300 text-sm">
                      <CheckCircle2 size={16} className="text-gold-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setModalTier(pkg.tier)}
                  className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3 rounded-xl transition-all"
                >
                  Get Started — ${pkg.price}/month
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-500 text-sm mt-8">
            Need something larger? Contact us at{" "}
            <a href="mailto:hello@zuva.tv" className="text-gold-400 hover:underline">hello@zuva.tv</a>{" "}
            for custom packages.
          </p>
        </div>
      </section>

      {/* ── SECTION 5: HOW IT WORKS ─────────────────────────── */}
      <section className="px-6 py-16 sm:py-20 bg-surface-300/60 border-y border-gold-400/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-gold-400 text-black font-extrabold flex items-center justify-center mb-3 mx-auto sm:mx-0">
                  {s.step}
                </div>
                <h3 className="text-white font-bold text-base mb-1.5">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: WHO ADVERTISES ON ZUVA ───────────────── */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">
            Who Advertises on Zuva
          </h2>
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {WHO_ADVERTISES.map((w) => (
              <span
                key={w}
                className="bg-surface-200 border border-gold-400/15 text-zinc-300 text-sm px-4 py-2 rounded-full"
              >
                {w}
              </span>
            ))}
          </div>
          <p className="text-center text-zinc-400 text-base">
            If your customers are African or Caribbean — anywhere in the world — they are on Zuva.
          </p>
        </div>
      </section>

      {/* ── SECTION 7: FAQ ───────────────────────────────────── */}
      <section className="px-6 py-16 sm:py-20 bg-surface-300/60 border-y border-gold-400/10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">
            Common Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: FINAL CTA ────────────────────────────── */}
      <section className="bg-black px-6 py-20 sm:py-24 text-center border-t border-gold-400/10">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
          Your community is already watching.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg mb-8">
          Give them a reason to find you.
        </p>
        <button
          onClick={scrollToPackages}
          className="bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3.5 rounded-xl transition-all shadow-gold text-base mb-5"
        >
          Get Started
        </button>
        <p className="text-zinc-500 text-sm">
          Questions? Email{" "}
          <a href="mailto:hello@zuva.tv" className="text-gold-400 hover:underline">hello@zuva.tv</a>{" "}
          — we respond within 24 hours.
        </p>
      </section>

      <SiteFooter />

      {modalTier && (
        <AdvertisePaymentModal
          pkg={PACKAGES.find((p) => p.tier === modalTier)!}
          onClose={() => setModalTier(null)}
        />
      )}
    </div>
  );
}
