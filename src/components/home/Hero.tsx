"use client";

import Image from "next/image";
import { useId } from "react";
import { Container } from "@/components/layout/container/Container";

interface HeroProps {
  companyName: string;
  tagline: string;
}

export function Hero({ companyName }: HeroProps) {
  // Show the company name exactly as set in the admin settings.
  const words = companyName.trim().split(/\s+/);
  const grainId = useId();

  return (
    <section className="hero-section relative flex h-[calc(100vh-140px)] min-h-[480px] items-center overflow-hidden bg-navy-950 py-14 lg:h-[calc(100vh-150px)] lg:pb-16">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero/phone3.jpg"
          alt=""
          fill
          priority
          quality={90}
          className="animate-kenburns object-cover lg:hidden"
          sizes="100vw"
        />
        <Image
          src="/images/gallery/pix.jpg"
          alt=""
          fill
          priority
          quality={90}
          className="animate-kenburns hidden object-cover object-[50%_70%] lg:block"
          sizes="100vw"
        />
        {/* Light overlays only: the hero image is pre-graded (navy sky, bright jet),
            so we just add a soft top fade for the nav and a faint bottom fade. */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/45 via-transparent to-black/25" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay">
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>
      </div>

      <Container className="relative flex w-full justify-center lg:mt-[14vh]">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <div
            className="pointer-events-none absolute inset-x-[-10%] inset-y-[-15%] -z-10 bg-[radial-gradient(ellipse_65%_60%_at_50%_40%,rgba(4,10,26,0.4)_0%,transparent_72%)]"
            aria-hidden="true"
          />

          <h1
            className="animate-fade-in-up text-balance font-body text-[clamp(1.875rem,1.3rem+2.3vw,3.25rem)] font-light uppercase leading-[1.12] tracking-[0.01em] text-white [text-shadow:0_2px_24px_rgba(4,10,26,0.65),0_1px_2px_rgba(4,10,26,0.35)]"
            style={{
              animationDelay: "60ms",
            }}
          >
            {words.map((word, i) => (
              <span
                key={i}
                className={i === words.length - 1 ? "text-champagne-400 lg:text-champagne-300" : undefined}
              >
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p
            className="animate-fade-in-up font-mono text-[clamp(0.75rem,0.7rem+0.35vw,1rem)] font-light uppercase tracking-[0.34em] text-white/90 [text-shadow:0_1px_14px_rgba(4,10,26,0.7)]"
            style={{ animationDelay: "180ms", marginTop: "clamp(1rem, 0.8rem + 0.8vw, 1.75rem)" }}
          >
            Adventure, above &amp; beyond
          </p>
        </div>
      </Container>

      <style jsx>{`
        /* Mobile browsers resize their address/toolbar chrome as the
           page scrolls, which makes 100vh unstable there (the hero can
           visibly grow/shrink or clip content). 100dvh accounts for
           that and is used whenever the browser supports it; @supports
           keeps the original 100vh calc as the fallback everywhere
           else, so this only takes effect where it's actually safe. */
        @supports (height: 100dvh) {
          .hero-section {
            height: calc(100dvh - 140px);
          }

          @media (min-width: 1024px) {
            .hero-section {
              height: calc(100dvh - 150px);
            }
          }
        }

        @keyframes kenburns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          100% {
            transform: scale(1.05) translate(-0.5%, 0);
          }
        }
        .animate-kenburns {
          transform-origin: 50% 60%;
          animation: kenburns 40s ease-out forwards;
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-kenburns,
          .animate-fade-in-up {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}