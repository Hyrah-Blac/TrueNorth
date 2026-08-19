import type { Metadata } from "next";
import { Section, SectionGap } from "@/components/layout/section/Section";
import { DestinationsHero } from "@/components/destinations/DestinationsHero";
import { DestinationsExplorer } from "@/components/destinations/DestinationsExplorer";
import { JsonLd } from "@/components/shared/JsonLd";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { siteConfig } from "@/lib/config/site";

const description =
  "Charter routes across Kenya's safari, coastal, and urban destinations, plus regional East Africa routes to Tanzania, Rwanda, Uganda, and South Sudan.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: "Destinations",
    description,
    openGraph: { title: `Destinations | ${settings.companyName}`, description },
    twitter: { title: `Destinations | ${settings.companyName}`, description },
  };
}

export default async function DestinationsPage() {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Destinations", url: `${siteConfig.url}/destinations` },
        ])}
      />

      <DestinationsHero />

      <Section tone="slate" className="!pt-5 !pb-8 sm:!pt-6 sm:!pb-10">
        <DestinationsExplorer />
      </Section>
    </>
  );
}