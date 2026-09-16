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
// Height: below lg the box is sized off an aspect-ratio (landscape,
// matching the source photo's own orientation) rather than svh, capped
// with max-h. A pure svh height on a narrow phone viewport produces a
// *portrait* box (e.g. 400 wide x 484 tall), and since the source photo
// is landscape, object-cover then has to crop the image's left/right
// edges to fill that tall box — the photo reads as an over-zoomed,
// cropped sliver instead of the intended wide shot. Keeping the box
// itself landscape-shaped means object-cover only ever trims a little
// off the top/bottom, which is what the object-position tuning below
// assumes. From lg the viewport is comfortably wide, so svh height is
// safe again and gives the tall, immersive band the design wants.

export async function AboutPhotoBand() {
  const settings = await getSiteSettings();

  return (
    <section
      className="relative z-10 -mt-20 aspect-[4/3] max-h-[440px] w-full overflow-hidden sm:aspect-[16/9] sm:max-h-[560px] lg:-mt-16 lg:aspect-auto lg:h-[82svh] lg:max-h-[880px]"
      aria-label={`${settings.companyName} aircraft over the Kenyan landscape`}
    >
      <Image
        src="/images/gallery/sept.jpg"
        alt=""
        fill
        // object-[center_32%]: with the box kept landscape-shaped at
        // every breakpoint (see height comment above), object-cover
        // only ever crops top/bottom to fill it. Centered (50%)
        // cropping was cutting into the cabin table/seats at the very
        // bottom edge, reading as an accidental crop. Anchoring ~32%
        // down keeps the ceiling/windows framing intact and lands the
        // bottom cut on open floor instead.
        className="animate-zoom-slow object-cover object-[center_32%] [filter:saturate(1.3)_contrast(1.06)]"
        sizes="100vw"
      />

      {/* Top fade — sized to just cover the -mt-20/-mt-16 overlap zone
          (80px / 64px) below lg, not the old svh-era height. h-28/h-40
          were tuned for a ~480–620px box; against the new ~300–360px
          landscape-aspect box they (plus the bottom fade) covered over
          90% of it, leaving almost no photo visible — reading as an
          abrupt crop rather than a fade. h-24 gives just enough cushion
          past the 80px overlap on mobile/sm; lg keeps its own value
          since it still uses the tall svh box with a smaller overlap. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent lg:h-48" />

      {/* Bottom fade — likewise cut down to leave most of the shorter
          mobile/sm box as clear photo, only settling it back to white
          right at the edge. lg is untouched (tall box, same as before). */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/25 to-transparent sm:h-20 lg:h-56" />

      {/* Radial vignette — quiet depth in the mid-field, matching the
          treatment used on the site's other full-bleed photo heroes. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(255,255,255,0.12),transparent_72%)]" />
    </section>
  );
}