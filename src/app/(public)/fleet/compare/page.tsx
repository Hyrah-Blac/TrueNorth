"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Scales, Stack } from "@phosphor-icons/react";
import { Container } from "@/components/layout/container/Container";
import { Skeleton } from "@/components/shared/skeleton/Skeleton";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { Button } from "@/components/shared/buttons/Button";
import { CompareTable } from "@/components/aircraft/compare/CompareTable";
import { useCompareList } from "@/hooks/useCompareList";
import type { IAircraft } from "@/types/aircraft";
import type { AirportNameInfo } from "@/lib/api/airportNames";

interface ApiResponse {
  success: boolean;
  data?: IAircraft;
  error?: string;
}

interface AirportsLookupResponse {
  success: boolean;
  data?: Record<string, AirportNameInfo>;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const { remove: removeFromTray } = useCompareList();
  const slugs = (searchParams.get("slugs") ?? "").split(",").filter(Boolean);

  const [aircraft, setAircraft] = useState<IAircraft[]>([]);
  const [airportNames, setAirportNames] = useState<Record<string, AirportNameInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const results = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const res = await fetch(`/api/aircraft/${slug}`);
            const json: ApiResponse = await res.json();
            return json.success && json.data ? json.data : null;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;

      const loaded = results.filter((item): item is IAircraft => item !== null);
      setAircraft(loaded);
      setLoading(false);

      // One batched lookup for every base airport across the compared
      // aircraft — same "City (CODE)" resolution used everywhere else
      // on the site, just fetched client-side since this page already
      // fetches its aircraft data client-side.
      const codes = Array.from(new Set(loaded.map((a) => a.baseAirportCode).filter(Boolean)));
      if (codes.length > 0) {
        try {
          const res = await fetch(`/api/airports?codes=${encodeURIComponent(codes.join(","))}`);
          const json: AirportsLookupResponse = await res.json();
          if (!cancelled && json.success && json.data) {
            setAirportNames(json.data);
          }
        } catch {
          // Non-fatal — CompareTable/DetailRow falls back to the raw
          // code, same convention as every other airport display.
        }
      }
    }

    if (slugs.length > 0) {
      load();
    } else {
      setAircraft([]);
      setAirportNames({});
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function handleRemove(slug: string) {
    removeFromTray(slug);
    setAircraft((prev) => prev.filter((item) => item.slug !== slug));
  }

  return (
    <div className="border-t border-slate-200 bg-slate-50 py-14 lg:py-16">
      <Container>
        <Link
          href="/fleet"
          className="inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-slate-400 transition-colors duration-300 hover:text-navy-900"
        >
          <ArrowLeft className="h-3 w-3" weight="thin" aria-hidden="true" />
          Back to fleet
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-white">
            <Scales className="h-4 w-4" weight="thin" aria-hidden="true" />
          </span>
          <h1 className="font-display text-xl font-semibold text-navy-900 sm:text-2xl">Compare aircraft</h1>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {slugs.map((slug) => (
                <div key={slug} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              ))}
            </div>
          ) : aircraft.length < 2 ? (
            <EmptyState
              icon={<Stack className="h-5 w-5" weight="thin" aria-hidden="true" />}
              title="Add at least two aircraft to compare"
              description="Browse the fleet and use the compare toggle on any aircraft card to build a side-by-side comparison."
              action={
                <Button href="/fleet" variant="outline">
                  Browse the Fleet
                </Button>
              }
            />
          ) : (
            <CompareTable aircraft={aircraft} airportNames={airportNames} onRemove={handleRemove} />
          )}
        </div>
      </Container>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareContent />
    </Suspense>
  );
}