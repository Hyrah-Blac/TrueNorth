import { Users, Luggage, MapPinned, Gauge, MapPin, MoveVertical, MoveHorizontal, Ruler } from "lucide-react";
import type { IAircraft } from "@/types/aircraft";

interface SpecificationsTableProps {
  aircraft: IAircraft;
}

interface SpecRow {
  label: string;
  value: string;
  icon: typeof Users;
}

interface SpecGroup {
  title: string;
  rows: SpecRow[];
}

export function SpecificationsTable({ aircraft }: SpecificationsTableProps) {
  const groups: SpecGroup[] = [
    {
      title: "Capacity & Performance",
      rows: [
        { label: "Passenger capacity", value: `${aircraft.passengerCapacity} passengers`, icon: Users },
        { label: "Luggage capacity", value: `${aircraft.luggageCapacityKg} kg`, icon: Luggage },
        { label: "Range", value: `${aircraft.rangeNm.toLocaleString()} nm`, icon: MapPinned },
        { label: "Cruising speed", value: `${aircraft.cruisingSpeedKts.toLocaleString()} kts`, icon: Gauge },
        { label: "Base airport", value: aircraft.baseAirportCode, icon: MapPin },
      ],
    },
  ];

  const cabinRows: SpecRow[] = [];
  if (aircraft.cabinHeightM) cabinRows.push({ label: "Cabin height", value: `${aircraft.cabinHeightM} m`, icon: MoveVertical });
  if (aircraft.cabinWidthM) cabinRows.push({ label: "Cabin width", value: `${aircraft.cabinWidthM} m`, icon: MoveHorizontal });
  if (aircraft.cabinLengthM) cabinRows.push({ label: "Cabin length", value: `${aircraft.cabinLengthM} m`, icon: Ruler });

  if (cabinRows.length > 0) {
    groups.push({ title: "Cabin Dimensions", rows: cabinRows });
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-slate-400">{group.title}</p>
          <dl className="overflow-hidden rounded-lg border border-slate-200">
            {group.rows.map((row, index) => (
              <div
                key={row.label}
                className={`group flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-300 hover:bg-slate-100 ${
                  index % 2 === 1 ? "bg-slate-50" : "bg-white"
                }`}
              >
                <dt className="flex items-center gap-2.5 text-xs text-slate-500">
                  <row.icon
                    className="h-3 w-3 shrink-0 text-slate-300 transition-colors duration-300 group-hover:text-navy-700"
                    aria-hidden="true"
                  />
                  {row.label}
                </dt>
                <dd className="text-xs font-medium text-navy-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}