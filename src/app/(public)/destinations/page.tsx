import type { Metadata } from "next";
import Image from "next/image";
import { Section, SectionGap, SectionHeading } from "@/components/layout/section/Section";
import { Button } from "@/components/shared/buttons/Button";
import { DestinationsHero } from "@/components/destinations/DestinationsHero";
import { DestinationsExplorer } from "@/components/destinations/DestinationsExplorer";
import { RouteMapPlaceholder } from "@/components/destinations/RouteMapPlaceholder";
import { JsonLd } from "@/components/shared/JsonLd";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { siteConfig } from "@/lib/config/site";

const description =
  "Charter routes across Kenya's safari, coastal, and urban destinations, plus regional East Africa routes to Tanzania, Rwanda, Uganda, and South Sudan.";

export const metadata: Metadata = {
  title: "Destinations",
  description,
  openGraph: { title: "Destinations | True North Charters", description },
  twitter: { title: "Destinations | True North Charters", description },
};

export default function DestinationsPage() {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Destinations", url: `${siteConfig.url}/destinations` },
        ])}
      />

      <DestinationsHero />

      <Section tone="white">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr,1.3fr] lg:items-center">
          <SectionHeading
            eyebrow="Route Network"
            title="Flown from Wilson Airport, Nairobi"
            description="Every route below is flown from our Nairobi base. Flight times are approximate and vary by aircraft type."
          />
          <RouteMapPlaceholder />
        </div>
      </Section>

      <Section tone="slate" className="!pt-0">
        <DestinationsExplorer />
      </Section>

      <SectionGap size="lg" />

      <Section tone="white" size="slim">
        <div className="flex flex-col overflow-hidden rounded-2xl sm:min-h-[18rem] sm:flex-row">
          <div className="flex w-full flex-col justify-center gap-5 bg-gradient-to-r from-white to-slate-100 p-8 sm:w-[45%] sm:shrink-0 md:p-10 lg:p-12">
            <h3 className="font-display text-sm font-semibold text-navy-900 sm:text-base">
              Don&apos;t See Your Destination?
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              If there&apos;s a runway or a helipad, we can likely fly it. Tell us the route and
              we&apos;ll quote it directly.
            </p>
            <div>
              <Button href="/request-charter" variant="blue" size="md">
                Request a Route
              </Button>
            </div>
          </div>
          <div className="relative h-56 w-full sm:h-auto sm:flex-1">
            <Image
              src="/images/destinations/nairobi.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 768px) 55vw, 100vw"
            />
          </div>
        </div>
      </Section>
    </>
  );
}