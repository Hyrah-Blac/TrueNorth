"use client";

import { useState, useTransition } from "react";
import { LazyTrendChart as TrendChart } from "@/components/admin/charts/LazyTrendChart";
import type { TrendPoint } from "@/features/admin/lib/getAnalytics";

type Range = "yearly" | "monthly" | "daily";

const RANGE_ORDER: Range[] = ["yearly", "monthly", "daily"];
const RANGE_LABELS: Record<Range, string> = {
  yearly: "Yearly",
  monthly: "Monthly",
  daily: "Daily",
};

export function FlightSummaryCard({
  confirmed,
  outstanding,
  upcoming,
  initialMonthlyData,
}: {
  confirmed: number;
  outstanding: number;
  upcoming: number;
  /** Pre-fetched on the server so Monthly (the default view) renders instantly. */
  initialMonthlyData: TrendPoint[];
}) {
  const [range, setRange] = useState<Range>("monthly");
  const [dataByRange, setDataByRange] = useState<Partial<Record<Range, TrendPoint[]>>>({
    monthly: initialMonthlyData,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const data = dataByRange[range];

  function handleRangeChange(next: Range) {
    setRange(next);
    setError(null);
    if (dataByRange[next]) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/analytics/revenue-trend?range=${next}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to load");
        setDataByRange((prev) => ({ ...prev, [next]: json.data as TrendPoint[] }));
      } catch {
        setError("Couldn't load that range. Try again.");
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">This month</h2>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
          style={{ background: "#2d5a3d" }}
        >
          Operations
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500">Flight summary</p>

      <div
        className="mt-2 grid grid-cols-3 divide-x rounded-xl overflow-hidden"
        style={{ background: "#f5f7f5" }}
      >
        <MiniStat value={String(confirmed)} label="Confirmed" />
        <MiniStat value={String(outstanding)} label="Outstanding" />
        <MiniStat value={String(upcoming)} label="Upcoming" />
      </div>

      <div className="relative mt-4 h-36 w-full overflow-hidden">
        {data ? (
          <TrendChart data={data} formatAsCurrency color="#2d5a3d" />
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="text-[11px] font-medium text-slate-400">Loading…</span>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-center text-[11px] text-red-500">{error}</p>}

      <div className="mt-1 flex items-center justify-center gap-1">
        {RANGE_ORDER.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRangeChange(r)}
            aria-pressed={range === r}
            className="rounded-full px-3 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed"
            style={
              range === r
                ? { background: "#2d5a3d", color: "white" }
                : { color: "rgb(148 163 184)" }
            }
            disabled={isPending && range === r}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-base font-bold text-slate-800">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
