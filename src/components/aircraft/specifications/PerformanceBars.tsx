import { MapPinned, Gauge } from "lucide-react";

interface PerformanceBarsProps {
  rangeNm: number;
  cruisingSpeedKts: number;
}

// Reference ceilings spanning True North's full fleet — from utility
// helicopters to light jets — so a single aircraft's figures read as a
// proportion of what the fleet as a whole is capable of, rather than in
// isolation. Values are display scale only, not a business rule.
const RANGE_SCALE_NM = 2500;
const SPEED_SCALE_KTS = 500;

function toPercent(value: number, scale: number) {
  return Math.min(100, Math.max(4, Math.round((value / scale) * 100)));
}

export function PerformanceBars({ rangeNm, cruisingSpeedKts }: PerformanceBarsProps) {
  const bars = [
    {
      key: "range",
      icon: MapPinned,
      label: "Range",
      value: `${rangeNm.toLocaleString()} nm`,
      percent: toPercent(rangeNm, RANGE_SCALE_NM),
    },
    {
      key: "speed",
      icon: Gauge,
      label: "Cruising Speed",
      value: `${cruisingSpeedKts.toLocaleString()} kts`,
      percent: toPercent(cruisingSpeedKts, SPEED_SCALE_KTS),
    },
  ];

  return (
    <div className="space-y-6">
      {bars.map((bar) => (
        <div key={bar.key}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <bar.icon className="h-4 w-4 text-sky-600" aria-hidden="true" />
              {bar.label}
            </div>
            <span className="spec-readout text-sm font-semibold text-navy-900">{bar.value}</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full origin-left animate-fade-in-editorial rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400"
              style={{ width: `${bar.percent}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-slate-400">
        Shown relative to True North&apos;s full fleet range, helicopter to light jet.
      </p>
    </div>
  );
}
