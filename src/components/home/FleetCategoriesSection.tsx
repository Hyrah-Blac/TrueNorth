"use client";

import Link from "next/link";
import Image from "next/image";
import { Section, SectionHeading } from "@/components/layout/section/Section";
import { Button } from "@/components/shared/buttons/Button";
import { fleetCategories } from "@/content/fleet-categories";
import type { AircraftCategory } from "@/database/constants/aircraft";

// The categories we have real photography for get the large image
// treatment; the rest use a refined dark gradient card so nothing looks
// like a placeholder pretending to be a photo.
const categoryImages: Partial<Record<AircraftCategory, string>> = {
  light_jet: "/images/hero/light-jet.jpg",
  turboprop: "/images/gallery/pop.jpg",
  heavy_jet: "/images/gallery/done.jpg",
};

// Deliberately showing only a few categories here rather than all
// eight — the homepage is a teaser, not the catalog. Showing everything
// up front gives people no reason to click through to /fleet; showing
// strong examples and then pointing at "more categories" does.
const FEATURED_CATEGORIES: AircraftCategory[] = ["light_jet", "turboprop", "heavy_jet"];

// Image used in the closing "full fleet" CTA panel below — kept as its
// own constant since it's not tied to a category like the ones above.
const FLEET_CTA_IMAGE = "/images/gallery/fleet.jpg";

export function FleetCategoriesSection() {
  const featured = fleetCategories.filter((item) => FEATURED_CATEGORIES.includes(item.category));
  const remainingCount = fleetCategories.length - featured.length;

  return (
    <Section tone="white" className="relative z-10 -mt-6 rounded-t-3xl shadow-none sm:-mt-10 md:-mt-14 lg:-mt-20">
      <SectionHeading
        align="center"
        title="The Right Aircraft, Every Mission"
        description="We don't fly one type of aircraft for every mission. Each category below is matched to a different kind of trip — tell us the mission and we'll recommend the aircraft."
      />

      <div className="mt-10 flex flex-col gap-8 sm:gap-10">
        {featured.map((item, index) => {
          const image = categoryImages[item.category];
          // Zigzag layout: first row shows text-left/image-right, the
          // next flips to image-left/text-right.
          const reversed = index % 2 !== 0;

          return (
            <Link
              key={item.category}
              href={`/fleet?category=${item.category}`}
              className={`relative flex flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900/40 focus-visible:ring-offset-2 sm:min-h-[16rem] md:min-h-[20rem] lg:min-h-[22rem] ${
                reversed ? "sm:flex-row-reverse" : "sm:flex-row"
              }`}
            >
              <div
                className={`order-2 flex w-full flex-col justify-center bg-gradient-to-r p-6 sm:order-none sm:w-[45%] sm:shrink-0 sm:p-8 md:p-10 lg:p-12 ${
                  reversed ? "from-slate-200 to-white" : "from-white to-slate-200"
                }`}
              >
                <h3 className="font-display text-sm font-semibold text-navy-900 sm:text-base md:text-lg lg:text-lg">
                  {item.label}
                </h3>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-600 sm:mt-3 sm:text-xs md:text-sm">
                  {item.description}
                </p>
                <span className="mt-4 inline-block w-fit text-xs font-medium tracking-wide text-navy-900/70">
                  Explore aircraft
                </span>
              </div>

              <div className="relative order-1 h-56 w-full overflow-hidden sm:order-none sm:h-auto sm:flex-1">
                {image ? (
                  <Image
                    src={image}
                    alt={item.label}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 55vw, 100vw"
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

      {/* Closing CTA — image-left / text-right, mirroring the featured
          rows above but calmer: no link-wrap, no hover state, just a
          clear "there's more" moment before the button. Sized and
          typeset to match the featured rows above so the whole section
          reads as one consistent system rather than two different
          components stacked together. */}
      <div className="mt-8 flex flex-col overflow-hidden sm:min-h-[16rem] sm:flex-row-reverse md:min-h-[20rem] lg:min-h-[22rem]">
        <div className="order-2 flex w-full flex-col justify-center gap-5 bg-gradient-to-r from-slate-200 to-white p-6 sm:order-none sm:w-[45%] sm:shrink-0 sm:p-8 md:p-10 lg:p-12">
          <h3 className="font-display text-sm font-semibold text-navy-900 sm:text-base md:text-lg lg:text-lg">
            The Full Fleet
          </h3>
          <p className="max-w-sm text-xs leading-relaxed text-slate-600 sm:text-xs md:text-sm">
            Plus {remainingCount} more categories — helicopters, utility, air ambulance, safari, and cargo aircraft, each matched to a different kind of mission.
          </p>
          <div>
            <Button href="/fleet" variant="blue" size="md">
              View Entire Fleet
            </Button>
          </div>
        </div>

        <div className="relative order-1 h-56 w-full overflow-hidden sm:order-none sm:h-auto sm:flex-1">
          <Image
            src={FLEET_CTA_IMAGE}
            alt="The full aircraft fleet"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        </div>
      </div>
    </Section>
  );
}