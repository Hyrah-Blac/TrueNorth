import type { Metadata } from "next";
import Image from "next/image";
import { FleetHero } from "@/components/fleet/hero/FleetHero";
import { FleetFilters } from "@/components/fleet/filters/FleetFilters";
import { FleetGrid } from "@/components/fleet/grid/FleetGrid";
import { Section, SectionGap } from "@/components/layout/section/Section";
import { Pagination } from "@/components/shared/Pagination";
import { JsonLd } from "@/components/shared/JsonLd";
import { CompareTray } from "@/components/aircraft/compare/CompareTray";
import { getAircraftList } from "@/features/aircraft/lib/getAircraft";
import { AIRCRAFT_CATEGORY_VALUES, type AircraftCategory } from "@/database/constants/aircraft";
import { buildPaginationMeta } from "@/utils/pagination";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `Browse ${settings.companyName}'s fleet of helicopters, turboprops, light jets, utility, medevac, safari, and cargo aircraft available for charter across Kenya and East Africa.`;

  return {
    title: "Fleet",
    description,
    openGraph: { title: `Fleet | ${settings.companyName}`, description },
    twitter: { title: `Fleet | ${settings.companyName}`, description },
  };
}

interface FleetPageProps {
  searchParams: Promise<{ category?: string; minPassengers?: string; page?: string }>;
}

export default async function FleetPage({ searchParams }: FleetPageProps) {
  const params = await searchParams;

  const category = AIRCRAFT_CATEGORY_VALUES.includes(params.category as AircraftCategory)
    ? (params.category as AircraftCategory)
    : undefined;
  const minPassengers = params.minPassengers ? Number(params.minPassengers) : undefined;
  const page = params.page ? Math.max(Number(params.page), 1) : 1;

  const { items, total, limit } = await getAircraftList({ category, minPassengers, page });
  const meta = buildPaginationMeta(total, page, limit);

  function buildHref(targetPage: number) {
    const search = new URLSearchParams();
    if (category) search.set("category", category);
    if (minPassengers) search.set("minPassengers", String(minPassengers));
    if (targetPage > 1) search.set("page", String(targetPage));
    const query = search.toString();
    return query ? `/fleet?${query}` : "/fleet";
  }

  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Fleet", url: `${siteConfig.url}/fleet` },
        ])}
      />
      <FleetHero />

      <Section tone="slate" className="!pt-0">
        <h2 className="sr-only">Available Aircraft</h2>
        <FleetFilters activeCategory={category} />

        <div className="mt-6">
          <FleetGrid items={items} />
          <Pagination page={meta.page} totalPages={meta.totalPages} buildHref={buildHref} />
        </div>
      </Section>

      <SectionGap size="sm" />

      <Section tone="white" size="slim" className="!pt-0">
        <div className="flex flex-col overflow-hidden rounded-2xl sm:min-h-[26rem] sm:flex-row">
          <div className="flex w-full flex-col justify-center gap-5 bg-gradient-to-r from-white to-slate-100 p-8 sm:w-[45%] sm:shrink-0 md:p-10 lg:p-12">
            <h3 className="font-body text-balance text-[clamp(0.875rem,0.75rem+0.6vw,1.125rem)] font-light uppercase leading-[1.15] tracking-[0.1em] text-navy-950">
              Not Sure Which Aircraft You Need?
            </h3>
            <p className="max-w-sm text-xs leading-relaxed text-slate-600">
              Every mission is different. Share your passengers, distance, and destination with
              our team, and we&apos;ll recommend the right aircraft from the fleet above.
            </p>
          </div>
          <div className="relative h-72 w-full sm:h-auto sm:flex-1">
            <Image
              src="/images/gallery/fleet.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 768px) 55vw, 100vw"
            />
          </div>
        </div>
      </Section>

      <CompareTray />
    </>
  );
}