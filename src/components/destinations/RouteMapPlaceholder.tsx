import Image from "next/image";
import { destinations } from "@/content/destinations";

// Illustrative positions on a simplified Kenya/East Africa outline —
// not geographically precise coordinates. This is a static placeholder;
// swap for a real Google Maps embed once lib/api/google-maps.ts and an
// API key are configured in the payments/integrations phase.
const routePoints: Record<string, { x: number; y: number }> = {
  "masai-mara": { x: 120, y: 260 },
  amboseli: { x: 210, y: 300 },
  diani: { x: 340, y: 330 },
  "mount-kenya": { x: 265, y: 140 },
  lamu: { x: 400, y: 180 },
  lodwar: { x: 90, y: 60 },
  kisumu: { x: 70, y: 180 },
  zanzibar: { x: 430, y: 380 },
  kigali: { x: 20, y: 300 },
  juba: { x: 60, y: 20 },
};

const NAIROBI = { x: 250, y: 220 };

export function RouteMapPlaceholder() {
  return (
    <div className="relative aspect-[6/5] overflow-hidden rounded-xl border border-slate-200 bg-navy-950 p-6">
      <Image
        src="/images/destinations/Nairobi.jpg"
        alt=""
        fill
        className="object-cover opacity-30"
        sizes="(min-width: 1024px) 55vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-950/85 to-navy-950/70" />
      <svg
        viewBox="0 0 480 400"
        className="relative h-full w-full"
        role="img"
        aria-label="Illustrative route map from Nairobi"
      >
        {destinations.map((destination) => {
          const point = routePoints[destination.slug];
          if (!point) return null;

          return (
            <line
              key={destination.slug}
              x1={NAIROBI.x}
              y1={NAIROBI.y}
              x2={point.x}
              y2={point.y}
              stroke="rgb(var(--color-sky-400))"
              strokeWidth="0.75"
              strokeOpacity="0.4"
              strokeDasharray="2 3"
            />
          );
        })}

        {destinations.map((destination) => {
          const point = routePoints[destination.slug];
          if (!point) return null;

          return (
            <g key={`${destination.slug}-marker`}>
              <circle cx={point.x} cy={point.y} r="3" fill="rgb(var(--color-sky-400))" />
              <text
                x={point.x + 6}
                y={point.y + 3}
                fontSize="9"
                fill="rgb(var(--color-slate-400))"
                fontFamily="var(--font-data)"
              >
                {destination.airportCode}
              </text>
            </g>
          );
        })}

        <circle cx={NAIROBI.x} cy={NAIROBI.y} r="5" fill="rgb(var(--color-white))" />
        <circle cx={NAIROBI.x} cy={NAIROBI.y} r="9" fill="none" stroke="rgb(var(--color-white))" strokeOpacity="0.4" />
        <text
          x={NAIROBI.x + 10}
          y={NAIROBI.y + 4}
          fontSize="10"
          fontWeight="600"
          fill="rgb(var(--color-white))"
          fontFamily="var(--font-data)"
        >
          NBO / WIL
        </text>
      </svg>
    </div>
  );
}