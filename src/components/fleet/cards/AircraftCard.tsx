import Image from "next/image";
import Link from "next/link";
import { ImageOff, ArrowUpRight } from "lucide-react";
import { SpecStrip } from "@/components/aircraft/specifications/SpecStrip";
import { AIRCRAFT_CATEGORY_LABELS } from "@/database/constants/aircraft";
import type { IAircraft } from "@/types/aircraft";

export function AircraftCard({ aircraft }: { aircraft: IAircraft }) {
  return (
    <Link
      href={`/fleet/${aircraft.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition-all duration-500 ease-editorial hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
        {aircraft.heroImage ? (
          <Image
            src={aircraft.heroImage.url}
            alt={aircraft.heroImage.caption ?? aircraft.name}
            fill
            className="object-cover transition-transform duration-[1600ms] ease-editorial group-hover:scale-[1.06]"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-transparent" />
        <span className="spec-readout absolute left-5 top-5 rounded-md bg-navy-950/70 px-3 py-1.5 text-[0.65rem] uppercase tracking-widest2 text-white backdrop-blur-sm">
          {AIRCRAFT_CATEGORY_LABELS[aircraft.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-editorial text-2xl font-light italic leading-snug text-navy-900">
              {aircraft.name}
            </h3>
            {aircraft.tagline ? <p className="mt-1.5 text-sm text-slate-500">{aircraft.tagline}</p> : null}
          </div>
          <ArrowUpRight
            className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-500"
            aria-hidden="true"
          />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <SpecStrip aircraft={aircraft} />
        </div>
      </div>
    </Link>
  );
}
