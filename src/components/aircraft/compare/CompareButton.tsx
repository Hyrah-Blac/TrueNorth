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
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
          selected
            ? "border-navy-900 bg-navy-50 text-navy-900"
            : "border-slate-300 text-navy-900 hover:border-navy-900"
        }`}
      >
        {selected ? (
          <Check className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Scale className="h-3 w-3" aria-hidden="true" />
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
        selected ? "bg-navy-900 text-white" : "bg-white/90 text-navy-900 hover:bg-navy-900 hover:text-white"
      }`}
    >
      {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : <Scale className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}