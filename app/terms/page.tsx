import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service — Zuva.TV",
  description: "The terms governing your use of the Zuva.TV streaming platform.",
};

const LAST_UPDATED = "July 2026";
const LEGAL_CONTACT = "legal@zuva.tv";

// ── Reusable layout atoms ────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 pt-10 first:pt-0">
      <h2 className="text-xl font-bold text-gold-400 border-b border-gold-400/20 pb-3 mb-5">
        {title}
      </h2>
      <div className="space-y-4 text-zinc-300 leading-relaxed text-sm">
        {children}
      </div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <div className="text-zinc-400 space-y-2">{children}</div>
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-none space-y-1.5 pl-0">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-zinc-400">
          <span className="text-gold-400 mt-0.5 shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const TOC = [
  { href: "#acceptance",     label: "1. Acceptance of Terms" },
  { href: "#description",    label: "2. Description of Service" },
  { href: "#eligibility",    label: "3. User Eligibility" },
  { href: "#creator-licence", label: "4. Creator Content Licence" },
  { href: "#prohibited",     label: "5. Prohibited Content" },
  { href: "#suns",           label: "6. Suns Virtual Currency" },
  { href: "#copyright",      label: "7. Copyright & Takedown" },
  { href: "#ad-revenue",     label: "8. Ad Revenue Sharing" },
  { href: "#termination",    label: "9. Account Termination" },
  { href: "#warranties",     label: "10. Disclaimer of Warranties" },
  { href: "#liability",      label: "11. Limitation of Liability" },
  { href: "#governing-law",  label: "12. Governing Law" },
  { href: "#contact",        label: "13. Contact Us" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-foreground">

      {/* Hero */}
      <div className="bg-surface-300 border-b border-gold-400/10">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold text-white mb-3">Terms of Service</h1>
          <p className="text-zinc-500 text-sm">
            Last updated: <span className="text-zinc-400">{LAST_UPDATED}</span>
            &nbsp;·&nbsp;Applies to: zuva.tv and all Zuva mobile applications
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">

        {/* Sticky TOC — desktop */}
        <aside className="hidden lg:block shrink-0 w-52">
          <div className="sticky top-20">
            <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest mb-4">Contents</p>
            <nav className="space-y-1.5">
              {TOC.map(({ href, label }) => (
                <a key={href} href={href}
                  className="block text-zinc-600 hover:text-gold-400 text-xs transition-colors leading-snug">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Body */}
        <article className="flex-1 min-w-0 space-y-2">

          {/* Intro */}
          <p className="text-zinc-400 text-sm leading-relaxed pb-6 border-b border-white/5">
            These Terms of Service ("<strong className="text-white">Terms</strong>") govern your access to and use of
            the zuva.tv website and associated mobile applications (collectively, the "<strong className="text-white">Platform</strong>"),
            operated by Zuva.TV Inc. ("<strong className="text-white">Zuva</strong>", "<strong className="text-white">we</strong>",
            "<strong className="text-white">us</strong>"). By accessing or using the Platform, you agree to be bound
            by these Terms.
          </p>

          {/* 1 */}
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By creating an account, streaming content, uploading content as a creator, or otherwise using the
              Platform in any way, you acknowledge that you have read, understood, and agree to be bound by these
              Terms and our <Link href="/privacy" className="text-gold-400 hover:underline">Privacy Policy</Link>.
              If you do not agree to these Terms, you must not use the Platform.
            </p>
            <p>
              We may update these Terms from time to time. Continued use of the Platform after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </Section>

          {/* 2 */}
          <Section id="description" title="2. Description of Service">
            <p>
              Zuva is a free, ad-supported streaming platform dedicated to African and Caribbean storytelling. The
              Platform allows viewers to watch short-form and long-form video content at no cost, and allows
              creators to upload, publish, and monetise their content through advertising revenue and viewer tips
              ("<strong className="text-white">Suns</strong>").
            </p>
            <p>
              We do not charge viewers for access to content on the Platform. Some optional features, such as
              purchasing Suns to tip creators, involve real-money transactions as described in Section 6.
            </p>
          </Section>

          {/* 3 */}
          <Section id="eligibility" title="3. User Eligibility">
            <p>
              You must be at least <strong className="text-white">18 years of age</strong> to create an account and
              use the Platform. By registering, you represent and warrant that you meet this age requirement and
              that all information you provide is accurate and complete.
            </p>
            <p>
              We reserve the right to request proof of age or identity at any time and to suspend or terminate
              accounts that we reasonably believe belong to users under 18.
            </p>
          </Section>

          {/* 4 */}
          <Section id="creator-licence" title="4. Creator Content Licence">
            <Sub title="4.1 Ownership">
              <p>
                Creators retain full ownership of the content they upload to the Platform, including all associated
                intellectual property rights. Nothing in these Terms transfers ownership of your content to Zuva.
              </p>
            </Sub>
            <Sub title="4.2 Licence Grant">
              <p>
                By uploading content, you grant Zuva a <strong className="text-white">non-exclusive, worldwide,
                royalty-free licence</strong> to host, stream, reproduce, distribute, publicly perform, and display
                your content on the Platform, and to use your content (including thumbnails, titles, and clips) for
                the purpose of promoting the Platform and your content across Zuva's properties and marketing
                channels.
              </p>
              <p>
                This licence continues until you delete the content or close your account, subject to a reasonable
                period for removal from caches and backups.
              </p>
            </Sub>
            <Sub title="4.3 Creator Warranties">
              <p>
                You represent that you own or have obtained all necessary rights, licences, and permissions to
                upload your content and grant the licence above, and that your content does not infringe the
                intellectual property, privacy, or other rights of any third party.
              </p>
            </Sub>
          </Section>

          {/* 5 */}
          <Section id="prohibited" title="5. Prohibited Content">
            <p>The following categories of content are strictly prohibited on the Platform:</p>
            <Ul items={[
              "Hate speech — content that attacks, demeans, or incites violence against individuals or groups based on race, ethnicity, national origin, religion, disability, gender, sexual orientation, or similar characteristics",
              "Adult content — sexually explicit material, pornography, or content primarily intended to sexually gratify",
              "Violence — graphic violence, gore, content that glorifies or incites violence, or depicts real-world harm for shock value",
              "Copyright infringement — content that infringes the copyright, trademark, or other intellectual property rights of a third party",
              "Content that promotes illegal activity, terrorism, self-harm, or exploitation of minors",
              "Spam, scams, or deliberately misleading or fraudulent content",
            ]} />
            <p>
              We reserve the right to remove any content that violates these Terms and to suspend or terminate the
              accounts of repeat offenders, at our sole discretion.
            </p>
          </Section>

          {/* 6 */}
          <Section id="suns" title="6. Suns Virtual Currency">
            <p>
              Suns are Zuva's in-platform virtual currency, used by viewers to tip creators. The following terms
              apply to Suns:
            </p>
            <Ul items={[
              "Suns are not real currency and hold no monetary value outside the Platform",
              "Suns purchased by viewers are non-refundable, except where required by applicable consumer protection law",
              "Suns have no cash value to viewers and cannot be redeemed, exchanged, or transferred by viewers",
              "Creators may accrue Suns from tips and redeem them for real-world payouts solely through Zuva's creator payout programme (currently powered by Chimoney), subject to minimum payout thresholds and applicable fees",
              "Zuva reserves the right to adjust the Suns exchange rate, payout thresholds, and payout programme terms at its discretion, with notice to affected creators",
            ]} />
          </Section>

          {/* 7 */}
          <Section id="copyright" title="7. Copyright & Takedown Process">
            <p>
              Zuva respects intellectual property rights and complies with the{" "}
              <strong className="text-white">Notice-and-Notice regime</strong> under Canada's{" "}
              <em>Copyright Act</em>. If you believe content on the Platform infringes your copyright, you may
              submit a takedown request.
            </p>
            <Sub title="How to Submit a Notice">
              <p>Send a written notice to <a href={`mailto:${LEGAL_CONTACT}`} className="text-gold-400 hover:underline">{LEGAL_CONTACT}</a> including:</p>
              <Ul items={[
                "Identification of the copyrighted work claimed to be infringed",
                "The location (URL) of the allegedly infringing content on the Platform",
                "Your contact information (name, address, email, phone number)",
                "A statement that you have a good-faith belief the use is unauthorised",
                "A statement, made under penalty of perjury, that the notice is accurate and that you are the copyright owner or authorised to act on their behalf",
              ]} />
            </Sub>
            <Sub title="Our Process">
              <p>
                Upon receiving a valid notice, we will forward it to the user who posted the content in accordance
                with the Notice-and-Notice regime and retain records as required by law. We may remove or disable
                access to content in response to a valid notice at our discretion, and may terminate accounts of
                repeat infringers.
              </p>
            </Sub>
          </Section>

          {/* 8 */}
          <Section id="ad-revenue" title="8. Ad Revenue Sharing">
            <p>
              Zuva shares advertising revenue generated from views of creator content with the creators who upload
              that content. Specific revenue share percentages, eligibility thresholds, and payout schedules for
              the ad revenue sharing programme are{" "}
              <strong className="text-white">to be confirmed</strong> and will be published separately as the
              programme rolls out. This section will be updated once final terms are finalised.
            </p>
          </Section>

          {/* 9 */}
          <Section id="termination" title="9. Account Termination">
            <p>
              You may close your account at any time through your account settings. We reserve the right to
              suspend or terminate your account, with or without notice, if we reasonably believe you have:
            </p>
            <Ul items={[
              "Violated these Terms or our content policies",
              "Uploaded or distributed prohibited content",
              "Engaged in fraudulent, abusive, or illegal activity on the Platform",
              "Provided false information during registration",
            ]} />
            <p>
              Upon termination, your right to use the Platform ceases immediately. Provisions of these Terms that
              by their nature should survive termination (including ownership, disclaimers, and limitation of
              liability) will survive.
            </p>
          </Section>

          {/* 10 */}
          <Section id="warranties" title="10. Disclaimer of Warranties">
            <p>
              The Platform is provided "<strong className="text-white">as is</strong>" and "<strong className="text-white">as
              available</strong>" without warranties of any kind, whether express or implied, including but not
              limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement,
              or that the Platform will be uninterrupted, secure, or error-free.
            </p>
            <p>
              Zuva does not warrant the accuracy, completeness, or reliability of any content, advertising, or
              third-party services accessible through the Platform.
            </p>
          </Section>

          {/* 11 */}
          <Section id="liability" title="11. Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable law, Zuva.TV Inc., its officers, directors, employees,
              and agents will not be liable for any indirect, incidental, special, consequential, or punitive
              damages, or any loss of profits, revenue, data, or goodwill, arising out of or related to your use
              of the Platform, even if advised of the possibility of such damages.
            </p>
            <p>
              In no event will Zuva's total aggregate liability arising out of or relating to these Terms or the
              Platform exceed the greater of (a) the amount you paid to Zuva in the twelve months preceding the
              claim, or (b) CAD $100.
            </p>
          </Section>

          {/* 12 */}
          <Section id="governing-law" title="12. Governing Law">
            <p>
              These Terms and any dispute arising out of or related to them or the Platform will be governed by
              and construed in accordance with the laws of the{" "}
              <strong className="text-white">Province of Ontario, Canada</strong>, without regard to its conflict
              of laws principles. You agree to submit to the exclusive jurisdiction of the courts located in
              Ontario, Canada for the resolution of any disputes.
            </p>
          </Section>

          {/* 13 */}
          <Section id="contact" title="13. Contact Us">
            <p>For questions about these Terms, or to submit a copyright takedown notice:</p>
            <div className="bg-surface-300 border border-gold-400/15 rounded-xl p-5 mt-2">
              <p className="text-white font-semibold mb-3">Zuva.TV Inc. — Legal</p>
              <p className="text-zinc-400 text-sm">
                <span className="text-zinc-500">Email:</span>{" "}
                <a href={`mailto:${LEGAL_CONTACT}`} className="text-gold-400 hover:underline">{LEGAL_CONTACT}</a>
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                <span className="text-zinc-500">Governing jurisdiction:</span> Province of Ontario, Canada
              </p>
            </div>
          </Section>

          {/* Cross-link */}
          <div className="pt-8 border-t border-white/5">
            <p className="text-zinc-600 text-xs">
              See also:{" "}
              <Link href="/privacy" className="text-gold-400 hover:underline">Privacy Policy</Link>
              {" · "}
              <a href={`mailto:${LEGAL_CONTACT}`} className="text-gold-400 hover:underline">Contact legal@zuva.tv</a>
            </p>
          </div>

        </article>
      </div>

      <SiteFooter />
    </div>
  );
}
