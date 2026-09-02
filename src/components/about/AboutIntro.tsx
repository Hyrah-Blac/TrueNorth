import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { getSiteSettings } from "@/lib/config/siteSettings";

interface AboutIntroProps {
  /**
   * When false, renders only the full-bleed photo + scrim treatment with
   * no heading or copy — used to reuse this hero's visual on other pages
   * (e.g. the charter-request page) without the About-specific text.
   */
  showText?: boolean;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
//
// Matches the visual grammar of FleetHero / DestinationsHero: full-bleed
// photo that runs behind the transparent navbar, a multi-layer scrim stack
// (top nav fade, bottom content fade, radial pool behind the text, grain
// overlay), and vertically-centred editorial copy.
//
// Departures from those heroes that suit the About page specifically:
//   • Light-field treatment rather than dark: the photo is Kenya landscape
//     (sept.jpg) at full saturation, overlaid with a soft white wash so
//     navy-on-white text is readable. This keeps the aesthetic consistent
//     with StorySection below rather than abruptly switching tone.
//   • No CTA button: the page flows straight into StorySection; the user
//     scrolls, they don't click.

export async function AboutIntro({ showText = true }: AboutIntroProps = {}) {
  const settings = showText ? await getSiteSettings() : null;

  return (
    <section
      className="relative flex min-h-[82svh] flex-col overflow-hidden bg-white pb-0 pt-0 lg:min-h-[88svh]"
      aria-label="About hero"
    >
      {/* ── Photo + scrim stack ───────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/images/gallery/sept.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow object-cover [filter:saturate(1.3)_contrast(1.06)]"
          sizes="100vw"
        />

        {/* Base wash — keeps the photo readable but lets it breathe */}
        <div className="absolute inset-0 bg-white/38" />

        {/* Top fade — white from the very top so the transparent navbar
            has a clean, legible surface to sit on */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/90 via-white/40 to-transparent sm:h-52" />

        {/* Bottom fade — dissolves into the white StorySection below so
            there is no hard edge between hero and content */}
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white via-white/60 to-transparent sm:h-64" />

        {/* Radial vignette — deepens the mid-field behind the text block
            without darkening the sky or foreground too much */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_48%,rgba(255,255,255,0.18),transparent_72%)]" />
      </div>

      {/* ── Copy block — centred, vertically occupies most of the hero ── */}
      {showText && settings ? (
        <Container className="relative flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-32 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
          <div className="flex w-full max-w-2xl flex-col items-center text-center lg:max-w-3xl">

            {/* Eyebrow — Raleway light, spaced caps. Deliberate choice:
                the fleet/destinations heroes skip this; the About page
                earns it because the content is company identity, not
                product catalogue. */}
            <p className="font-body text-[0.5625rem] font-medium uppercase tracking-[0.28em] text-navy-700/70 sm:text-[0.625rem]">
              {settings.companyName}
            </p>

            {/* Headline — set to the exact same type spec as StorySection's
                h2 ("Built around Kenya's actual charter needs"): font-editorial,
                font-light, uppercase, leading-[1.35], tracking-[0.03em],
                text-navy-900, and the same text-base/sm:lg/lg:xl size steps.
                No separate hero scale — this is the same heading style,
                not a bigger cousin of it. */}
            <h1 className="font-editorial mt-4 text-balance text-base font-light uppercase leading-[1.35] tracking-[0.03em] text-navy-900 sm:text-lg lg:text-xl">
              Built around the mission,
              <br className="hidden sm:block" />
              {" "}not just the{" "}
              <span className="text-champagne-600">aircraft</span>
            </h1>

            {/* Sub-copy — same spec as StorySection's paragraphs: default
                body font (no explicit font class, same as Story), same
                text-[0.75rem]/sm:[0.8125rem] size, leading-relaxed,
                tracking-wide, text-slate-600, and the same mt-4/max-w-xl
                spacing rhythm. */}
            <p className="mx-auto mt-4 max-w-xl text-[0.75rem] leading-relaxed tracking-wide text-slate-600 sm:text-[0.8125rem]">
              {settings.companyDescription}
            </p>
          </div>

        </Container>
      ) : null}
    </section>
  );
}