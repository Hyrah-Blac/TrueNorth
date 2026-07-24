import type { Metadata } from "next";
import { FleetHero } from "@/components/fleet/hero/FleetHero";
import { FleetFilters } from "@/components/fleet/filters/FleetFilters";
import { FleetGrid } from "@/components/fleet/grid/FleetGrid";
import { Section } from "@/components/layout/section/Section";
import { Pagination } from "@/components/shared/Pagination";
import { JsonLd } from "@/components/shared/JsonLd";
import { CompareTray } from "@/components/aircraft/compare/CompareTray";
import { getAircraftList } from "@/features/aircraft/lib/getAircraft";
import { AIRCRAFT_CATEGORY_VALUES, type AircraftCategory } from "@/database/constants/aircraft";
import { buildPaginationMeta } from "@/utils/pagination";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { siteConfig } from "@/lib/config/site";

const description =
  "Browse True North's fleet of helicopters, turboprops, light jets, utility, medevac, safari, and cargo aircraft available for charter across Kenya and East Africa.";

export const metadata: Metadata = {
  title: "Fleet",
  description,
  openGraph: { title: "Fleet | True North Charters", description },
  twitter: { title: "Fleet | True North Charters", description },
};

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
      <Section tone="white" className="!pt-12">
        <h2 className="sr-only">Available Aircraft</h2>
        <FleetFilters activeCategory={category} />
        <div className="mt-10">
          <FleetGrid items={items} />
          <Pagination page={meta.page} totalPages={meta.totalPages} buildHref={buildHref} />
        </div>
      </Section>
      <CompareTray />
    </>
  );
}
