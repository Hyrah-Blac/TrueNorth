import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/lib/config/site";
// Self-hosted via @fontsource (npm-distributed, bundled at build time)
// rather than next/font/google, which fetches font files from
// fonts.gstatic.com during the build. That network dependency is a
// genuine production liability on its own — a build in any
// network-restricted environment (this sandbox, an air-gapped CI
// runner, a firewalled build server) fails outright — not just a
// sandbox inconvenience. Same families, weights, and styles as
// before; only the delivery mechanism changed. See globals.css for
// where --font-display/--font-editorial/--font-body/--font-data now
// get their actual font-family values (previously generated
// dynamically by next/font's `.variable`).
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/300-italic.css";
import "@fontsource/poppins/400-italic.css";
import "@fontsource/poppins/500-italic.css";
import "@fontsource/poppins/600-italic.css";
import "@fontsource/raleway/300.css";
import "@fontsource/raleway/400.css";
import "@fontsource/raleway/600.css";
import "@fontsource/raleway/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/fraunces/300.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "./globals.css";

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
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}