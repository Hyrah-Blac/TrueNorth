import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Section } from "@/components/layout/section/Section";
import { Container } from "@/components/layout/container/Container";
import { Button } from "@/components/shared/buttons/Button";
import { AircraftGallery } from "@/components/aircraft/gallery/AircraftGallery";
import { SpecStrip } from "@/components/aircraft/specifications/SpecStrip";
import { SpecificationsTable } from "@/components/aircraft/specifications/SpecificationsTable";
import { PerformanceBars } from "@/components/aircraft/specifications/PerformanceBars";
import { RecommendedMissions } from "@/components/aircraft/specifications/RecommendedMissions";
import { AmenitiesList } from "@/components/aircraft/amenities/AmenitiesList";
import { CompareButton } from "@/components/aircraft/compare/CompareButton";
import { CompareTray } from "@/components/aircraft/compare/CompareTray";
import { RelatedAircraft } from "@/components/fleet/carousel/RelatedAircraft";
import { JsonLd } from "@/components/shared/JsonLd";
import { getAircraftByIdOrSlug, getRelatedAircraft } from "@/features/aircraft/lib/getAircraft";
import { AIRCRAFT_CATEGORY_LABELS } from "@/database/constants/aircraft";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { siteConfig } from "@/lib/config/site";
export const revalidate = 300;

interface AircraftDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AircraftDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const aircraft = await getAircraftByIdOrSlug(id);

  if (!aircraft) return { title: "Aircraft Not Found" };

  const description = aircraft.tagline ?? aircraft.description.slice(0, 155);

  return {
    title: aircraft.name,
    description,
    alternates: { canonical: `${siteConfig.url}/fleet/${aircraft.slug}` },
    openGraph: {
      title: `${aircraft.name} | True North Charters`,
      description,
      images: aircraft.heroImage ? [{ url: aircraft.heroImage.url }] : undefined,
    },
    twitter: {
      title: `${aircraft.name} | True North Charters`,
      description,
      images: aircraft.heroImage ? [aircraft.heroImage.url] : undefined,
    },
  };
}

export default async function AircraftDetailPage({ params }: AircraftDetailPageProps) {
  const { id } = await params;
  const aircraft = await getAircraftByIdOrSlug(id);

  if (!aircraft) notFound();

  const related = await getRelatedAircraft(aircraft.category, aircraft._id);

  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Fleet", url: `${siteConfig.url}/fleet` },
          { name: aircraft.name, url: `${siteConfig.url}/fleet/${aircraft.slug}` },
        ])}
      />

      <div className="border-b border-slate-200 bg-slate-50 py-14 lg:py-16">
        <Container>
          <h1 className="font-display text-4xl font-semibold text-navy-900 lg:text-5xl">{aircraft.name}</h1>
          {aircraft.tagline ? <p className="mt-3 text-lg text-slate-600">{aircraft.tagline}</p> : null}
        </Container>
      </div>

      <Section tone="white" className="!pt-16">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.6fr,1fr]">
          <div>
            <AircraftGallery
              aircraftName={aircraft.name}
              exteriorImages={aircraft.exteriorImages}
              interiorImages={aircraft.interiorImages}
              cabinImages={aircraft.cabinImages}
            />

            <div className="mt-12">
              <h2 className="font-display text-2xl font-semibold text-navy-900">The aircraft</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-600">
                {aircraft.description}
              </p>
            </div>

            {aircraft.recommendedMissions.length > 0 ? (
              <div className="mt-12">
                <h2 className="font-display text-2xl font-semibold text-navy-900">Recommended for</h2>
                <div className="mt-5">
                  <RecommendedMissions missions={aircraft.recommendedMissions} />
                </div>
              </div>
            ) : null}

            {aircraft.amenities.length > 0 ? (
              <div className="mt-12">
                <h2 className="font-display text-2xl font-semibold text-navy-900">Amenities</h2>
                <div className="mt-5">
                  <AmenitiesList amenities={aircraft.amenities} />
                </div>
              </div>
            ) : null}

            <div className="mt-14 border-t border-slate-200 pt-10">
              <h2 className="font-display text-2xl font-semibold text-navy-900">Specifications</h2>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <PerformanceBars rangeNm={aircraft.rangeNm} cruisingSpeedKts={aircraft.cruisingSpeedKts} />
              </div>
              <div className="mt-6">
                <SpecificationsTable aircraft={aircraft} />
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-slate-200 p-7 shadow-soft lg:sticky lg:top-28">
            <div className="border-b border-slate-100 pb-6">
              <SpecStrip aircraft={aircraft} size="lg" />
            </div>

            <div className="mt-6 space-y-4">
           <Button
  href={`/request-charter?aircraft=${aircraft.slug}`}
  variant="primary"
  size="md"
  className="w-full"
>
  Request Charter
</Button>
              <CompareButton
                slug={aircraft.slug}
                name={aircraft.name}
                imageUrl={aircraft.heroImage?.url}
                categoryLabel={AIRCRAFT_CATEGORY_LABELS[aircraft.category]}
                variant="inline"
              />
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <CalendarCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                We&apos;ll confirm availability for your dates in the quote.
              </p>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <div className="mt-20 border-t border-slate-200 pt-14">
            <RelatedAircraft items={related} />
          </div>
        ) : null}
      </Section>
      <CompareTray />
    </>
  );
}