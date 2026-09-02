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
          helicopters to cargo aircraft, because the country&apos;s charter
          demand doesn&apos;t fit one aircraft type. A mining site visit, a
          medevac transfer, and a safari transfer are three different
          missions — we fly all of them.
        </p>
        <p className="mt-3 max-w-xl text-[0.75rem] leading-relaxed tracking-wide text-slate-600 sm:text-[0.8125rem]">
          {companyFacts.foundedContext} Every flight is dispatched from our
          base at {settings.addressLine1}, {settings.city}, with crews and aircraft matched
          to the mission rather than offered as a one-size-fits-all charter
          package.
        </p>
      </div>

      <div className="relative min-h-[220px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-full">
        <Image
          src="/images/gallery/done.jpg"
          alt={`${settings.companyName} aircraft over the Kenyan landscape`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
    </div>
  );
}