import { Users, Gauge, MapPinned } from "lucide-react";
import type { IAircraft } from "@/types/aircraft";

interface SpecStripProps {
  aircraft: Pick<IAircraft, "passengerCapacity" | "rangeNm" | "cruisingSpeedKts">;
  size?: "sm" | "lg";
}

export function SpecStrip({ aircraft, size = "sm" }: SpecStripProps) {
  const items = [
    { icon: Users, value: String(aircraft.passengerCapacity), unit: "PAX" },
    { icon: MapPinned, value: aircraft.rangeNm.toLocaleString(), unit: "NM RANGE" },
    { icon: Gauge, value: aircraft.cruisingSpeedKts.toLocaleString(), unit: "KTS CRUISE" },
  ];

  const valueSize = size === "lg" ? "text-base" : "text-xs";

  return (
    <dl className="flex items-center divide-x divide-slate-200">
      {items.map((item, index) => (
        <div key={item.unit} className={`flex items-center gap-1.5 ${index === 0 ? "pr-3" : "px-3"}`}>
          <item.icon className="h-3 w-3 shrink-0 text-navy-900" aria-hidden="true" />
          <div>
            <dd className={`font-semibold text-navy-900 ${valueSize}`}>{item.value}</dd>
            <dt className="text-[9px] uppercase tracking-wide text-slate-500">{item.unit}</dt>
          </div>
        </div>
      ))}
    </dl>
  );
}