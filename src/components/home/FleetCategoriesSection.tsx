"use client";

import Link from "next/link";
import Image from "next/image";
import { Section, SectionHeading } from "@/components/layout/section/Section";
import { Button } from "@/components/shared/buttons/Button";
import { fleetCategories } from "@/content/fleet-categories";

// The one category we have real photography for gets the large image
// treatment; the rest use a refined dark gradient card so nothing looks
// like a placeholder pretending to be a photo.
const categoryImages: Partial<Record<string, string>> = {
  helicopter: "/images/aircraft/Heli.jpg",
  safari: "/images/aircraft/Safari.jpg",
};

// Deliberately showing only a couple of categories here rather than all
// seven — the homepage is a teaser, not the catalog. Showing everything
// up front gives people no reason to click through to /fleet; showing
// two strong examples and then pointing at "five more categories" does.
const FEATURED_CATEGORIES = ["helicopter", "safari"];

// Image used in the closing "full fleet" CTA panel below — kept as its
// own constant since it's not tied to a category like the ones above.
const FLEET_CTA_IMAGE = "/images/aircraft/category.jpg";

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

      <div className="mt-16 flex flex-col gap-6">
        {featured.map((item, index) => {
          const image = categoryImages[item.category];
          // Zigzag layout: first row shows image-right/text-left, the
          // next flips to image-left/text-right.
          const reversed = index % 2 !== 0;

          return (
            <Link
              key={item.category}
              href={`/fleet?category=${item.category}`}
              className={`relative flex flex-col overflow-hidden sm:min-h-[16rem] md:min-h-[20rem] lg:min-h-[22rem] ${
                reversed ? "sm:flex-row-reverse" : "sm:flex-row"
              }`}
            >
              {/* Text panel — carries the tint. This is the side without a
                  real photo behind it, so the color lives here instead of
                  standing in as a fake image placeholder. Full width and
                  stacked below the photo on mobile; narrows to a side
                  column from sm upward so the photo side never gets
                  crowded out.

                  The grey isn't centered under the text — sampled from the
                  reference, it sits right at the seam where this panel
                  meets the photo and fades out to white toward the page's
                  outer edge. Since `reversed` puts the text panel on the
                  right (image on the left) in that case, the grey needs to
                  start on the LEFT side of the panel there, and on the
                  right side otherwise — hence the conditional from/to. */}
              <div
                className={`order-2 flex w-full flex-col justify-center bg-gradient-to-r p-6 sm:order-none sm:w-[45%] sm:shrink-0 sm:p-8 md:p-10 lg:p-12 ${
                  reversed ? "from-slate-200 to-white" : "from-white to-slate-200"
                }`}
              >
                <h3 className="font-display text-base font-semibold leading-[1.15] tracking-tight text-navy-900 sm:text-lg md:text-lg lg:text-xl">
                  {item.label}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:mt-3 sm:text-xs md:text-sm">
                  {item.description}
                </p>
              </div>

              {/* Photo / gradient panel — untinted, full-bleed. This is the
                  clean side; no scrim competing with the image. Fixed
                  height on mobile since it's no longer sharing row
                  height with the text panel; stretches to match the
                  row's height from sm upward. */}
              <div className="relative order-1 h-56 w-full sm:order-none sm:h-auto sm:flex-1">
                {image ? (
                  <Image
                    src={image}
                    alt=""
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

      {/* Closing CTA — image-right / text-left, mirroring the featured
          rows above but calmer: no link-wrap, no hover state, just a
          clear "there's more" moment before the button. */}
      <div className="mt-12 flex flex-col overflow-hidden rounded-2xl sm:flex-row sm:min-h-[18rem]">
        <div className="flex w-full flex-col justify-center gap-5 bg-gradient-to-r from-white to-slate-100 p-8 sm:w-[45%] sm:shrink-0 md:p-10 lg:p-12">
          <h3 className="font-display text-sm font-semibold text-navy-900 sm:text-base">
            The Full Fleet
          </h3>
          <p className="text-sm leading-relaxed text-slate-600">
            Plus {remainingCount} more categories — turboprops, light jets, cargo, and medevac aircraft, each matched to a different kind of mission.
          </p>
          <div>
            <Button href="/fleet" variant="blue" size="md">
              View Entire Fleet
            </Button>
          </div>
        </div>

        <div className="relative h-56 w-full sm:h-auto sm:flex-1">
          <Image
            src={FLEET_CTA_IMAGE}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        </div>
      </div>
    </Section>
  );
}