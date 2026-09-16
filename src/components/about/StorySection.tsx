import Image from "next/image";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { companyFacts } from "@/content/company";

export async function StorySection() {
  const settings = await getSiteSettings();

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-xl lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-slate-50 px-6 py-10 sm:px-8 sm:py-12 lg:px-14 lg:py-16">
        <h2 className="font-editorial text-balance text-base font-light uppercase leading-[1.35] tracking-[0.03em] text-navy-900 sm:text-lg lg:text-xl">
          Built around Kenya&apos;s actual charter needs
        </h2>

        <p className="mt-4 max-w-xl text-[0.75rem] leading-relaxed tracking-wide text-slate-600 sm:text-[0.8125rem]">
          {settings.companyName} operates from {settings.addressLine1} with a fleet spanning
          helicopters to cargo aircraft, because Kenya&apos;s charter demand
          doesn&apos;t fit one aircraft type. A mining site visit, a medevac
          transfer, and a safari transfer are three different missions —
          and we fly them all.
        </p>
        <p className="mt-3 max-w-xl text-[0.75rem] leading-relaxed tracking-wide text-slate-600 sm:text-[0.8125rem]">
          {companyFacts.foundedContext} Every flight still dispatches from
          that {settings.city} base, with crews and aircraft matched to the
          mission rather than offered as a one-size-fits-all charter
          package.
        </p>
      </div>

      {/* min-h below lg is a real height: at grid-cols-1 the photo sits
          in its own row with nothing to stretch against (fill's absolute
          positioning gives this div zero intrinsic height on its own),
          so it needs an explicit floor. At lg the grid switches to two
          columns and align-items: stretch (the default) makes this cell
          match the text column's row height automatically — lg:min-h-0
          clears the md floor so stretch is free to govern. A hardcoded
          lg:min-h-[480px] previously
          forced the photo taller than the copy actually rendered,
          leaving it hanging well below the text block; letting stretch
          govern it keeps the two columns exactly level on every screen. */}
      <div className="relative min-h-[300px] sm:min-h-[380px] md:min-h-[440px] lg:min-h-0">
        <Image
          src="/images/gallery/pix.jpg"
          alt={`${settings.companyName} aircraft over the Kenyan landscape`}
          fill
          // object-[center_90%]: object-cover trims top/bottom to fill
          // whatever height the column ends up at. Centered (50%)
          // cropping had plenty of spare sky up top but sliced straight
          // through the nose wheel at the bottom edge, reading as an
          // accidental crop. Anchoring near the bottom takes that trim
          // out of the sky, which has plenty to spare, and leaves margin
          // so the wheel clears the edge rather than just barely
          // surviving it.
          className="object-cover object-[center_90%]"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
    </div>
  );
}