import type { Metadata } from "next";
import { Section } from "@/components/layout/section/Section";
import { Container } from "@/components/layout/container/Container";
import { StorySection } from "@/components/about/StorySection";

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
      <div className="relative overflow-hidden bg-slate-50 py-20 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_0%,rgba(15,42,67,0.05),transparent)]"
          aria-hidden="true"
        />

        <Container className="relative">
          <p className="spec-readout mb-4 text-xs font-medium uppercase tracking-widest2 text-sky-600">
            About True North
          </p>
          <h1 className="font-editorial max-w-2xl text-3xl font-light leading-[1.2] tracking-tight text-black lg:text-4xl">
            A charter operator built around the mission, not just the aircraft.
          </h1>
        </Container>
      </div>

      <Section tone="white">
        <StorySection />
      </Section>
    </>
  );
}