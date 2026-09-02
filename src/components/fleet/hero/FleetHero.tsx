"use client";

import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { Reveal } from "@/components/shared/Reveal";

export function FleetHero() {
  return (
    <section className="relative flex min-h-[82svh] items-center overflow-hidden bg-navy-950 py-20 sm:py-24 lg:min-h-[85svh] lg:py-0">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero/phone1.jpg"
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

        {/* A single flat wash, not the old layered scrim stack — just
            enough to keep white text readable over a bright sky or sand
            without darkening the image into an overlay-heavy look. */}
        <div className="absolute inset-0 bg-navy-950/30" />
      </div>

      <Container className="relative flex justify-center px-6 sm:px-8">
        <div className="relative w-full max-w-xl text-center lg:max-w-4xl">
          <Reveal variant="fade-up">
            <h1 className="font-body text-[clamp(1.85rem,1.35rem+2.2vw,4rem)] font-light uppercase leading-[1.12] tracking-[-0.015em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)]">
              Seven categories,
              <br />
              matched to the{" "}
              <span className="text-champagne-400 drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]">
                mission
              </span>
            </h1>
          </Reveal>

          <Reveal variant="fade-up" delayMs={200}>
            <p className="mx-auto mt-6 max-w-[20rem] text-[0.8125rem] leading-relaxed tracking-wide text-slate-100 drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] sm:mt-7 sm:max-w-md sm:text-[clamp(0.8125rem,0.8rem+0.15vw,0.9375rem)]">
              Filter by category, or submit a charter request and we&apos;ll recommend the right
              aircraft for your trip.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}