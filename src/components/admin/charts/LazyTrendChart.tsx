"use client";

import dynamic from "next/dynamic";

const TrendChart = dynamic(() => import("./TrendChart").then((mod) => mod.TrendChart), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-lg bg-slate-100" />,
});

export { TrendChart as LazyTrendChart };
