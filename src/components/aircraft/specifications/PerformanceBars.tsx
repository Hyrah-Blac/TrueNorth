import { MapPinned, Gauge } from "lucide-react";

interface PerformanceBarsProps {
  rangeNm: number;
  cruisingSpeedKts: number;
}

const RANGE_SCALE_NM = 2500;
const SPEED_SCALE_KTS = 500;

function toPercent(value: number, scale: number) {
  return Math.min(100, Math.max(4, Math.round((value / scale) * 100)));
}

// Each bar gets its own accent rather than sharing one blue, so the two
// figures read as distinct at a glance instead of blending together.
// Colors pulled from the site's actual palette (navy + champagne) rather
// than a generic sky/amber pairing.
const ACCENTS = {
  range: {
    icon: "text-navy-700",
    bar: "bg-gradient-to-r from-navy-900 via-navy-700 to-navy-500",
    glow: "shadow-[0_0_10px_rgba(15,42,67,0.4)]",
  },
  speed: {
    icon: "text-champagne-600",
    bar: "bg-gradient-to-r from-champagne-600 via-champagne-400 to-champagne-300",
    glow: "shadow-[0_0_10px_rgba(196,163,96,0.45)]",
  },
} as const;
export function PerformanceBars({ rangeNm, cruisingSpeedKts }: PerformanceBarsProps) {
  const bars = [
    {
      key: "range" as const,
      icon: MapPinned,
      label: "Range",
      value: `${rangeNm.toLocaleString()} nm`,
      percent: toPercent(rangeNm, RANGE_SCALE_NM),
    },
    {
      key: "speed" as const,
      icon: Gauge,
      label: "Cruising Speed",
      value: `${cruisingSpeedKts.toLocaleString()} kts`,
      percent: toPercent(cruisingSpeedKts, SPEED_SCALE_KTS),
    },
  ];

  return (
    <div className="space-y-6">
      {bars.map((bar) => {
        const accent = ACCENTS[bar.key];

        return (
          <div key={bar.key}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <bar.icon className={`h-3.5 w-3.5 ${accent.icon}`} aria-hidden="true" />
                {bar.label}
              </div>
              <span className="spec-readout text-xs font-semibold text-navy-900">{bar.value}</span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]">
              <div
                className={`h-full origin-left animate-fade-in-editorial rounded-full ${accent.bar} ${accent.glow}`}
                style={{ width: `${bar.percent}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[10px] leading-relaxed text-slate-400">
        Shown relative to our full fleet range, helicopter to light jet.
      </p>
    </div>
  );
}