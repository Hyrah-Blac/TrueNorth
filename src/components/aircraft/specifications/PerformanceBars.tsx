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
const ACCENTS = {
  range: {
    icon: "text-sky-600",
    bar: "bg-gradient-to-r from-sky-700 via-sky-500 to-sky-400",
    glow: "shadow-[0_0_10px_rgba(56,145,224,0.45)]",
  },
  speed: {
    icon: "text-amber-600",
    bar: "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300",
    glow: "shadow-[0_0_10px_rgba(217,157,42,0.45)]",
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
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <bar.icon className={`h-4 w-4 ${accent.icon}`} aria-hidden="true" />
                {bar.label}
              </div>
              <span className="spec-readout text-sm font-semibold text-navy-900">{bar.value}</span>
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
      <p className="text-[11px] leading-relaxed text-slate-400">
        Shown relative to our full fleet range, helicopter to light jet.
      </p>
    </div>
  );
}