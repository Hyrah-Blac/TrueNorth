"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Section, SectionHeading } from "@/components/layout/section/Section";
import { fleetCategories } from "@/content/fleet-categories";

// The one category we have real photography for gets the large image
// treatment; the rest use a refined dark gradient card so nothing looks
// like a placeholder pretending to be a photo.
const categoryImages: Partial<Record<string, string>> = {
  helicopter: "/images/aircraft/Heli.jpg",
};

export function FleetCategoriesSection() {
  return (
    <Section tone="white" className="relative z-10 -mt-[25vh] rounded-t-3xl shadow-lifted">
      <div className="-mt-4 flex flex-col gap-8 lg:-mt-6 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <SectionHeading
          eyebrow="The Fleet"
          title="Seven categories, one operator"
          description="We don't fly one type of aircraft for every mission. Each category below is matched to a different kind of trip — tell us the mission and we'll recommend the aircraft."
        />
        <Link
          href="/fleet"
          className="group inline-flex shrink-0 items-center gap-2 self-start border-b border-slate-300 pb-1 text-xs font-medium uppercase tracking-[0.12em] text-navy-900 lg:mt-[3.25rem]"
        >
          View full fleet
          <ArrowUpRight className="h-4 w-4 text-sky-600" weight="thin" />
        </Link>
      </div>

      <div className="mt-16 flex flex-col gap-6">
        {fleetCategories.map((item) => {
          const image = categoryImages[item.category];
          return (
            <Link
              key={item.category}
              href={`/fleet?category=${item.category}`}
              className="relative flex min-h-[13rem] flex-row overflow-hidden sm:min-h-[16rem] md:min-h-[20rem] lg:min-h-[22rem]"
            >
              {/* Text panel — carries the tint. This is the side without a
                  real photo behind it, so the color lives here instead of
                  standing in as a fake image placeholder. Width narrows on
                  small screens so the photo side never gets crowded out. */}
              <div className="flex w-1/2 shrink-0 flex-col justify-between bg-slate-100 p-4 sm:w-[45%] sm:p-6 md:p-10 lg:w-[45%] lg:p-12">
                <div>
                  <span className="spec-readout text-[0.5rem] font-medium uppercase tracking-[0.12em] text-sky-600 sm:text-[0.625rem] sm:tracking-[0.16em] md:text-[0.6875rem]">
                    {item.shortLabel}
                  </span>
                  <div className="mt-2 h-px w-6 bg-slate-300 sm:mt-3 sm:w-8" />
                  <h3 className="mt-2 font-display text-base font-semibold leading-[1.15] tracking-tight text-navy-900 sm:mt-3 sm:text-xl md:mt-4 md:text-2xl lg:text-[1.75rem]">
                    {item.label}
                  </h3>
                  <p className="mt-2 hidden text-sm leading-relaxed text-slate-600 sm:block md:mt-4 md:text-[0.9375rem]">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 sm:mt-6 sm:pt-4 md:mt-8">
                  <span className="spec-readout truncate pr-2 text-[0.5rem] uppercase tracking-[0.08em] text-slate-500 sm:text-[0.625rem] sm:tracking-[0.1em] md:text-[0.6875rem]">
                    {item.bestFor}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 sm:h-4 sm:w-4" weight="thin" />
                </div>
              </div>

              {/* Photo / gradient panel — untinted, full-bleed. This is the
                  clean side; no scrim competing with the image. */}
              <div className="relative w-1/2 flex-1 sm:w-[55%]">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 55vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-slate-800">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}