"use client";

import { Section } from "@/components/layout/section/Section";

export function ServicesSection() {
  return (
    <Section
      tone="navy"
      className="relative isolate flex min-h-[85vh] items-start justify-start overflow-hidden pt-4 sm:min-h-[95vh] sm:pt-6 lg:min-h-screen lg:pt-8"
      style={{
        backgroundImage: "url('/images/aircraft/Plane.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Left-aligned, pinned to the very top of the section — the
          empty band above the aircraft. */}
      <div className="flex max-w-3xl flex-col items-start px-0 text-left">
        <h2 className="font-display text-3xl font-normal leading-[1.15] tracking-tight text-black sm:text-5xl lg:text-6xl">
          Every Mission. One Trusted Operator.
        </h2>

        <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-black/55 sm:mt-6 sm:text-base">
          Business meetings, government movement, safari charters, industrial access — Kenya&apos;s
          aviation needs run through one operator built for all of them.
        </p>
      </div>
    </Section>
  );
}