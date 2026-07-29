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

  const valueSize = size === "lg" ? "text-xl" : "text-sm";

  return (
    <dl className="flex items-center divide-x divide-slate-200">
      {items.map((item, index) => (
        <div key={item.unit} className={`flex items-center gap-2 ${index === 0 ? "pr-4" : "px-4"}`}>
          <item.icon className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
          <div>
            <dd className={`font-semibold text-navy-900 ${valueSize}`}>{item.value}</dd>
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">{item.unit}</dt>
          </div>
        </div>
      ))}
    </dl>
  );
}