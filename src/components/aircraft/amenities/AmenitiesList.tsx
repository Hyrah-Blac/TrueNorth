import { getAmenityIcon } from "./amenityIcons";

export function AmenitiesList({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {amenities.map((amenity) => {
        const Icon = getAmenityIcon(amenity);
        return (
          <li
            key={amenity}
            className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 transition-colors duration-300 hover:border-sky-400/60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-medium text-navy-900">{amenity}</span>
          </li>
        );
      })}
    </ul>
  );
}