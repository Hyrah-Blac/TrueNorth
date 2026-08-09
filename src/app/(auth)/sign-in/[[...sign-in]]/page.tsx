import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "./SignInForm";
import { getSiteSettings } from "@/lib/config/siteSettings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: "Sign In",
    description: `Sign in to manage your ${settings.companyName} bookings, quotes, and account.`,
  };
}

export default async function SignInPage() {
  const settings = await getSiteSettings();
  return (
    // SignInForm reads the optional `redirect_url` query param via
    // useSearchParams() (e.g. when the AI concierge sends a signed-out
    // visitor here) — that hook requires a Suspense boundary so this
    // page can still prerender everything above it.
    <Suspense fallback={null}>
      <SignInForm companyName={settings.companyName} />
    </Suspense>
  );
}