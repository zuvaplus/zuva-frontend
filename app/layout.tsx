import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Lilita_One } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegistration from "./sw-register";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const lilitaOne = Lilita_One({
  weight:   "400",
  subsets:  ["latin"],
  variable: "--font-lilita-one",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "Zuva.TV — African & Caribbean Stories. Free Forever.",
  description: "Watch and support African and Caribbean creators. Tip with Suns, earn real money, cash out to mobile money. No subscription.",
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

export const viewport: Viewport = {
  themeColor:        "#000000",
  width:             "device-width",
  initialScale:      1,
  minimumScale:      1,
  viewportFit:       "cover",  // respect iPhone notch / Dynamic Island
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} ${lilitaOne.variable} antialiased bg-black text-foreground min-h-screen`}>
          <ServiceWorkerRegistration />
          <Navbar />
          <main className="pt-14 pb-20 md:pb-0 min-h-screen">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
