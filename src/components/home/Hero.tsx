"use client";

import Image from "next/image";
import { Container } from "@/components/layout/container/Container";

interface HeroProps {
  companyName: string;
  tagline: string;
}

export function Hero({ companyName, tagline }: HeroProps) {
  return (
    <section className="relative flex h-screen min-h-[640px] items-center overflow-hidden bg-navy-950">
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

      <Container className="relative flex justify-center">
        <div className="max-w-xl text-center">
          <p
            className="animate-fade-in-up mb-6 font-mono text-[0.625rem] font-medium uppercase tracking-[0.5em] text-white/50"
            style={{ animationDelay: "0ms" }}
          >
            {companyName}
          </p>

          <h1
            className="animate-fade-in-up font-editorial text-[clamp(2.25rem,1.6rem+2.6vw,4.25rem)] font-light uppercase leading-[1.15] tracking-[0.01em] text-white"
            style={{ animationDelay: "120ms" }}
          >
            Adventure,
            <br />
            above &amp; <span className="text-champagne-400">beyond</span>
          </h1>

          <div
            className="animate-fade-in-up mx-auto mt-9 h-px w-6 bg-white/20"
            style={{ animationDelay: "260ms" }}
          />

          <p
            className="animate-fade-in-up mx-auto mt-8 max-w-[22rem] text-[0.875rem] font-light leading-loose tracking-wide text-white/60"
            style={{ animationDelay: "340ms" }}
          >
            {tagline}
          </p>
        </div>
      </Container>

      <div
        className="animate-fade-in-up absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        style={{ animationDelay: "600ms" }}
        aria-hidden="true"
      >
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.4em] text-white/40">
          Scroll
        </span>
        <div className="relative h-10 w-px overflow-hidden bg-white/15">
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