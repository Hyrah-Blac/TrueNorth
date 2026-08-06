import { getAmenityIcon } from "./amenityIcons";

export function AmenitiesList({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {amenities.map((amenity) => {
        const Icon = getAmenityIcon(amenity);
        return (
          <li
            key={amenity}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-700 transition-colors duration-300 hover:border-navy-300"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-900">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="font-medium text-navy-900">{amenity}</span>
          </li>
        );
      })}
    </ul>
  );
}