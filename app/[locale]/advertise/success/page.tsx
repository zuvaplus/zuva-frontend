"use client";

/**
 * Stripe Checkout success_url lands here — see zuva-backend/routes/ads.js's
 * POST /api/ads/advertise/stripe-checkout (success_url: `${APP_URL}/advertise/
 * success?session_id={CHECKOUT_SESSION_ID}`). The session_id query param
 * isn't read here — the actual advertiser-activation work happens
 * server-side via the checkout.session.completed webhook, independent of
 * whether this confirmation page ever loads, so nothing here needs to
 * verify or fetch the session.
 */

import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function AdvertiseSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <CheckCircle2 size={52} className="text-gold-400 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            You&apos;re in. Welcome to Zuva Ads.
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-2">
            Your payment was confirmed. We will be in touch within 24 hours with instructions to upload your
            15-second ad creative. Your campaign will go live within 48 hours of approval.
          </p>
          <p className="text-zinc-500 text-sm mb-8">
            Questions? Email{" "}
            <a href="mailto:hello@zuva.tv" className="text-gold-400 hover:underline">hello@zuva.tv</a>
          </p>
          <Link
            href="/"
            className="inline-block bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-gold"
          >
            Return to Zuva
          </Link>
        </div>
      </div>
    </div>
  );
}
