import type { Metadata } from "next";
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
  return <SignInForm companyName={settings.companyName} />;
}
