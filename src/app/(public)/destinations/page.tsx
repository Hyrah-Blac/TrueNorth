import type { Metadata } from "next";
import Image from "next/image";
import { Section, SectionGap } from "@/components/layout/section/Section";
import { Button } from "@/components/shared/buttons/Button";
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

      <Section tone="white" size="slim">
        <div className="relative flex min-h-[14rem] flex-col overflow-hidden rounded-2xl sm:min-h-[16rem] sm:flex-row">
          {/* Image — absolute on mobile (behind scrim), right column on desktop */}
          <div className="absolute inset-0 sm:relative sm:inset-auto sm:order-last sm:flex-1">
            <Image
              src="/images/destinations/nairobi.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 640px) 58vw, 100vw"
            />
            <div className="absolute inset-0 bg-navy-900/65 sm:hidden" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex w-full flex-col justify-center gap-5 bg-navy-900 p-7 sm:w-[42%] sm:shrink-0 sm:p-8 md:p-10">
            <div className="space-y-2.5">
              <h3 className="font-editorial text-lg font-light leading-snug tracking-tight text-white sm:text-xl">
                Don&apos;t see your destination?
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                If there&apos;s a runway or a helipad, we can fly it.
                Tell us your route and we&apos;ll quote it directly.
              </p>
            </div>
            <Button href="/request-charter" variant="champagne" size="sm">
              Request a Route
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}