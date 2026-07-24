import Link from "next/link";
import Image from "next/image";
import { Compass, Waves, Building2, Mountain, ArrowUpRight, Clock } from "lucide-react";
import type { Destination } from "@/content/destinations";

const categoryIcons: Record<Destination["category"], typeof Compass> = {
  safari: Compass,
  coastal: Waves,
  urban: Building2,
  remote: Mountain,
};

const categoryLabels: Record<Destination["category"], string> = {
  safari: "Safari",
  coastal: "Coastal",
  urban: "Urban",
  remote: "Remote",
};

export function DestinationCard({ destination }: { destination: Destination }) {
  const Icon = categoryIcons[destination.category];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition-all duration-500 ease-editorial hover:-translate-y-1 hover:shadow-lifted">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            className="object-cover transition-transform duration-[1600ms] ease-editorial group-hover:scale-[1.06]"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <Icon className="h-8 w-8 text-white/30" aria-hidden="true" />
        )}
        {destination.image ? (
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-navy-950/0 to-navy-950/5" />
        ) : null}
        <span className="spec-readout absolute left-5 top-5 rounded-md bg-navy-950/70 px-3 py-1.5 text-[0.65rem] uppercase tracking-widest2 text-white backdrop-blur-sm">
          {categoryLabels[destination.category]}
        </span>
        <span className="spec-readout absolute right-5 top-5 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-[0.65rem] uppercase tracking-wide text-navy-900 backdrop-blur-sm">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {destination.flightTimeFromNairobi}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-editorial text-xl font-light italic leading-snug text-navy-900">
            {destination.name}
          </h3>
          <span className="spec-readout mt-1 shrink-0 text-xs text-slate-400">{destination.airportCode}</span>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{destination.description}</p>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <Link
            href={`/request-charter?destination=${destination.airportCode}`}
            className="group/link inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-sky-600 transition-colors hover:text-sky-700"
          >
            Request this route
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-editorial group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
