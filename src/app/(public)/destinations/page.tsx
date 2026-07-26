import type { Metadata } from "next";
import Image from "next/image";
import { Section, SectionHeading } from "@/components/layout/section/Section";
import { Container } from "@/components/layout/container/Container";
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

      <div className="relative overflow-hidden border-b border-navy-800 bg-navy-950 py-20 lg:py-28">
        <Image
          src="/images/destinations/destinations-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40" />
        <Container className="relative">
          <p className="spec-readout mb-3 text-xs font-medium uppercase tracking-widest2 text-sky-400">
            Destinations
          </p>
          <h1 className="font-editorial text-4xl font-light tracking-tight text-white lg:text-5xl">
            Domestic reach, regional range
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            From bush airstrips near the Mara to cross-border business routes into Rwanda and
            Tanzania — if there&apos;s a runway, we can likely reach it. Don&apos;t see your
            destination below? Tell us the route in a charter request.
          </p>
        </Container>
      </div>

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

    </>
  );
}