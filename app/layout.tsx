import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, Martian_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { PALETTE } from "@/lib/palette";
import { SceneMount } from "@/components/SceneMount";
import { ScrollRuntime } from "@/components/ScrollRuntime";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  applicationName: SITE.name,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    siteName: SITE.legalName,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: PALETTE.void,
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrument.variable} ${martian.variable}`}>
      <body>
        <SceneMount />
        <ScrollRuntime />
        <div id="smooth-wrapper">
          <div id="smooth-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
