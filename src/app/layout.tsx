import type { Metadata } from "next";
import { Poppins, Open_Sans, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

// UI-level headings — nav, cards, dashboard, buttons, body copy.
// Includes 800 (ExtraBold) since section headings across the site use
// font-extrabold for the bold/uppercase treatment — without loading this
// weight explicitly, browsers fake-bold the 700 cut instead of rendering
// the real ExtraBold glyphs.
const displayFont = Poppins({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

// Editorial headlines — hero, section titles, page headers.
const editorialFont = Poppins({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const bodyFont = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "600", "700"],
});

const dataFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-data",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "aircraft charter Kenya",
    "helicopter charter Nairobi",
    "private charter East Africa",
    "medevac Kenya",
    "safari air charter",
    "Wilson Airport charter",
  ],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${displayFont.variable} ${editorialFont.variable} ${bodyFont.variable} ${dataFont.variable}`}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}