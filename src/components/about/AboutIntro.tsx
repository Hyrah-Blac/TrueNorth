import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { getSiteSettings } from "@/lib/config/siteSettings";

interface AboutIntroProps {
  /** Renders just the full-bleed photo/overlay treatment with no heading or copy — used to reuse this hero's visual on other pages (e.g. the charter request page) without the About-specific text. */
  showText?: boolean;
}

// Same "no floating card, photo runs full-bleed behind a transparent
// navbar" treatment as the contact page — this replaces the old dark
// navy AboutHero. The photo carries a light wash (not the dark scrim
// used on the destinations/homepage heroes) so navy/slate text sits
// directly on it, and the section flows straight into StorySection
// below rather than reading as a separate boxed hero.
export async function AboutIntro({ showText = true }: AboutIntroProps = {}) {
  const settings = showText ? await getSiteSettings() : null;

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-24 sm:pb-16 sm:pt-28 lg:flex lg:min-h-[60vh] lg:items-center lg:py-14">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/gallery/sept.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow object-cover [filter:saturate(1.25)_contrast(1.05)]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/95 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/70 to-transparent" />
      </div>

      {showText && settings ? (
        <Container className="relative flex justify-center">
          <div className="max-w-xl text-center lg:max-w-2xl">
            <h1 className="font-display text-balance text-[clamp(1.375rem,1.1rem+1.2vw,2rem)] font-extrabold uppercase leading-[1.2] tracking-tight text-navy-900">
              Built around the mission, not just the{" "}
              <span className="text-champagne-600">aircraft</span>
            </h1>

            <div className="mx-auto mt-6 h-px w-10 bg-navy-900/15" />

            <p className="mx-auto mt-4 max-w-sm text-[clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] leading-relaxed tracking-wide text-slate-600">
              {settings.companyDescription}
            </p>
          </div>
        </Container>
      ) : null}
    </section>
  );
}