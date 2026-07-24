import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { companyFacts } from "@/content/company";

export function StorySection() {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-xl lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-[#eef1f5] px-8 py-14 lg:px-16 lg:py-20">
        <p className="spec-readout text-xs font-medium uppercase tracking-widest2 text-amber-700">
          Our Story
        </p>
        <span className="mt-3 block h-px w-6 bg-amber-700/40" aria-hidden="true" />

        <h2 className="mt-6 text-3xl font-bold tracking-tight text-black lg:text-4xl">
          Built around Kenya&apos;s actual charter needs
        </h2>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
          True North operates from Wilson Airport with a fleet spanning
          helicopters to cargo aircraft, because the country&apos;s charter
          demand doesn&apos;t fit one aircraft type. A mining site visit, a
          medevac transfer, and a safari transfer are three different
          missions — we fly all of them.
        </p>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
          {companyFacts.foundedContext} Every flight is dispatched from our
          base at {companyFacts.baseAirport}, with crews and aircraft matched
          to the mission rather than offered as a one-size-fits-all charter
          package.
        </p>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href="/fleet"
            className="group flex items-center justify-between gap-4"
          >
            <span className="spec-readout text-xs uppercase tracking-widest2 text-slate-500">
              Mining Sites, Medevac, Safari Transfers
            </span>
            <ArrowUpRight
              className="h-4 w-4 flex-none text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black"
              weight="bold"
            />
          </Link>
        </div>
      </div>

      <div className="relative min-h-[320px] lg:min-h-full">
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