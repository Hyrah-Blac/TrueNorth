import type { MetadataRoute } from "next";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { AIRCRAFT_STATUSES } from "@/database/constants/aircraft";
import { siteConfig } from "@/lib/config/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/fleet`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/destinations`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/request-charter`, changeFrequency: "monthly", priority: 0.8 },
  ];

  try {
    await connectToDatabase();
    const aircraft = await Aircraft.find({ status: AIRCRAFT_STATUSES.ACTIVE }).select("slug updatedAt");

    const aircraftRoutes: MetadataRoute.Sitemap = aircraft.map((item) => ({
      url: `${siteConfig.url}/fleet/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...aircraftRoutes];
  } catch {
    // If the database is unreachable at build/request time, still
    // return the static routes rather than failing the sitemap entirely.
    return staticRoutes;
  }
}
