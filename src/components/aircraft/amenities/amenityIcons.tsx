import {
  Wifi,
  Wind,
  Armchair,
  Wine,
  Package,
  Stethoscope,
  Activity,
  Headphones,
  Sun,
  LayoutGrid,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Best-effort keyword match from a free-text amenity string (as entered by
 * admins) to a representative icon. Order matters — more specific phrases
 * are checked before their broader parents. Falls back to Sparkles for
 * anything unrecognized, so new amenity copy never renders a blank icon.
 */
const AMENITY_ICON_RULES: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ["wi-fi", "wifi", "internet", "connectiv"], icon: Wifi },
  { keywords: ["air condition", "climate"], icon: Wind },
  { keywords: ["leather", "seat"], icon: Armchair },
  { keywords: ["refreshment", "bar", "catering", "galley"], icon: Wine },
  { keywords: ["cargo", "flooring", "freight"], icon: Package },
  { keywords: ["stretcher", "medical"], icon: Stethoscope },
  { keywords: ["oxygen"], icon: Activity },
  { keywords: ["headset", "noise-cancel", "audio"], icon: Headphones },
  { keywords: ["window", "observation"], icon: Sun },
  { keywords: ["configuration", "layout"], icon: LayoutGrid },
  { keywords: ["mount", "reinforced"], icon: Layers },
];

export function getAmenityIcon(label: string): LucideIcon {
  const normalized = label.toLowerCase();
  const match = AMENITY_ICON_RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  return match?.icon ?? Sparkles;
}
