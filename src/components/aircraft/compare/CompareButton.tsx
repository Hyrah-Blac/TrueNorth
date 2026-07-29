"use client";

import { Scale, Check } from "lucide-react";
import { useCompareList } from "@/hooks/useCompareList";

interface CompareButtonProps {
  slug: string;
  name: string;
  imageUrl?: string;
  categoryLabel: string;
  variant?: "card" | "inline";
}

/**
 * Toggle button for adding/removing an aircraft from the comparison tray.
 * `variant="card"` renders as a small floating circular control meant to
 * sit inside an <AircraftCard>'s image (so it must stop propagation to
 * avoid triggering the card's enclosing <Link>). `variant="inline"` renders
 * as a full-width labelled button for the aircraft detail sidebar.
 */
export function CompareButton({ slug, name, imageUrl, categoryLabel, variant = "card" }: CompareButtonProps) {
  const { isSelected, isFull, toggle, hydrated } = useCompareList();
  const selected = hydrated && isSelected(slug);
  const disabled = hydrated && !selected && isFull;

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    toggle({ slug, name, imageUrl, categoryLabel });
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={selected}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
          selected
            ? "border-sky-500 bg-sky-100/70 text-sky-700"
            : "border-slate-300 text-navy-900 hover:border-sky-500 hover:text-sky-600"
        }`}
      >
        {selected ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Scale className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {selected ? "Added to compare" : "Add to compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
      title={disabled ? "You can compare up to 4 aircraft" : selected ? "Remove from comparison" : "Add to comparison"}
      className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
        selected ? "bg-sky-500 text-white" : "bg-white/90 text-navy-900 hover:bg-sky-500 hover:text-white"
      }`}
    >
      {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : <Scale className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}