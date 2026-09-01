"use client";

import { useId } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { TooltipProps } from "recharts";
import type { TrendPoint } from "@/features/admin/lib/getAnalytics";
import { formatCurrency } from "@/utils/currency";

// Custom tooltip — small bordered card with a mono/tabular value and a
// colored dot matching the series, instead of recharts' plain default
// box. Shadow here is fine (unlike the flat section cards elsewhere in
// admin): a tooltip is a transient hover popover, expected to sit above
// the content it's annotating.
function ChartTooltip({
  active,
  payload,
  label,
  color,
  formatAsCurrency,
}: TooltipProps<number, string> & { color: string; formatAsCurrency: boolean }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5"
      style={{ boxShadow: "0 12px 28px -10px rgba(15, 23, 42, 0.22)" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="spec-readout mt-1 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
        {formatAsCurrency ? formatCurrency(Number(value)) : value}
      </p>
    </div>
  );
}

export function TrendChart({
  data,
  formatAsCurrency = false,
  color = "rgb(var(--color-sky-500))",
}: {
  data: TrendPoint[];
  /**
   * Server Components can't pass functions to Client Components (only
   * serializable props), so instead of accepting a formatter function
   * this just takes a flag and calls formatCurrency() itself.
   */
  formatAsCurrency?: boolean;
  color?: string;
}) {
  // Unique per mounted chart — two TrendCharts render on the same
  // dashboard page (revenue + customer growth), and a hardcoded gradient
  // id would collide across their <defs>, silently making the second
  // chart pick up the first one's fill.
  const gradientId = `trend-fill-${useId()}`;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="55%" stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--color-slate-100))" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fontSize: 11, fill: "rgb(var(--color-slate-400))", fontFamily: "var(--font-data)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={6}
            width={40}
            tick={{ fontSize: 11, fill: "rgb(var(--color-slate-400))", fontFamily: "var(--font-data)" }}
          />
          <Tooltip
            cursor={{ stroke: "rgb(var(--color-slate-300))", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={<ChartTooltip color={color} formatAsCurrency={formatAsCurrency} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, stroke: "white", strokeWidth: 2, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}