import Image from "next/image";
import { getSiteSettings } from "@/lib/config/siteSettings";

// ─── Photo band ─────────────────────────────────────────────────────────────
//
// Replaces the old text hero (AboutIntro) on the About page. This is a
// full-bleed photograph pulled up on top of StorySection with a real
// negative margin so it genuinely overlaps the section above it, rather
// than one that merely cancels out padding to land at a flush zero gap.
//
// The overlap amount is chosen to always land on empty space or photo,
// never on the story copy: at lg+ StorySection's text column ends in
// 4rem (lg:py-16) of its own bottom padding before the grid's edge, so
// -mt-16 there tucks into exactly that cushion. Below lg, StorySection
// stacks with its photo block last, so a deeper -mt-20 safely overlaps
// into that photo rather than any text. (StorySection's own Section
// wrapper has its bottom padding zeroed via `!pb-0` at the call site,
// so this negative margin isn't fighting extra whitespace on top of it.)
//
// Height is viewport-relative (svh) so it feels intentional at every
// aspect ratio, but clamped with min-h/max-h at each step: min-h keeps
// short viewports (landscape phones, small laptops with browser chrome)
// from collapsing the band to a sliver where the fades would eat the
// whole thing; max-h keeps very tall viewports (large desktop monitors,
// tablets in portrait) from stretching it into an oversized slab.

export async function AboutPhotoBand() {
  const settings = await getSiteSettings();

  return (
    <section
      className="relative z-10 -mt-20 h-[70svh] min-h-[420px] max-h-[620px] w-full overflow-hidden sm:max-h-[680px] lg:-mt-16 lg:h-[82svh] lg:max-h-[880px]"
      aria-label={`${settings.companyName} aircraft over the Kenyan landscape`}
    >
      <Image
        src="/images/gallery/sept.jpg"
        alt=""
        fill
        // object-[center_32%]: this band's aspect ratio (wide + tall) is
        // wider than the source photo's, so object-cover crops top/bottom
        // to fill it. Centered (50%) cropping was cutting into the cabin
        // table/seats at the very bottom edge, reading as an accidental
        // crop. Anchoring ~32% down keeps the ceiling/windows framing
        // intact and lands the bottom cut on open floor instead.
        className="animate-zoom-slow object-cover object-[center_32%] [filter:saturate(1.3)_contrast(1.06)]"
        sizes="100vw"
      />

      {/* Top fade — short and steep, not a broad wash. The photo should
          already be legible within the first quarter of the band so it
          reads as continuing the page, not as a separate blank interlude
          before an image starts. */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white to-transparent sm:h-40 lg:h-48" />

      {/* Bottom fade — settles the photo back to white before whatever
          section follows, keeping the page's white ground consistent. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/25 to-transparent sm:h-56" />

      {/* Radial vignette — quiet depth in the mid-field, matching the
          treatment used on the site's other full-bleed photo heroes. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(255,255,255,0.12),transparent_72%)]" />
    </section>
  );
}