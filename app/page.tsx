import Link from "next/link";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import SiteFooter from "@/components/SiteFooter";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-black">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        {/* Ambient glow behind logo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 45%, rgba(243,123,13,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo — responsive: 280px mobile, 480px desktop */}
        <div className="mb-8 animate-fade-in">
          <img src="/zuva-logo.svg" alt="Zuva"
            className="block md:hidden"
            style={{ width: "280px", height: "auto", background: "transparent" }} />
          <img src="/zuva-logo.svg" alt="Zuva"
            className="hidden md:block"
            style={{ width: "480px", height: "auto", background: "transparent" }} />
        </div>

        {/* Tagline */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-2xl animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          African &amp; Caribbean Stories.{" "}
          <span className="gold-shimmer">Free Forever.</span>
        </h1>

        <p
          className="text-zinc-400 text-base sm:text-lg max-w-md mb-10 leading-relaxed animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Watch and support the creators who tell your stories. Tip with Suns.
          Cash out to mobile money. No subscription, ever.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3.5 rounded-full text-base transition-all shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5"
          >
            <ZuvaSunIcon size={20} />
            Watch Now
          </Link>
          <Link
            href="/sign-in"
            className="text-zinc-400 hover:text-gold-400 text-sm font-medium transition-colors underline-offset-4 hover:underline"
          >
            Sign In →
          </Link>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, body }) => (
            <div
              key={title}
              className="bg-surface-300 border border-gold-400/12 rounded-2xl p-6 text-center group hover:border-gold-400/30 transition-colors"
            >
              <div className="flex justify-center mb-4">{icon}</div>
              <h3 className="text-white font-bold text-base mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────── */}
      <section className="border-t border-gold-400/10 py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-zinc-500 text-sm mb-6">
            Trusted by creators across Africa, the UK, and the Caribbean
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-zinc-600 text-xs font-medium uppercase tracking-widest">
            {["Lagos", "London", "Kingston", "Accra", "Toronto", "Nairobi"].map((city) => (
              <span key={city}>{city}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}

// ── Feature card data ─────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
        <circle cx="20" cy="20" r="19" stroke="#f37b0d" strokeWidth="1.5" strokeOpacity="0.3" />
        <path d="M20 1C20 1 12 10 12 20s8 19 8 19" stroke="#f37b0d" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M20 1C20 1 28 10 28 20s-8 19-8 19" stroke="#f37b0d" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M1 20h38" stroke="#f37b0d" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M3 12h34M3 28h34" stroke="#f37b0d" strokeWidth="1" strokeOpacity="0.4" />
      </svg>
    ),
    title: "Bridges Two Worlds",
    body:  "Watch the creators who keep you connected to home — and support them directly.",
  },
  {
    icon: (
      <svg viewBox="0 0 56 56" width="40" height="40" fill="none">
        <path d="M 41 28 C 43 25.3 45.5 30.7 47.5 28 C 49.5 25.3 51.5 29 53 28" stroke="#f37b0d" strokeWidth="2.4" strokeLinecap="round"/>
        <path d="M 41 28 C 43 25.3 45.5 30.7 47.5 28 C 49.5 25.3 51.5 29 53 28" stroke="#f37b0d" strokeWidth="2.4" strokeLinecap="round" transform="rotate(90, 28, 28)"/>
        <path d="M 41 28 C 43 25.3 45.5 30.7 47.5 28 C 49.5 25.3 51.5 29 53 28" stroke="#f37b0d" strokeWidth="2.4" strokeLinecap="round" transform="rotate(180, 28, 28)"/>
        <path d="M 41 28 C 43 25.3 45.5 30.7 47.5 28 C 49.5 25.3 51.5 29 53 28" stroke="#f37b0d" strokeWidth="2.4" strokeLinecap="round" transform="rotate(270, 28, 28)"/>
        <circle cx="28" cy="28" r="10" fill="#f37b0d"/>
      </svg>
    ),
    title: "Earn Real Money",
    body:  "Fans tip creators with Suns. Creators cash out to M-Pesa, MTN Mobile Money, or bank. No minimum wait.",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
        <rect x="2" y="8" width="36" height="24" rx="4" stroke="#f37b0d" strokeWidth="1.5" strokeOpacity="0.6"/>
        <path d="M2 16h36" stroke="#f37b0d" strokeWidth="1.5" strokeOpacity="0.6"/>
        <rect x="7" y="22" width="10" height="3" rx="1.5" fill="#f37b0d" fillOpacity="0.5"/>
        <rect x="23" y="22" width="10" height="3" rx="1.5" fill="#f37b0d" fillOpacity="0.3"/>
      </svg>
    ),
    title: "Free Forever",
    body:  "No subscription, no paywalls. Zuva is free to watch. Support your favourite creators directly.",
  },
];
