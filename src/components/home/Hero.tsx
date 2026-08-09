"use client";

import Image from "next/image";
import { Container } from "@/components/layout/container/Container";

interface HeroProps {
  companyName: string;
  tagline: string;
}

export function Hero({ companyName, tagline }: HeroProps) {
  const words = companyName.split(" ");

  return (
    <section className="relative flex h-screen min-h-[560px] items-center overflow-hidden bg-navy-950 py-24">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero/hunter.jpg"
          alt=""
          fill
          priority
          className="animate-kenburns object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.45)_100%)]" />
      </div>

      <div
        className="animate-fade-in-up absolute left-1/2 -translate-x-[62%]"
        style={{ animationDelay: "0ms", top: "clamp(5rem, 4rem + 3vw, 7rem)" }}
        aria-hidden="true"
      >
        <Image
          src="/logo/logo.png"
          alt=""
          width={280}
          height={82}
          priority
          className="w-auto object-contain"
          style={{ height: "clamp(2.25rem, 1.35rem + 3.5vw, 5rem)" }}
        />
      </div>

      <Container className="relative flex justify-center">
        <div className="mx-auto w-full max-w-xl px-4 text-center sm:px-6">
          <h1
            className="animate-fade-in-up font-editorial text-[clamp(2.25rem,1.6rem+2.6vw,4.25rem)] font-light uppercase leading-[1.15] tracking-[0.01em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
            style={{ animationDelay: "60ms" }}
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
            className="animate-fade-in-up mt-6 font-mono text-[clamp(0.8125rem,0.7rem+0.5vw,1.125rem)] font-medium uppercase tracking-[0.3em] text-white/60"
            style={{ animationDelay: "180ms" }}
          >
            Adventure, above &amp; beyond
          </p>

          <div
            className="animate-fade-in-up mx-auto h-px w-6 bg-white/20"
            style={{ animationDelay: "300ms", marginTop: "clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem)" }}
          />

          <p
            className="animate-fade-in-up mx-auto max-w-[22rem] text-[clamp(0.8125rem,0.75rem+0.3vw,0.9375rem)] font-light leading-loose tracking-wide text-white/60"
            style={{ animationDelay: "380ms", marginTop: "clamp(1.25rem, 1rem + 1vw, 2rem)" }}
          >
            {tagline}
          </p>
        </div>
      </Container>

      <div
        className="animate-fade-in-up absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 sm:bottom-8"
        style={{ animationDelay: "600ms" }}
        aria-hidden="true"
      >
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.4em] text-white/40">
          Scroll
        </span>
        <div className="relative h-8 w-px overflow-hidden bg-white/15 sm:h-10">
          <div className="animate-scroll-line absolute inset-x-0 top-0 h-1/2 bg-white/70" />
        </div>
      </div>

      <style jsx>{`
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

        @keyframes scrollLine {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }
        .animate-scroll-line {
          animation: scrollLine 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-kenburns,
          .animate-fade-in-up,
          .animate-scroll-line {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}