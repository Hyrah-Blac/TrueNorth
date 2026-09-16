import "server-only";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings } from "@/lib/config/siteSettings";

export async function getOrganizationSchema(): Promise<Record<string, unknown>> {
  const settings = await getSiteSettings();

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#organization`,
    name: settings.companyName,
    description: settings.companyDescription || siteConfig.description,
    url: siteConfig.url,
    image: `${siteConfig.url}/images/gallery/sept.jpg`,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine1,
      addressLocality: settings.city,
      addressCountry: settings.country,
    },
    areaServed: ["Kenya", "East Africa"],
    priceRange: "$$$",
    ...(settings.socialLinks.length > 0 ? { sameAs: settings.socialLinks.map((link) => link.href) } : {}),
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
