"use client";

import { Section } from "@/components/layout/section/Section";
import { services } from "@/content/services";

export function ServicesSection() {
  return (
    <Section
      tone="navy"
      size="slim"
      className="relative isolate overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-navy-950/90 before:via-navy-950/65 before:to-navy-950/25 before:content-['']"
      style={{
        backgroundImage: "url('/images/aircraft/Plane.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        {/* Text zone — left-aligned manifesto-style copy rather than
            centered, so it reads as a confident statement rather than
            a boxed-in banner. */}
        <div className="max-w-xl">
          <h2 className="font-display text-xl font-extrabold uppercase leading-[1.15] tracking-tight text-white sm:text-2xl lg:text-3xl">
            Every Mission. One Trusted Operator.
          </h2>
          <p className="mt-4 font-body text-xs leading-relaxed text-slate-300 lg:text-sm">
            Business meetings, government movement, safari charters, industrial access — Kenya&apos;s
            aviation needs run through one operator built for all of them.
          </p>
        </div>

        {/* Sector tags — recovers the "every sector" idea the old cards
            carried, without bringing back full cards. Trails to the
            right on wide screens, wraps below the text on mobile. */}
        <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
          {services.map((service) => (
            <span
              key={service.title}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-slate-200"
            >
              {service.title}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}