"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { Button } from "@/components/shared/buttons/Button";

// Brand accents (see /components/navbar/Navbar.tsx for the full palette
// note) — yellow (#F0C24B) is the primary accent used below for the
// "compromise" highlight and the ambient particles/lines. Tailwind needs
// the literal hex in each class, so it's not pulled from a shared constant.

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
          node.style.transform = `translate3d(${xRatio * -14}px, ${yRatio * -14}px, 0) scale(1.04)`;
        }
        frameRequested.current = false;
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <section className="relative flex h-[100svh] min-h-[640px] items-center overflow-hidden bg-navy-950 pb-16">
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

        <div className="absolute inset-0 overflow-hidden opacity-40 mix-blend-screen">
          <div
            className={`absolute -left-1/4 top-[15%] h-40 w-[70%] rounded-full bg-white/20 blur-3xl ${
              motionEnabled ? "animate-[drift_50s_linear_infinite]" : ""
            }`}
          />
          <div
            className={`absolute -right-1/4 top-[55%] h-32 w-[60%] rounded-full bg-white/10 blur-3xl ${
              motionEnabled ? "animate-[drift-reverse_65s_linear_infinite]" : ""
            }`}
          />
        </div>

        <div className="absolute inset-0">
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className={`absolute h-1 w-1 rounded-full bg-[#F0C24B]/40 ${motionEnabled ? "animate-pulse" : ""}`}
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${4 + (i % 5)}s`,
              }}
            />
          ))}
        </div>

        <svg
          className="absolute inset-0 h-full w-full opacity-[0.12]"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <path
            d="M-50 420 C 200 380, 380 460, 620 360 S 1000 240, 1260 300"
            stroke="#F0C24B"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M-50 520 C 250 500, 460 560, 700 480 S 1040 380, 1260 430"
            stroke="#F0C24B"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Scrim reduced across the board so the background photo reads
            clearly; kept only a light top gradient so the transparent
            navbar stays legible over bright sky or aircraft, and a soft
            bottom gradient so the text block still has contrast. */}
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#091521]/70 via-[#091521]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/55 via-navy-950/20 to-transparent" />
      </div>

      <Container className="relative flex justify-center">
        <div className="max-w-2xl animate-fade-up-editorial text-center">
          <h1 className="font-editorial text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Private aviation,
            <br />
            without <span className="text-[#F0C24B]">compromise</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-300">
            Helicopters, turboprops, light jets, and medevac aircraft — dispatched across
            Kenya and East Africa for business, government, NGO, safari, and emergency work.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <Button href="/request-charter" variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" weight="thin" />}>
              Request Charter
            </Button>
            <Button href="/fleet" variant="secondary" size="lg">
              Explore Fleet
            </Button>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/50 lg:flex">
        <span className="text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-white/60 to-transparent" />
      </div>
    </section>
  );
}