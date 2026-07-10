import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Mono, Fraunces } from "next/font/google";
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

export const metadata: Metadata = {
  title: "copium.fun",
  description: "Every moment is a market. Choose fan feed or agent desk.",
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
          className={`${bricolage.variable} ${fraunces.variable} ${dmMono.variable} antialiased`}
        >
          <SiteNav />
          {children}
        </body>
      </Providers>
    </html>
  );
}
