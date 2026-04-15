import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";

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

export const metadata: Metadata = {
  title:       "Zuva.TV — African & Caribbean Stories. Free Forever.",
  description: "Watch and support African and Caribbean creators. Tip with Suns, earn real money, cash out to mobile money. No subscription.",
  keywords:    ["African streaming", "Caribbean stories", "creator economy", "Nollywood", "African diaspora"],
};

export const viewport: Viewport = {
  themeColor:  "#000000",
  width:       "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-foreground min-h-screen`}>
        <Navbar />
        <main className="pt-14 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
