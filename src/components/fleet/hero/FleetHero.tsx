"use client";

import Image from "next/image";
import { useId } from "react";
import { Container } from "@/components/layout/container/Container";
import { Reveal } from "@/components/shared/Reveal";

export function FleetHero() {
  const grainId = useId();

  return (
    <section className="relative flex min-h-[82svh] items-center overflow-hidden bg-navy-950 py-20 sm:py-24 lg:min-h-[85svh] lg:py-0">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero/phone3.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow object-cover lg:hidden"
          sizes="100vw"
        />
        <Image
          src="/images/hero/hunt.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow hidden object-cover lg:block"
          sizes="100vw"
        />

        {/* Same scrim stack as the homepage hero: top fade for the nav,
            bottom fade for the content, soft radial to darken behind
            the text block, plus a whisper of grain for a graded, filmic
            finish rather than a flat dark overlay. */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy-950/70 to-transparent sm:h-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/35 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_55%,rgba(9,21,33,0.45),transparent_70%)]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay"
          aria-hidden="true"
          focusable="false"
        >
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>
      </div>

      <Container className="relative flex justify-center px-6 sm:px-8">
        <div className="relative w-full max-w-xl text-center lg:max-w-4xl">
          <Reveal variant="fade-up">
            <h1 className="font-body text-[clamp(1.85rem,1.35rem+2.2vw,4rem)] font-light uppercase leading-[1.12] tracking-[-0.015em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
              Seven categories,
              <br />
              matched to the{" "}
              <span className="text-champagne-400 drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                mission
              </span>
            </h1>
          </Reveal>

          <Reveal variant="fade-in" delayMs={120}>
            <div className="mx-auto mt-6 h-px w-10 bg-white/25 sm:mt-8 sm:w-12" />
          </Reveal>

          <Reveal variant="fade-up" delayMs={200}>
            <p className="mx-auto mt-5 max-w-[20rem] text-[0.8125rem] leading-relaxed tracking-wide text-slate-200 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] sm:max-w-md sm:text-[clamp(0.8125rem,0.8rem+0.15vw,0.9375rem)]">
              Filter by category or passenger count, or submit a charter request and we&apos;ll
              recommend the right aircraft for your trip.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}