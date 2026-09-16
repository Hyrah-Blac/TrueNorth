import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FleetCategoriesSection } from "@/components/home/FleetCategoriesSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { siteConfig } from "@/lib/config/site";

const description =
  "Helicopters, turboprops, light jets, and medevac aircraft for business, government, NGO, safari, and emergency charter across Kenya and East Africa.";
const ogImage = { url: `${siteConfig.url}/images/gallery/done.jpg`, alt: siteConfig.name };

export const metadata: Metadata = {
  title: "Aircraft Charter Across Kenya & East Africa",
  description,
  alternates: { canonical: siteConfig.url },
  openGraph: { title: "Aircraft Charter Across Kenya & East Africa", description, images: [ogImage] },
  twitter: { title: "Aircraft Charter Across Kenya & East Africa", description, images: [ogImage.url] },
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
