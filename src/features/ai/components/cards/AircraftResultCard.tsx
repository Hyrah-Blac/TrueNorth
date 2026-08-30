import Image from "next/image";
import Link from "next/link";
import { useConcierge } from "../../context/ConciergeContext";
import type { AircraftSummary } from "../../types";

export function AircraftResultCard({ aircraft }: { aircraft: AircraftSummary }) {
  const { setTripDraftAircraft } = useConcierge();

  return (
    // Flat, flush card — no elevation shadow and no hover lift. Border
    // color is the only hover feedback, matching the non-floating
    // direction across every card in the concierge. Stripped to just
    // the aircraft photo and its name — the whole card is the tap
    // target through to the fleet detail page.
    <Link
      href={`/fleet/${aircraft.slug}`}
      onClick={() => setTripDraftAircraft(aircraft.slug)}
      className="group block w-[280px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-300 ease-editorial hover:border-slate-300 sm:w-[300px]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
        {aircraft.heroImageUrl ? (
          <Image
            src={aircraft.heroImageUrl}
            alt={aircraft.name}
            fill
            className="object-cover transition-transform duration-500 ease-editorial group-hover:scale-[1.03]"
            sizes="300px"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
        <h4 className="absolute inset-x-0 bottom-0 px-4 pb-4 font-editorial text-[17px] font-normal leading-snug tracking-[-0.008em] text-white">
          {aircraft.name}
        </h4>
      </div>
    </Link>
  );
}