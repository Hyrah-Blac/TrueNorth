"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { Button } from "@/components/shared/buttons/Button";

// Brand accent (see /components/navbar/Navbar.tsx for the full palette
// note) — champagne gold (--color-sky-500 / --color-sky-400, see
// variables.css) is used sparingly below, only for the "beyond"
// highlight. Kept deliberately minimal: one background photo, one
// gradient scrim, no particles/grain/decorative overlays — the goal is
// a clean, uncluttered first impression rather than a layered effect.

export function Hero() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const frameRequested = useRef(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionEnabled(!prefersReduced);
    if (prefersReduced) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (frameRequested.current) return;
      frameRequested.current = true;
      requestAnimationFrame(() => {
        const node = parallaxRef.current;
        if (node) {
          const xRatio = event.clientX / window.innerWidth - 0.5;
          const yRatio = event.clientY / window.innerHeight - 0.5;
          node.style.transform = `translate3d(${xRatio * -10}px, ${yRatio * -10}px, 0) scale(1.03)`;
        }
        frameRequested.current = false;
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <section className="relative flex h-screen min-h-[640px] items-center overflow-hidden bg-navy-950">
      <div className="absolute inset-0" aria-hidden="true">
        <div ref={parallaxRef} className="absolute inset-0 transition-transform duration-700 ease-out">
          <Image
            src="/images/hero/2292095.jpg"
            alt=""
            fill
            priority
            className={`object-cover ${motionEnabled ? "animate-zoom-slow" : ""}`}
            sizes="100vw"
          />
        </div>

        {/* Scrim: top fade for the transparent navbar, a stronger bottom
            fade for the button row, and a soft radial darkening centered
            on the text block itself — the aircraft's tail crosses right
            through that area, so the text needs a bit more contrast than
            a simple top-to-bottom gradient alone provides. */}
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-navy-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_55%,rgba(9,21,33,0.45),transparent_70%)]" />
      </div>

      <Container className="relative flex justify-center">
        <div className="max-w-2xl text-center">
          <p className="spec-readout mb-4 text-xs uppercase tracking-widest2 text-white/50">
            True North Charters
          </p>

          <h1 className="font-editorial text-4xl font-light uppercase leading-[1.15] tracking-[0.01em] text-white sm:text-5xl lg:text-6xl">
            Adventure,
            <br />
            above &amp; <span className="text-sky-400">beyond</span>
          </h1>

          <div className="mx-auto mt-6 h-px w-12 bg-white/20" />

          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-slate-200">
            Helicopters, turboprops, light jets, and medevac aircraft — dispatched across
            Kenya and East Africa.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/request-charter" variant="primary" size="lg">
              Request Charter
            </Button>
            <Button href="/fleet" variant="secondary" size="lg">
              Explore Fleet
            </Button>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/40 lg:flex">
        <span className="text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-8 w-px bg-white/40" />
      </div>
    </section>
  );
}