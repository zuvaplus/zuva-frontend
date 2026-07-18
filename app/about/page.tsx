import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

export const metadata: Metadata = {
  title: "About — Zuva.TV",
  description: "African & Caribbean Stories. Free Forever. Learn why Zuva.TV exists and how it works.",
};

const MARKETS = [
  { name: "West Africa",     blurb: "Nigeria, Ghana, Senegal & beyond" },
  { name: "East Africa",     blurb: "Kenya, Tanzania, Ethiopia & beyond" },
  { name: "Southern Africa", blurb: "South Africa, Zimbabwe, Zambia & beyond" },
  { name: "Caribbean",       blurb: "Jamaica, Trinidad & Tobago, Barbados & beyond" },
  { name: "Global Diaspora", blurb: "Everywhere African & Caribbean stories travel" },
];

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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-foreground">

      {/* Hero */}
      <div className="relative bg-surface-300 border-b border-gold-400/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-400/[0.06] to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <ZuvaSunIcon size={40} glow className="mx-auto mb-6" />
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-4">Our Mission</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            African &amp; Caribbean Stories.<br />Free Forever.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xl mx-auto">
            Zuva.TV is a free, ad-supported streaming home for the storytellers of Africa, the Caribbean, and the
            global diaspora.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Our story */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">Why Zuva Exists</h2>
          <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
            <p>
              Pan-African and Caribbean storytellers have always made vivid, culturally rich content — but
              mainstream streaming platforms were never built with them in mind. Distribution deals are scarce,
              discovery algorithms favour bigger markets, and monetisation tools rarely account for the realities
              of getting paid across African and Caribbean currencies and mobile money systems.
            </p>
            <p>
              Zuva.TV was built to close that gap. We give creators a platform that puts their stories in front of
              audiences who want them, keeps viewing free so no one is priced out, and pays creators through
              rails that actually work in their markets — no bank account in a foreign country required.
            </p>
            <p>
              The name "Zuva" means <em className="text-zinc-400">sun</em> in Shona — a small nod to the light we
              hope this platform brings to storytellers who have waited too long for their turn.
            </p>
          </div>
        </section>

        {/* Markets served */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">Markets We Serve</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MARKETS.map((m) => (
              <div key={m.name} className="bg-surface-200 border border-gold-400/10 rounded-xl p-4 flex items-start gap-3">
                <span className="text-gold-400 mt-0.5 shrink-0">›</span>
                <div>
                  <p className="text-white font-semibold text-sm">{m.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{m.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-5">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StepCard step="V" title="For Viewers">
              Watch as much as you want, whenever you want, at no cost. Zuva is ad-supported, so viewing stays
              free forever. If you love what a creator makes, you can send them a tip in Suns to support them
              directly.
            </StepCard>
            <StepCard step="C" title="For Creators">
              Upload your content and reach audiences who are hungry for it. Earn a share of advertising revenue
              on every view, plus direct tips from viewers in Suns. Get paid out in your local currency via
              Chimoney — no foreign bank account needed.
            </StepCard>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-surface-200 border border-gold-400/20 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to share your story?</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Join creators from across Africa and the Caribbean already building an audience — and an income — on
            Zuva.TV.
          </p>
          <Link
            href="/creator-signup"
            className="inline-block bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3.5 rounded-xl transition-all shadow-gold"
          >
            Become a Creator
          </Link>
        </section>

      </div>

      <SiteFooter />
    </div>
  );
}
