import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Zuva.TV",
  description: "How Zuva.TV collects, uses, and protects your personal data. GDPR, CCPA, PIPEDA, LGPD, and POPIA compliant.",
};

const EFFECTIVE = "April 15, 2026";
const CONTACT   = "privacy@zuva.tv";

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

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-gold-400/10 border border-gold-400/25 text-gold-400 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
}

const TOC = [
  { href: "#who-we-are",       label: "1. Who We Are" },
  { href: "#information",      label: "2. Information We Collect" },
  { href: "#how-we-use",       label: "3. How We Use Your Data" },
  { href: "#third-parties",    label: "4. Third-Party Services" },
  { href: "#cookies",          label: "5. Cookies & Advertising" },
  { href: "#suns",             label: "6. Suns Virtual Currency" },
  { href: "#sharing",          label: "7. Data Sharing" },
  { href: "#retention",        label: "8. Data Retention" },
  { href: "#rights",           label: "9. Your Rights" },
  { href: "#international",    label: "10. International Transfers" },
  { href: "#security",         label: "11. Security & Breach Notification" },
  { href: "#children",         label: "12. Children's Privacy" },
  { href: "#changes",          label: "13. Changes to This Policy" },
  { href: "#contact",          label: "14. Contact Us" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-foreground">

      {/* Hero */}
      <div className="bg-surface-300 border-b border-gold-400/10">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold text-white mb-3">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm">
            Effective date: <span className="text-zinc-400">{EFFECTIVE}</span>
            &nbsp;·&nbsp;Applies to: zuva.tv and all Zuva mobile applications
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["GDPR", "CCPA/CPRA", "PIPEDA", "LGPD", "POPIA", "IAB TCF v2.3"].map((f) => (
              <Badge key={f} label={f} />
            ))}
          </div>
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
            Zuva.TV Inc. ("<strong className="text-white">Zuva</strong>", "<strong className="text-white">we</strong>",
            "<strong className="text-white">us</strong>") operates the zuva.tv website and associated mobile
            applications (collectively, the "<strong className="text-white">Platform</strong>"). This Privacy Policy
            explains what personal data we collect, why we collect it, how we share it, and the rights you have
            over your data. Please read this policy carefully. By using the Platform you acknowledge that you
            have read and understood this policy.
          </p>

          {/* 1 */}
          <Section id="who-we-are" title="1. Who We Are">
            <p>
              Zuva.TV Inc. is the data controller responsible for personal data collected through the Platform.
              We are incorporated under the laws of the Province of Ontario, Canada.
            </p>
            <Sub title="Data Protection Contact">
              <p>For all privacy-related inquiries, requests, or complaints:</p>
              <p>
                <strong className="text-white">Email:</strong>{" "}
                <a href={`mailto:${CONTACT}`} className="text-gold-400 hover:underline">{CONTACT}</a>
              </p>
              <p>Response time: within 30 days for general inquiries; 72 hours for breach notifications.</p>
            </Sub>
          </Section>

          {/* 2 */}
          <Section id="information" title="2. Information We Collect">
            <Sub title="2.1 Information You Provide Directly">
              <Ul items={[
                "Account credentials (email address, password hash managed by Clerk)",
                "Display name, profile picture, and creator bio",
                "Payment and payout details (processed by Chimoney — we do not store full card or bank numbers)",
                "Content you upload: video files, titles, descriptions, thumbnail images",
                "Communications you send us (support emails, feedback forms)",
              ]} />
            </Sub>
            <Sub title="2.2 Information Collected Automatically">
              <Ul items={[
                "IP address and approximate geolocation (country/region level)",
                "Browser type, operating system, device identifiers",
                "Pages visited, videos watched, watch duration, and completion events",
                "Referring URLs and search terms",
                "Authentication session tokens (managed by Clerk)",
                "Service-worker cache interactions (local device only, not transmitted)",
              ]} />
            </Sub>
            <Sub title="2.3 Information From Third Parties">
              <Ul items={[
                "Social login data (name, email, profile picture) if you sign in via Google or Apple through Clerk",
                "Payment processing status updates from Chimoney (transaction IDs, success/failure flags)",
                "Advertising interaction signals from Google AdSense (cookie-based, subject to your consent)",
              ]} />
            </Sub>
          </Section>

          {/* 3 */}
          <Section id="how-we-use" title="3. How We Use Your Data">
            <p>We process personal data only where we have a lawful basis to do so:</p>
            <div className="overflow-x-auto rounded-xl border border-gold-400/12 mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-200 text-zinc-500">
                    <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold">Lawful Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Provide and operate the Platform",          "Contract performance"],
                    ["Authenticate your account (Clerk)",         "Contract performance"],
                    ["Process Sun purchases and creator payouts", "Contract performance"],
                    ["Detect fraud and abuse",                    "Legitimate interests"],
                    ["Send transactional emails",                 "Contract performance"],
                    ["Send marketing emails (opt-in only)",       "Consent"],
                    ["Show personalised advertising (AdSense)",   "Consent (IAB TCF v2.3)"],
                    ["Improve the Platform (analytics)",          "Legitimate interests"],
                    ["Comply with legal obligations",             "Legal obligation"],
                  ].map(([purpose, basis]) => (
                    <tr key={purpose} className="hover:bg-surface-300/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-300">{purpose}</td>
                      <td className="px-4 py-3 text-zinc-500">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 4 */}
          <Section id="third-parties" title="4. Third-Party Services">
            <p>
              We work with the following sub-processors and service providers. Each link leads to their own
              privacy policy.
            </p>

            {([
              {
                name: "Clerk",
                role: "Authentication & identity management",
                data: "Email, password hash, session tokens, social-login profile data",
                location: "United States",
                policy: "https://clerk.com/privacy",
              },
              {
                name: "Chimoney",
                role: "Payment processing & creator payouts (Suns → mobile money / bank)",
                data: "Name, email, payout destination (phone number or bank details), transaction history",
                location: "United States / Canada",
                policy: "https://chimoney.io/privacy",
              },
              {
                name: "Supabase",
                role: "Hosted PostgreSQL database and file storage",
                data: "All platform data stored in our database (user records, Sun balances, video metadata)",
                location: "United States (AWS us-east-1)",
                policy: "https://supabase.com/privacy",
              },
              {
                name: "Google AdSense",
                role: "Advertising network — serves contextual and personalised ads",
                data: "Cookie identifiers, IP address, browsing behaviour (subject to consent)",
                location: "United States / EEA",
                policy: "https://policies.google.com/privacy",
              },
              {
                name: "Railway",
                role: "Backend application hosting and infrastructure",
                data: "Application logs (may contain IP addresses and request metadata)",
                location: "United States",
                policy: "https://railway.app/privacy",
              },
            ] as const).map((sp) => (
              <div key={sp.name} className="bg-surface-300 border border-gold-400/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="text-white font-semibold">{sp.name}</span>
                  <span className="text-zinc-600 text-xs shrink-0">{sp.location}</span>
                </div>
                <p className="text-zinc-500 text-xs mb-1"><span className="text-zinc-400">Role:</span> {sp.role}</p>
                <p className="text-zinc-500 text-xs mb-2"><span className="text-zinc-400">Data shared:</span> {sp.data}</p>
                <a href={sp.policy} target="_blank" rel="noopener noreferrer"
                  className="text-gold-400/70 hover:text-gold-400 text-xs transition-colors">
                  Privacy Policy →
                </a>
              </div>
            ))}
          </Section>

          {/* 5 */}
          <Section id="cookies" title="5. Cookies & Advertising">
            <Sub title="5.1 Cookies We Use">
              <Ul items={[
                "Session cookies — required for authentication (Clerk). Cannot be disabled without breaking sign-in.",
                "Preference cookies — store your theme, language, and feed preferences.",
                "Analytics cookies — aggregate usage metrics to improve the Platform.",
                "Advertising cookies — Google AdSense sets cookies to serve relevant ads and measure ad performance.",
              ]} />
            </Sub>

            <Sub title="5.2 Google AdSense & Third-Party Advertising">
              <p>
                We use Google AdSense to display advertisements on the Platform. Google and its partners
                use cookies to serve ads based on your prior visits to this website or other websites.
                Google&apos;s use of advertising cookies enables it and its partners to serve ads to you
                based on your visit to our site and/or other sites on the Internet.
              </p>
              <p>
                You may opt out of personalised advertising by visiting{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer"
                  className="text-gold-400 hover:underline">
                  adssettings.google.com
                </a>
                {" "}or by visiting{" "}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer"
                  className="text-gold-400 hover:underline">
                  aboutads.info/choices
                </a>
                . You may also opt out of a third-party vendor&apos;s use of cookies for personalised
                advertising by visiting{" "}
                <a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer"
                  className="text-gold-400 hover:underline">
                  networkadvertising.org/choices
                </a>.
              </p>
              <p>
                Even if you opt out of personalised ads, you may still see contextual (non-personalised)
                ads while using the Platform.
              </p>
            </Sub>

            <Sub title="5.3 IAB Transparency & Consent Framework (TCF v2.3)">
              <p>
                Zuva.TV participates in the IAB Europe Transparency &amp; Consent Framework ("<strong className="text-white">TCF</strong>")
                version 2.3. Our Consent Management Platform ("<strong className="text-white">CMP</strong>") collects
                and signals your consent choices to participating vendors in accordance with the TCF technical
                specifications. Our IAB TCF CMP ID is disclosed in our cookie banner.
              </p>
              <p>
                Under the TCF, vendors may only process your personal data for advertising purposes where
                a valid legal basis (consent or legitimate interest, where applicable) has been established.
                You may withdraw consent or object to legitimate interest processing at any time via the
                Privacy Preferences link in the site footer.
              </p>
            </Sub>

            <Sub title="5.4 Managing Cookies">
              <p>You can control cookies through:</p>
              <Ul items={[
                "Our cookie consent banner (shown on first visit)",
                "Your browser settings — most browsers allow you to block or delete cookies",
                "Google Ad Settings: adssettings.google.com",
                "NAI opt-out: networkadvertising.org/choices",
                "DAA opt-out: aboutads.info/choices",
                "European users: youronlinechoices.eu",
              ]} />
            </Sub>
          </Section>

          {/* 6 */}
          <Section id="suns" title="6. Suns Virtual Currency Data">
            <p>
              Suns are Zuva&apos;s in-platform virtual currency. Viewers purchase Suns and tip creators;
              creators redeem Suns for real-world payouts via Chimoney. We collect and store the following
              data in connection with Suns:
            </p>
            <Ul items={[
              "Sun balance for each user account",
              "Transaction history: purchases, tips sent, tips received, and cashouts (amounts, timestamps, counterparty user IDs)",
              "Fiat currency amounts at time of purchase (for tax reporting purposes)",
              "Chimoney payout records including destination, currency, and status",
            ]} />
            <p>
              Suns transaction data is retained for a minimum of 7 years to comply with financial recordkeeping
              requirements under applicable Canadian law and the laws of jurisdictions in which creators reside.
            </p>
            <p>
              Suns have no cash value for viewers and are non-refundable except where required by applicable
              consumer protection law. Creators&apos; accrued Sun balances represent a contractual obligation
              to make payouts, not a deposit of funds.
            </p>
          </Section>

          {/* 7 */}
          <Section id="sharing" title="7. Data Sharing">
            <p>We do not sell your personal data. We share personal data only in the following circumstances:</p>
            <Ul items={[
              "With sub-processors listed in Section 4 to operate the Platform",
              "With law enforcement or government authorities when required by valid legal process (court order, subpoena)",
              "To protect the rights, property, or safety of Zuva, our users, or the public",
              "In connection with a merger, acquisition, or sale of all or substantially all of our assets (you will be notified in advance)",
              "With your explicit consent for any other purpose not described in this policy",
            ]} />
          </Section>

          {/* 8 */}
          <Section id="retention" title="8. Data Retention">
            <div className="overflow-x-auto rounded-xl border border-gold-400/12 mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-200 text-zinc-500">
                    <th className="text-left px-4 py-3 font-semibold">Data Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Retention Period</th>
                    <th className="text-left px-4 py-3 font-semibold">Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Account profile data",         "Duration of account + 30 days after deletion", "Contract"],
                    ["Authentication logs",          "90 days",                                       "Security / fraud"],
                    ["Suns transaction history",     "7 years",                                       "Legal / financial"],
                    ["Payment records",              "7 years",                                       "Tax compliance"],
                    ["Video content",                "Until creator deletes or account closed",       "Contract"],
                    ["Support correspondence",       "3 years",                                       "Legitimate interests"],
                    ["Server / application logs",    "90 days",                                       "Security"],
                    ["Advertising consent records",  "5 years",                                       "GDPR Art. 7 / TCF"],
                    ["Deleted account data",         "30 days (recovery), then purged",               "GDPR Art. 17"],
                  ].map(([cat, period, basis]) => (
                    <tr key={cat} className="hover:bg-surface-300/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-300">{cat}</td>
                      <td className="px-4 py-3 text-zinc-400">{period}</td>
                      <td className="px-4 py-3 text-zinc-500">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 9 */}
          <Section id="rights" title="9. Your Rights">
            <p>
              Depending on your jurisdiction, you have some or all of the following rights. To exercise any
              right, email{" "}
              <a href={`mailto:${CONTACT}`} className="text-gold-400 hover:underline">{CONTACT}</a>.
              We will respond within 30 days (or sooner as required by law). We do not charge a fee for
              reasonable requests.
            </p>

            <Sub title="9.1 Rights Under GDPR (EU / UK / EEA)">
              <Ul items={[
                "Right of access (Art. 15) — obtain a copy of your personal data",
                "Right to rectification (Art. 16) — correct inaccurate data",
                "Right to erasure / 'right to be forgotten' (Art. 17) — request deletion of your data",
                "Right to restriction of processing (Art. 18)",
                "Right to data portability (Art. 20) — receive data in a structured, machine-readable format",
                "Right to object to processing (Art. 21) — including objecting to direct marketing",
                "Right to withdraw consent at any time without affecting prior processing",
                "Right to lodge a complaint with your local supervisory authority (e.g., ICO in the UK, DPC in Ireland)",
              ]} />
            </Sub>

            <Sub title="9.2 Rights Under CCPA / CPRA (California)">
              <Ul items={[
                "Right to know what personal information is collected, used, shared, or sold",
                "Right to delete personal information",
                "Right to opt out of sale or sharing of personal information — Note: Zuva does not sell personal information",
                "Right to correct inaccurate personal information",
                "Right to limit use and disclosure of sensitive personal information",
                "Right to non-discrimination for exercising your privacy rights",
              ]} />
              <p className="text-zinc-500 text-xs mt-2">
                To submit a CCPA request, email {CONTACT} with subject line &quot;CCPA Request&quot;.
                We will verify your identity before processing the request.
              </p>
            </Sub>

            <Sub title="9.3 Rights Under PIPEDA (Canada)">
              <Ul items={[
                "Right to access your personal information held by Zuva",
                "Right to challenge the accuracy and completeness of your information",
                "Right to withdraw consent for collection, use, or disclosure of personal information",
                "Right to complain to the Office of the Privacy Commissioner of Canada (OPC)",
              ]} />
            </Sub>

            <Sub title="9.4 Rights Under LGPD (Brazil)">
              <Ul items={[
                "Confirmation of whether we process your data",
                "Access to your personal data",
                "Correction of incomplete, inaccurate, or outdated data",
                "Anonymisation, blocking, or deletion of unnecessary data",
                "Data portability to another service provider",
                "Deletion of personal data processed with your consent",
                "Information about public and private entities with which we share data",
                "Right to revoke consent",
              ]} />
            </Sub>

            <Sub title="9.5 Rights Under POPIA (South Africa)">
              <Ul items={[
                "Right to access personal information Zuva holds about you",
                "Right to request correction or deletion of personal information",
                "Right to object to processing of personal information",
                "Right to submit a complaint to the Information Regulator of South Africa",
              ]} />
            </Sub>
          </Section>

          {/* 10 */}
          <Section id="international" title="10. International Transfers">
            <p>
              Zuva is based in Canada. Our sub-processors operate primarily in the United States. When we
              transfer personal data from the European Economic Area, United Kingdom, or Switzerland to
              countries that the European Commission has not recognised as providing an adequate level of
              protection, we rely on one or more of the following safeguards:
            </p>
            <Ul items={[
              "Standard Contractual Clauses (SCCs) approved by the European Commission",
              "The UK International Data Transfer Addendum to EU SCCs",
              "Sub-processor certification under equivalent data privacy frameworks",
            ]} />
            <p>
              Transfers from Brazil are conducted in accordance with LGPD Chapter V requirements.
              Transfers from South Africa are conducted in accordance with POPIA Section 72.
            </p>
          </Section>

          {/* 11 */}
          <Section id="security" title="11. Security & Breach Notification">
            <p>
              We implement appropriate technical and organisational measures to protect your personal data,
              including:
            </p>
            <Ul items={[
              "TLS 1.3 encryption for all data in transit",
              "Encryption at rest for database content (Supabase AES-256)",
              "Authentication handled by Clerk with industry-standard hashing",
              "Access controls: principle of least privilege for all staff and systems",
              "Regular security review of third-party dependencies",
            ]} />
            <Sub title="72-Hour Breach Notification Commitment">
              <p>
                In the event of a personal data breach that poses a risk to your rights and freedoms, we
                commit to:
              </p>
              <Ul items={[
                "Notifying the relevant supervisory authority within 72 hours of becoming aware of the breach (GDPR Art. 33)",
                "Notifying affected individuals without undue delay where the breach is likely to result in high risk (GDPR Art. 34)",
                "Notifying the Office of the Privacy Commissioner of Canada as soon as feasible (PIPEDA breach reporting obligations)",
                "Maintaining an internal breach register",
              ]} />
              <p>
                If you believe your Zuva account has been compromised, contact us immediately at{" "}
                <a href={`mailto:${CONTACT}`} className="text-gold-400 hover:underline">{CONTACT}</a>.
              </p>
            </Sub>
          </Section>

          {/* 12 */}
          <Section id="children" title="12. Children's Privacy">
            <p>
              The Platform is not directed to children under the age of 13. We do not knowingly collect
              personal data from children under 13 without verifiable parental consent. If you believe we
              have inadvertently collected data from a child under 13, please contact us at{" "}
              <a href={`mailto:${CONTACT}`} className="text-gold-400 hover:underline">{CONTACT}</a>{" "}
              and we will promptly delete the data.
            </p>
            <p>
              Users between 13 and 17 may use the Platform but are not eligible to participate in the
              creator payout program, which requires users to be at least 18 years of age and to complete
              identity verification through Chimoney.
            </p>
          </Section>

          {/* 13 */}
          <Section id="changes" title="13. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we will:
            </p>
            <Ul items={[
              "Update the effective date at the top of this page",
              "Post a notice on the Platform for at least 30 days",
              "Send an email notification to registered users for significant changes",
            ]} />
            <p>
              Your continued use of the Platform after the effective date of an updated policy constitutes
              your acceptance of the updated terms.
            </p>
          </Section>

          {/* 14 */}
          <Section id="contact" title="14. Contact Us">
            <p>For privacy requests, complaints, or general questions:</p>
            <div className="bg-surface-300 border border-gold-400/15 rounded-xl p-5 mt-2">
              <p className="text-white font-semibold mb-3">Zuva.TV Inc. — Privacy Office</p>
              <p className="text-zinc-400 text-sm">
                <span className="text-zinc-500">Email:</span>{" "}
                <a href={`mailto:${CONTACT}`} className="text-gold-400 hover:underline">{CONTACT}</a>
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                <span className="text-zinc-500">Response time:</span> 30 days (standard); 72 hours (data breach)
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                <span className="text-zinc-500">Governing jurisdiction:</span> Province of Ontario, Canada
              </p>
            </div>
            <p className="text-zinc-500 text-xs mt-4">
              If you are not satisfied with our response, you have the right to lodge a complaint with the
              relevant supervisory authority in your country (e.g., ICO in the UK, DPC in Ireland, CNIL in
              France, OPC in Canada, ANPD in Brazil, or the Information Regulator in South Africa).
            </p>
          </Section>

          {/* Cross-link */}
          <div className="pt-8 border-t border-white/5">
            <p className="text-zinc-600 text-xs">
              See also:{" "}
              <Link href="/terms" className="text-gold-400 hover:underline">Terms of Service</Link>
              {" · "}
              <a href={`mailto:${CONTACT}`} className="text-gold-400 hover:underline">Contact privacy@zuva.tv</a>
            </p>
          </div>

        </article>
      </div>

      <SiteFooter />
    </div>
  );
}
