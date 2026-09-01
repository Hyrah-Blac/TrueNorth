import type { ReactNode } from "react";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import {
  Skeleton,
  SkeletonStatCard,
  SkeletonDonut,
} from "@/components/shared/skeleton/Skeleton";

/**
 * Mirrors the real Admin Overview layout 1:1 (see page.tsx) so nothing
 * reflows when data arrives. Static chrome that doesn't depend on the
 * fetch — section headings, the "3 Months"/"Operations"/"Monthly" pills,
 * the "Flight summary" label — renders for real; only the fetched numbers,
 * bars, sparklines, donuts and list rows shimmer.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-5">
      {/* ── Top two-column grid ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* LEFT — spans 2 cols */}
        <div className="space-y-5 xl:col-span-2">
          {/* Analytics bar chart */}
          <PremiumCard>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Analytics</h2>
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                style={{ background: "#2d5a3d" }}
              >
                <CalendarBlank className="h-3 w-3" aria-hidden="true" />
                3 Months
              </span>
            </div>
            <div className="mt-4 flex h-40 items-end gap-3">
              {[0.55, 0.85, 0.65].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-md" index={i} style={{ height: `${h * 100}%` }} />
              ))}
            </div>
          </PremiumCard>

          {/* Visitors — 2×2 grid */}
          <PremiumCard>
            <h2 className="text-sm font-semibold text-slate-700">Visitors</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-14" index={i * 3} />
                    <Skeleton className="h-2.5 w-20" index={i * 3 + 1} />
                  </div>
                  <Skeleton className="h-7 w-[72px] rounded" index={i * 3 + 2} />
                </div>
              ))}
            </div>
          </PremiumCard>

          {/* At a glance — donuts */}
          <PremiumCard>
            <h2 className="text-sm font-semibold text-slate-700">At a glance</h2>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <SkeletonDonut />
              <SkeletonDonut />
              <SkeletonDonut />
            </div>
          </PremiumCard>
        </div>

        {/* RIGHT col */}
        <div className="space-y-5">
          {/* This month */}
          <PremiumCard>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">This month</h2>
              <div className="flex items-center gap-1 rounded-full p-0.5" style={{ background: "#f0f4f0" }}>
                <span className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-400">All-In</span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                  style={{ background: "#2d5a3d" }}
                >
                  Operations
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">Flight summary</p>

            <div className="mt-2 grid grid-cols-3 divide-x rounded-xl overflow-hidden" style={{ background: "#f5f7f5" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 px-3 py-3">
                  <Skeleton className="h-4 w-8" index={i * 2} />
                  <Skeleton className="h-2 w-12" index={i * 2 + 1} />
                </div>
              ))}
            </div>

            <div className="mt-4 h-36 w-full overflow-hidden rounded-lg">
              <Skeleton className="h-full w-full" index={0} />
            </div>

            <div className="mt-1 flex items-center justify-center gap-1">
              <span className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-400">Yearly</span>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                style={{ background: "#2d5a3d" }}
              >
                Monthly
              </span>
              <span className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-400">Daily</span>
            </div>
          </PremiumCard>

          {/* Top lists */}
          <PremiumCard>
            <h2 className="text-sm font-semibold text-slate-700">Top lists</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {["Top Flights", "Top Buyer"].map((label, col) => (
                <div key={label}>
                  <p
                    className="text-[11px] font-semibold"
                    style={col === 0 ? { color: "#2d5a3d" } : { color: "rgb(var(--color-slate-400))" }}
                  >
                    {label}
                  </p>
                  <ol className="mt-2.5 space-y-2.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">{i + 1}.</span>
                        <Skeleton className="h-3 w-24" index={col * 3 + i} />
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>
      </div>

      {/* ── Top-line totals ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard withHint />
        <SkeletonStatCard />
      </div>

      {/* ── Quotes ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Quotes</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>

      {/* ── Bookings ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Bookings</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>

      {/* ── Payments ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Payments</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>

      {/* ── Upcoming flights ── */}
      <PremiumCard>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Upcoming flights</h2>
          <span className="text-xs font-medium" style={{ color: "#2d5a3d" }}>
            View all
          </span>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-12" index={i * 6} />
                  <Skeleton className="h-3.5 w-3.5 rounded-full" index={i * 6 + 1} />
                  <Skeleton className="h-3.5 w-12" index={i * 6 + 2} />
                </div>
                <Skeleton className="h-2.5 w-32" index={i * 6 + 3} />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-2.5 w-24" index={i * 6 + 4} />
                <Skeleton className="h-5 w-20 rounded-full" index={i * 6 + 5} />
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* ── Bottom two-col ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Outstanding payments */}
        <PremiumCard>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Outstanding payments</h2>
            <span className="text-xs font-medium" style={{ color: "#2d5a3d" }}>
              View all
            </span>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" index={i * 4} />
                  <Skeleton className="h-2.5 w-32" index={i * 4 + 1} />
                </div>
                <div className="space-y-1.5 text-right">
                  <Skeleton className="ml-auto h-3.5 w-20" index={i * 4 + 2} />
                  <Skeleton className="ml-auto h-5 w-16 rounded-full" index={i * 4 + 3} />
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>

        {/* Recent activity */}
        <PremiumCard>
          <h2 className="text-sm font-semibold text-slate-700">Recent activity</h2>
          <ul className="mt-4 space-y-3.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="px-2 py-1">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-40" index={i * 3} />
                  <Skeleton className="h-2.5 w-10 shrink-0" index={i * 3 + 1} />
                </div>
                <Skeleton className="mt-1.5 h-2.5 w-28" index={i * 3 + 2} />
              </li>
            ))}
          </ul>
        </PremiumCard>
      </div>
    </div>
  );
}

/** Matches the real dashboard card shell exactly: rounded-2xl, hairline
 *  border, soft shadow — so the skeleton's chrome is pixel-identical to
 *  what replaces it. */
function PremiumCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {children}
    </div>
  );
}
