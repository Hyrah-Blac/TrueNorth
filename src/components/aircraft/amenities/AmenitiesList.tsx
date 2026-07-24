import { getAmenityIcon } from "./amenityIcons";

export function AmenitiesList({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {amenities.map((amenity, index) => {
        const Icon = getAmenityIcon(amenity);
        return (
          <li
            key={amenity}
            className="group flex animate-fade-up-editorial items-center gap-3.5 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 transition-all duration-500 ease-editorial hover:-translate-y-0.5 hover:border-sky-400/60 hover:shadow-soft"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 transition-colors duration-500 ease-editorial group-hover:bg-sky-500 group-hover:text-white">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-medium text-navy-900">{amenity}</span>
          </li>
        );
      })}
    </ul>
  );
}
