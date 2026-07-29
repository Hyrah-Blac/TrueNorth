"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageBroken } from "@phosphor-icons/react";
import { SpecStrip } from "@/components/aircraft/specifications/SpecStrip";
import { AIRCRAFT_CATEGORY_LABELS } from "@/database/constants/aircraft";
import type { IAircraft } from "@/types/aircraft";

interface AircraftCardProps {
  aircraft: IAircraft;
  index?: number;
}

export function AircraftCard({ aircraft, index }: AircraftCardProps) {
  return (
    <Link
      href={`/fleet/${aircraft.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-500 ease-editorial hover:border-slate-300"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
        {aircraft.heroImage ? (
          <Image
            src={aircraft.heroImage.url}
            alt={aircraft.heroImage.caption ?? aircraft.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <ImageBroken className="h-6 w-6" weight="thin" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/55 via-transparent to-transparent" />

        {typeof index === "number" ? (
          <span className="absolute right-5 top-5 text-xs text-white/50">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}

        <span className="absolute left-5 top-5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-navy-900">
          {AIRCRAFT_CATEGORY_LABELS[aircraft.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-8">
        <div>
          <h3 className="font-display text-xl font-semibold leading-snug text-navy-900">{aircraft.name}</h3>
          {aircraft.tagline ? <p className="mt-1.5 text-sm text-slate-600">{aircraft.tagline}</p> : null}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <SpecStrip aircraft={aircraft} />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5 text-sm font-medium text-slate-600 transition-colors duration-300 group-hover:text-sky-600">
          View details
        </div>
      </div>
    </Link>
  );
}