import type { Metadata } from "next";
import { Section } from "@/components/layout/section/Section";
import { StorySection } from "@/components/about/StorySection";
import { AboutPhotoBand } from "@/components/about/AboutPhotoBand";
import { JsonLd } from "@/components/shared/JsonLd";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const description = `${settings.companyName} is a charter operator based at ${settings.addressLine1}, ${settings.city}, flying business, government, NGO, safari, and medical evacuation missions across Kenya and East Africa.`;
  const ogImage = { url: `${siteConfig.url}/images/gallery/sept.jpg`, alt: `${settings.companyName} aircraft over the Kenyan landscape` };

  return {
    title: "About",
    description,
    alternates: { canonical: `${siteConfig.url}/about` },
    openGraph: { title: `About | ${settings.companyName}`, description, images: [ogImage] },
    twitter: { title: `About | ${settings.companyName}`, description, images: [ogImage.url] },
  };
}

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "About", url: `${siteConfig.url}/about` },
        ])}
      />

      <Section tone="white" className="!pb-0">
        <StorySection />
      </Section>

      <AboutPhotoBand />
    </>
  );
}