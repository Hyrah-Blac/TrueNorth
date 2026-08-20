"use client";

import Image from "next/image";
import { useId } from "react";
import { Container } from "@/components/layout/container/Container";

interface HeroProps {
  companyName: string;
  tagline: string;
}

export function Hero({ companyName, tagline }: HeroProps) {
  const words = companyName.split(" ");
  const grainId = useId();

  return (
    <section className="hero-section relative flex h-[calc(100vh-140px)] min-h-[480px] items-center overflow-hidden bg-navy-950 py-14 lg:h-[calc(100vh-150px)] lg:py-16">
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
          src="/images/gallery/done.jpg"
          alt=""
          fill
          priority
          quality={90}
          className="animate-kenburns hidden object-cover lg:block"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/55 via-navy-950/15 to-navy-950/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(6,12,28,0.42)_100%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay">
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>
      </div>

      <Container className="relative flex justify-center">
        <div className="relative mx-auto flex w-full max-w-xl flex-col items-center px-4 text-center sm:px-6">
          <div
            className="pointer-events-none absolute inset-x-[-10%] inset-y-[-15%] -z-10 bg-[radial-gradient(ellipse_65%_60%_at_50%_40%,rgba(4,10,26,0.4)_0%,transparent_72%)]"
            aria-hidden="true"
          />

          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0ms" }}
          >
            <Image
              src="/logo/logo.png"
              alt=""
              width={280}
              height={82}
              priority
              className="w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
              style={{ height: "clamp(2rem, 1.3rem + 3vw, 4.25rem)" }}
            />
          </div>

          <h1
            className="animate-fade-in-up text-balance font-editorial text-[clamp(2.125rem,1.5rem+2.4vw,4rem)] font-light uppercase leading-[1.2] tracking-[0.01em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
            style={{
              animationDelay: "60ms",
              marginTop: "clamp(1.25rem, 0.9rem + 1.2vw, 2rem)",
            }}
          >
            {words.map((word, i) => (
              <span
                key={i}
                className={i === words.length - 1 ? "text-champagne-400" : undefined}
              >
                {word}
                {i < words.length - 1 ? (i === 0 ? "\u00A0" : " ") : ""}
              </span>
            ))}
          </h1>

          <p
            className="animate-fade-in-up mt-6 font-mono text-[clamp(0.6875rem,0.6rem+0.4vw,0.9375rem)] font-medium uppercase tracking-[0.28em] text-white/70 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
            style={{ animationDelay: "180ms" }}
          >
            Adventure, above &amp; beyond
          </p>

          <div
            className="animate-fade-in-up h-px w-6 bg-white/25"
            style={{ animationDelay: "300ms", marginTop: "clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem)" }}
          />

          <p
            className="animate-fade-in-up max-w-[20rem] text-balance text-[clamp(0.75rem,0.7rem+0.25vw,0.875rem)] font-light leading-loose tracking-wide text-white/70 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
            style={{ animationDelay: "380ms", marginTop: "clamp(1.25rem, 1rem + 1vw, 2rem)" }}
          >
            {tagline}
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
            transform: scale(1.12) translate(-1%, -1%);
          }
        }
        .animate-kenburns {
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