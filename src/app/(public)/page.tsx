import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FleetCategoriesSection } from "@/components/home/FleetCategoriesSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { getSiteSettings } from "@/lib/config/siteSettings";

const description =
  "Helicopters, turboprops, light jets, and medevac aircraft for business, government, NGO, safari, and emergency charter across Kenya and East Africa.";

export const metadata: Metadata = {
  title: "Aircraft Charter Across Kenya & East Africa",
  description,
  openGraph: { title: "Aircraft Charter Across Kenya & East Africa", description },
  twitter: { title: "Aircraft Charter Across Kenya & East Africa", description },
};

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Hero companyName={settings.companyName} tagline={settings.companyTagline} />
      <FleetCategoriesSection />
      <ServicesSection />
    </>
  );
}
