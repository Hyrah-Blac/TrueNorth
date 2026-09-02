import type { Metadata } from "next";
import { Section } from "@/components/layout/section/Section";
import { StorySection } from "@/components/about/StorySection";
import { AboutPhotoBand } from "@/components/about/AboutPhotoBand";
import { getSiteSettings } from "@/lib/config/siteSettings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const description = `${settings.companyName} is a KCAA-certified charter operator based at ${settings.addressLine1}, ${settings.city}, flying business, government, NGO, safari, and medical evacuation missions across Kenya and East Africa.`;

  return {
    title: "About",
    description,
    openGraph: { title: `About | ${settings.companyName}`, description },
    twitter: { title: `About | ${settings.companyName}`, description },
  };
}

export default function AboutPage() {
  return (
    <>
      <Section tone="white" className="!pb-0">
        <StorySection />
      </Section>

      <AboutPhotoBand />
    </>
  );
}