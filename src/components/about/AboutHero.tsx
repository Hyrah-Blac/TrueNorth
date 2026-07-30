"use client";

import Image from "next/image";
import { Container } from "@/components/layout/container/Container";

export function AboutHero() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-navy-950 py-24 lg:py-0">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/aircraft/sign.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow object-cover"
          sizes="100vw"
        />

        {/* Same scrim stack as the destinations/homepage hero: top fade for
            the nav, bottom fade for the content, soft radial to darken
            behind the text block. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-navy-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/35 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_55%,rgba(9,21,33,0.45),transparent_70%)]" />
      </div>

      <Container className="relative flex justify-center">
        <div className="max-w-2xl text-center lg:max-w-4xl">
          <h1 className="font-editorial text-[clamp(2.25rem,1.6rem+2.6vw,4rem)] font-light uppercase leading-[1.1] tracking-[0.005em] text-white">
            Built around the mission,
            <br />
            not just the <span className="text-champagne-400">aircraft</span>
          </h1>

          <div className="mx-auto mt-8 h-px w-12 bg-white/20" />

          <p className="mx-auto mt-5 max-w-md text-[clamp(0.8125rem,0.8rem+0.15vw,0.9375rem)] leading-relaxed text-slate-200">
            A KCAA-certified charter operator based at Wilson Airport, flying business,
            government, NGO, safari, and medical evacuation missions across Kenya and East Africa.
          </p>
        </div>
      </Container>
    </section>
  );
}