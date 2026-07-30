import type { Metadata } from "next";
import { Section } from "@/components/layout/section/Section";
import { StorySection } from "@/components/about/StorySection";
import { AboutHero } from "@/components/about/AboutHero";

const description =
  "True North is a KCAA-certified charter operator based at Wilson Airport, Nairobi, flying business, government, NGO, safari, and medical evacuation missions across Kenya and East Africa.";

export const metadata: Metadata = {
  title: "About",
  description,
  openGraph: { title: "About | True North Charters", description },
  twitter: { title: "About | True North Charters", description },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />

      <Section tone="white">
        <StorySection />
      </Section>
    </>
  );
}