"use client";

import Link from "next/link";
import Image from "next/image";
import type { Destination } from "@/content/destinations";

interface DestinationCardProps {
  destination: Destination;
  reversed?: boolean;
}

export function DestinationCard({ destination, reversed = false }: DestinationCardProps) {
  return (
    <Link
      href={`/request-charter?destination=${destination.airportCode}`}
      className={`relative flex flex-col overflow-hidden rounded-2xl sm:min-h-[16rem] md:min-h-[20rem] lg:min-h-[22rem] ${
        reversed ? "sm:flex-row-reverse" : "sm:flex-row"
      }`}
    >
      {/* Text panel — same gradient-tint treatment as the fleet category
          rows: white fading into slate, seam sitting against the photo. */}
      <div
        className={`order-2 flex w-full flex-col justify-center bg-gradient-to-r p-6 sm:order-none sm:w-[45%] sm:shrink-0 sm:p-8 md:p-10 ${
          reversed ? "from-slate-200 to-white" : "from-white to-slate-200"
        }`}
      >
        <h3 className="font-display text-base font-semibold leading-[1.15] tracking-tight text-navy-900 sm:text-lg md:text-xl">
          {destination.name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:mt-3 sm:text-sm">
          {destination.description}
        </p>
      </div>

      {/* Photo panel — full-bleed, untinted, no floating badges. */}
      <div className="relative order-1 h-56 w-full sm:order-none sm:h-auto sm:flex-1">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
          </div>
        )}
      </div>
    </Link>
  );
}