"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { MonthlyPoint } from "@/features/admin/lib/getAnalytics";
import { formatCurrency } from "@/utils/currency";

export function TrendChart({
  data,
  formatAsCurrency = false,
  color = "rgb(var(--color-sky-500))",
}: {
  data: MonthlyPoint[];
  /**
   * Server Components can't pass functions to Client Components (only
   * serializable props), so instead of accepting a formatter function
   * this just takes a flag and calls formatCurrency() itself.
   */
  formatAsCurrency?: boolean;
  color?: string;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-slate-200))" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "rgb(var(--color-slate-400))" }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "rgb(var(--color-slate-400))" }} width={40} />
          <Tooltip
            formatter={(value: number) => (formatAsCurrency ? formatCurrency(value) : value)}
            contentStyle={{
              borderRadius: 6,
              borderColor: "rgb(var(--color-slate-200))",
              fontSize: 12,
              fontFamily: "var(--font-body)",
              boxShadow: "var(--shadow-soft)",
            }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#trendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}