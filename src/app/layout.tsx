import type { Metadata } from "next";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/lib/config/site";

import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/800.css";

import "@fontsource/raleway/300.css";
import "@fontsource/raleway/400.css";
import "@fontsource/raleway/500.css";
import "@fontsource/raleway/600.css";
import "@fontsource/raleway/700.css";

import "@fontsource/ibm-plex-mono/300.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";

import "@fontsource/plus-jakarta-sans/300.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/fraunces/300.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/300-italic.css";
import "@fontsource/fraunces/400-italic.css";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading headers() here is deliberate, not incidental: middleware
  // (src/middleware.ts) mints a fresh CSP nonce on every request and
  // stamps it into the Content-Security-Policy response header. Next
  // only rewrites that same nonce into the inline scripts it renders
  // (hydration/flight-data payloads) when the route is rendered
  // dynamically, per-request. Any route that never touches a dynamic
  // API (headers/cookies/etc.) gets statically rendered once, baking
  // in whatever nonce was active at that render — which then mismatches
  // every subsequent request's CSP header and gets the inline script
  // blocked by the browser. Calling headers() in the root layout opts
  // every route in the app into dynamic rendering, so the nonce in the
  // markup always matches the nonce in that request's CSP header.
  await headers();

  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}