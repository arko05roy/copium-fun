import type { Metadata } from "next";
import { Barlow_Condensed, Bricolage_Grotesque, DM_Mono, Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import { SiteNav } from "./components/site-nav";

const bricolage = Bricolage_Grotesque({
  variable: "--font-club-body",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-club-display",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-club-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const manrope = Manrope({ variable: "--font-fan-body", subsets: ["latin"], display: "swap" });
const barlow = Barlow_Condensed({ variable: "--font-fan-display", subsets: ["latin"], weight: ["500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "copium.fun",
  description: "Live sports predictions with friends, streaks, and prizes.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
        <body
          suppressHydrationWarning
          className={`${bricolage.variable} ${fraunces.variable} ${dmMono.variable} ${manrope.variable} ${barlow.variable} antialiased`}
        >
          <SiteNav />
          {children}
        </body>
      </Providers>
    </html>
  );
}
