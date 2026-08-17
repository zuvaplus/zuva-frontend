import type { Metadata } from "next";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — Zuva.TV",
  description: "Get in touch with the Zuva.TV team.",
};

const GENERAL_EMAIL = "hello@zuva.tv";
const ADVERTISER_EMAIL = "hello@zuva.tv";

// Minimal static contact page — mailto-based, no form/backend, matching
// the About/Terms/Privacy pages' pattern of simple static content rather
// than a full page-builder. Exists so the footer's Contact Us / Contact
// Sales links (see Footer.tsx) have a real destination instead of a
// dead link. ?type=advertiser only changes the heading/copy/email
// destination shown — same page, no server-side branching needed.
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const isAdvertiser = type === "advertiser";
  const email = isAdvertiser ? ADVERTISER_EMAIL : GENERAL_EMAIL;

  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center mx-auto mb-6">
          <Mail size={24} className="text-gold-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          {isAdvertiser ? "Contact Sales" : "Contact Us"}
        </h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-8">
          {isAdvertiser
            ? "Questions about advertising on Zuva? Our team can help with campaigns, pricing, and media kits."
            : "Have a question, feedback, or just want to say hello? We'd love to hear from you."}
        </p>
        <a
          href={`mailto:${email}`}
          className="inline-block bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3.5 rounded-xl transition-all shadow-gold"
        >
          {email}
        </a>
      </div>
    </div>
  );
}
