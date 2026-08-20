"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageBroken } from "@phosphor-icons/react";
import { AIRCRAFT_CATEGORY_LABELS } from "@/database/constants/aircraft";
import type { IAircraft } from "@/types/aircraft";

interface AircraftCardProps {
  aircraft: IAircraft;
  reversed?: boolean;
}

export function AircraftCard({ aircraft, reversed = false }: AircraftCardProps) {
  const copy = aircraft.tagline ?? aircraft.description;

  return (
    <Link
      href={`/fleet/${aircraft.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl sm:min-h-[20rem] md:min-h-[22rem] lg:min-h-[24rem] ${
        reversed ? "sm:flex-row-reverse" : "sm:flex-row"
      }`}
    >
      {/* Text panel — pared back to just what matters: category, name,
          one quiet line of copy, a text-only cue. No boxes, no borders,
          no stacked components competing for attention. */}
      <div
        className={`order-2 flex w-full flex-col justify-center bg-gradient-to-r p-8 sm:order-none sm:w-1/2 sm:shrink-0 sm:p-12 md:p-16 ${
          reversed ? "from-slate-100 to-white" : "from-white to-slate-100"
        }`}
      >
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.3em] text-slate-400">
          {AIRCRAFT_CATEGORY_LABELS[aircraft.category]}
        </span>

        <h3 className="mt-4 font-body uppercase text-[11px] font-semibold text-navy-900 sm:text-xs md:text-sm lg:text-sm">
          {aircraft.name}
        </h3>

        {copy ? (
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-500 line-clamp-3">{copy}</p>
        ) : null}

        <span className="mt-7 inline-flex items-center text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-navy-900 transition-colors duration-300 group-hover:text-slate-500">
          Discover
        </span>
      </div>

      {/* Photo panel — full-bleed, untinted, no floating badges. */}
      <div className="relative order-1 h-56 w-full sm:order-none sm:h-auto sm:flex-1">
        {aircraft.heroImage ? (
          <Image
            src={aircraft.heroImage.url}
            alt={aircraft.heroImage.caption ?? aircraft.name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-slate-800">
            <div className="flex h-full w-full items-center justify-center text-white/30">
              <ImageBroken className="h-6 w-6" weight="thin" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}