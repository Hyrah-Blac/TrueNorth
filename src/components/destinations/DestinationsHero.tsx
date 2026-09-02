"use client";

import Image from "next/image";
import { useId } from "react";
import { Container } from "@/components/layout/container/Container";

export function DestinationsHero() {
  const grainId = useId();

  return (
    <section className="relative flex min-h-[82svh] items-center overflow-hidden bg-navy-950 py-20 sm:py-24 lg:min-h-[85svh] lg:py-0">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero/opp.jpg"
          alt=""
          fill
          priority
          quality={90}
          className="animate-zoom-slow object-cover lg:hidden"
          sizes="100vw"
        />
        <Image
          src="/images/destinations/pc.jpg"
          alt=""
          fill
          priority
          quality={90}
          className="animate-zoom-slow hidden object-cover lg:block"
          sizes="100vw"
        />

        {/* Same scrim stack as the homepage hero: top fade for the nav,
            bottom fade for the content, soft radial to darken behind
            the text block, plus a whisper of grain for a graded, filmic
            finish rather than a flat dark overlay. */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy-950/50 to-transparent sm:h-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-navy-950/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_55%,rgba(9,21,33,0.28),transparent_70%)]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.06] mix-blend-overlay"
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
        <div className="max-w-2xl text-center lg:max-w-4xl">
          <h1 className="font-body text-[clamp(2.25rem,1.6rem+2.6vw,4rem)] font-light uppercase leading-[1.12] tracking-[-0.015em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)]">
            Domestic reach,
            <br />
            regional{" "}
            <span className="text-champagne-400 drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)]">
              range
            </span>
          </h1>

          <div className="mx-auto mt-8 h-px w-12 bg-white/30" />

          <p className="mx-auto mt-5 max-w-md text-[clamp(0.8125rem,0.8rem+0.15vw,0.9375rem)] leading-relaxed text-slate-200 drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
            From bush airstrips near the Mara to cross-border routes into Rwanda and Tanzania —
            if there&apos;s a runway, we can likely reach it.
          </p>
        </div>
      </Container>
    </section>
  );
}