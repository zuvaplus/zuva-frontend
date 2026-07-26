import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Lilita_One } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import AppShell from "@/components/AppShell";
import ServiceWorkerRegistration from "../sw-register";
import { routing } from "@/i18n/routing";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const lilitaOne = Lilita_One({
  weight:   "400",
  subsets:  ["latin"],
  variable: "--font-lilita-one",
  display:  "swap",
});

// Server-side translation (getTranslations, not the client useTranslations
// hook) for the document <title>/<meta description> — these render before
// any client JS runs, so they must come from the RSC-side API.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title:       t("title"),
    description: t("description"),
    keywords:    ["African streaming", "Caribbean stories", "creator economy", "Nollywood", "African diaspora"],
    manifest:    "/manifest.json",
    appleWebApp: {
      capable:         true,
      title:           "Zuva",
      statusBarStyle:  "black-translucent",
    },
    icons: {
      icon:  [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
    },
  };
}

export const viewport: Viewport = {
  themeColor:        "#000000",
  width:             "device-width",
  initialScale:      1,
  minimumScale:      1,
  viewportFit:       "cover",  // respect iPhone notch / Dynamic Island
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for this locale's server components tree
  // (next-intl's getRequestConfig would otherwise only know the locale
  // from the request at render time).
  setRequestLocale(locale);

  const messages = await getMessages();

  // NEXT_PUBLIC_CLERK_SIGN_IN_URL etc. are static ("/sign-in") and know
  // nothing about locales — passed here instead so Clerk-driven redirects
  // (e.g. an expired session) land on /fr/sign-in for a French-locale user
  // rather than always bouncing through /en/sign-in.
  //
  // Fallback redirects point at the locale root, not a fixed page —
  // app/[locale]/page.tsx does a server-side role check right after
  // auth and sends creators to /creator-dashboard, everyone else to
  // /feed, so this one redirect target covers both roles correctly.
  return (
    <ClerkProvider
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
      signInFallbackRedirectUrl={`/${locale}`}
      signUpFallbackRedirectUrl={`/${locale}`}
    >
      <html lang={locale}>
        <body className={`${geistSans.variable} ${geistMono.variable} ${lilitaOne.variable} antialiased bg-black text-foreground min-h-screen`}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ServiceWorkerRegistration />
            <AppShell>{children}</AppShell>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
