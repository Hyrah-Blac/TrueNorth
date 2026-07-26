import Image from "next/image";
import { companyFacts } from "@/content/company";

export function StorySection() {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-xl lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-slate-50 px-6 py-12 sm:px-8 sm:py-14 lg:px-16 lg:py-20">
        <h2 className="font-display text-xl font-extrabold uppercase leading-[1.15] tracking-tight text-navy-900 sm:text-2xl lg:text-3xl">
          Built around Kenya&apos;s actual charter needs
        </h2>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600 lg:text-[0.9375rem]">
          True North operates from Wilson Airport with a fleet spanning
          helicopters to cargo aircraft, because the country&apos;s charter
          demand doesn&apos;t fit one aircraft type. A mining site visit, a
          medevac transfer, and a safari transfer are three different
          missions — we fly all of them.
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 lg:text-[0.9375rem]">
          {companyFacts.foundedContext} Every flight is dispatched from our
          base at {companyFacts.baseAirport}, with crews and aircraft matched
          to the mission rather than offered as a one-size-fits-all charter
          package.
        </p>
      </div>

      <div className="relative min-h-[260px] sm:min-h-[320px] lg:min-h-full">
        <Image
          src="/images/destinations/mt-kenya.jpg"
          alt="True North aircraft over the Kenyan landscape"
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
    </div>
  );
}