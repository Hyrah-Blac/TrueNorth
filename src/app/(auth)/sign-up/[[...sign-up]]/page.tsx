import type { Metadata } from "next";
import { SignUpForm } from "./SignUpForm";
import { getSiteSettings } from "@/lib/config/siteSettings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: "Create Account",
    description: `Create a ${settings.companyName} account to request charters and track bookings.`,
  };
}

export default async function SignUpPage() {
  const settings = await getSiteSettings();
  return <SignUpForm companyName={settings.companyName} />;
}
