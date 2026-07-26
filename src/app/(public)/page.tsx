import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FleetCategoriesSection } from "@/components/home/FleetCategoriesSection";
import { ServicesSection } from "@/components/home/ServicesSection";

const description =
  "Helicopters, turboprops, light jets, and medevac aircraft for business, government, NGO, safari, and emergency charter across Kenya and East Africa.";

export const metadata: Metadata = {
  title: "Aircraft Charter Across Kenya & East Africa",
  description,
  openGraph: { title: "Aircraft Charter Across Kenya & East Africa", description },
  twitter: { title: "Aircraft Charter Across Kenya & East Africa", description },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FleetCategoriesSection />
      <ServicesSection />
    </>
  );
}