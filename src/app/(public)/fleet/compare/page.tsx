import type { Metadata } from "next";
import { CompareView } from "@/components/aircraft/compare/CompareView";
import { JsonLd } from "@/components/shared/JsonLd";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { siteConfig } from "@/lib/config/site";

const description =
  "Compare specifications, seating, range, and amenities side by side for any two or more aircraft in the fleet.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: "Compare Aircraft",
    description,
    alternates: { canonical: `${siteConfig.url}/fleet/compare` },
    openGraph: {
      title: `Compare Aircraft | ${settings.companyName}`,
      description,
      images: [{ url: `${siteConfig.url}/images/gallery/fleet.jpg`, alt: `${settings.companyName} fleet` }],
    },
    twitter: {
      title: `Compare Aircraft | ${settings.companyName}`,
      description,
      images: [`${siteConfig.url}/images/gallery/fleet.jpg`],
    },
  };
}

export default function ComparePage() {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Fleet", url: `${siteConfig.url}/fleet` },
          { name: "Compare", url: `${siteConfig.url}/fleet/compare` },
        ])}
      />

      <CompareView />
    </>
  );
}
