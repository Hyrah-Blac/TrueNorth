"use client";

import Link from "next/link";
import Image from "next/image";
import { Compass, Waves, Buildings, Mountains, ArrowUpRight, Clock, type Icon } from "@phosphor-icons/react";
import type { Destination } from "@/content/destinations";

const categoryIcons: Record<Destination["category"], Icon> = {
  safari: Compass,
  coastal: Waves,
  urban: Buildings,
  remote: Mountains,
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <Icon className="h-8 w-8 text-white/30" weight="thin" aria-hidden="true" />
        )}
        {destination.image ? (
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-navy-950/0 to-navy-950/5" />
        ) : null}
        <span className="spec-readout absolute left-5 top-5 rounded-md bg-navy-950/70 px-3 py-1.5 text-[0.65rem] uppercase tracking-widest2 text-white backdrop-blur-sm">
          {categoryLabels[destination.category]}
        </span>
        <span className="spec-readout absolute right-5 top-5 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-[0.65rem] uppercase tracking-wide text-navy-900 backdrop-blur-sm">
          <Clock className="h-3 w-3" weight="thin" aria-hidden="true" />
          {destination.flightTimeFromNairobi}
        </span>
      </div>

      <div className="flex flex-1 flex-col bg-slate-100 p-7">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-editorial text-xl font-light leading-snug text-navy-900">{destination.name}</h3>
          <span className="spec-readout mt-1 shrink-0 text-xs text-slate-400">{destination.airportCode}</span>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{destination.description}</p>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <Link
            href={`/request-charter?destination=${destination.airportCode}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-sky-600"
          >
            Request this route
            <ArrowUpRight className="h-3.5 w-3.5" weight="thin" />
          </Link>
        </div>
      </div>
    </div>
  );
}