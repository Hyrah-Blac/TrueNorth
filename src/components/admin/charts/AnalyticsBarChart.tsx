"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TooltipProps } from "recharts";
import type { MonthlyPoint } from "@/features/admin/lib/getAnalytics";
import { formatCurrency } from "@/utils/currency";

function ChartTooltip({
  active,
  payload,
  label,
  formatAsCurrency,
}: TooltipProps<number, string> & { formatAsCurrency: boolean }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5"
      style={{ boxShadow: "0 12px 28px -10px rgba(15, 23, 42, 0.22)" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="spec-readout mt-1 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "rgb(var(--color-green-600))" }}
          aria-hidden="true"
        />
        {formatAsCurrency ? formatCurrency(Number(value)) : value}
      </p>
    </div>
  );
}

/**
 * Bar chart for the "Analytics" card — every bar is a soft mint, the
 * single highest-value bar is picked out in solid brand green so the
 * standout month reads at a glance, same idea as the reference design's
 * highlighted bar.
 */
export function AnalyticsBarChart({
  data,
  formatAsCurrency = false,
}: {
  data: MonthlyPoint[];
  formatAsCurrency?: boolean;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const peakIndex = data.findIndex((d) => d.value === maxValue && maxValue > 0);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fontSize: 11, fill: "rgb(var(--color-slate-400))", fontFamily: "var(--font-data)" }}
          />
          <Tooltip
            cursor={{ fill: "rgb(var(--color-green-50))" }}
            content={<ChartTooltip formatAsCurrency={formatAsCurrency} />}
          />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={34}>
            {data.map((entry, index) => (
              <Cell
                key={entry.month + index}
                fill={
                  index === peakIndex
                    ? "rgb(var(--color-green-600))"
                    : "rgb(var(--color-green-100))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
