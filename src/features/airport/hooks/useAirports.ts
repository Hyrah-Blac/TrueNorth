"use client";

import { useEffect, useState } from "react";
import type { IAirport } from "@/types/airport";

/**
 * Shape the airport pickers (AirportCombobox, admin base-airport select,
 * review-step label lookup) actually need. Kept separate from IAirport so
 * those components don't have to know about Mongo ids, runway details, etc.
 */
export interface AirportOption {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface AirportsApiResponse {
  success: boolean;
  data?: { items: IAirport[]; meta?: { hasNextPage: boolean } };
  error?: string;
}

function toAirportOption(airport: IAirport): AirportOption | null {
  // The public-facing "code" is whichever short code the airport is known
  // by day-to-day. Most fields in Kenya's charter network are IATA-coded
  // (WIL, NBO, MRE...); fall back to ICAO for the rare airport that only
  // has one, and skip anything with neither since it can't be selected.
  const code = airport.iata || airport.icao;
  if (!code) return null;
  return { code, name: airport.name, city: airport.city, country: airport.country };
}

// Fetched once per page load and shared by every AirportCombobox/select on
// the page, rather than each instance (departure + destination airport,
// admin base-airport dropdown, etc) firing its own request.
let cachedRequest: Promise<AirportOption[]> | null = null;

const PAGE_SIZE = 100; // matches the API's MAX_PAGE_SIZE cap

async function fetchAirportsPage(page: number): Promise<AirportsApiResponse> {
  const res = await fetch(`/api/airports?limit=${PAGE_SIZE}&status=active&page=${page}`);
  const json: AirportsApiResponse = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error ?? "Could not load airports");
  }
  return json;
}

function loadAirports(): Promise<AirportOption[]> {
  if (!cachedRequest) {
    cachedRequest = (async () => {
      // The API caps `limit` at 100 (MAX_PAGE_SIZE), but the Airport
      // collection has grown past that — walk every page rather than
      // assuming page 1 is the whole list, or later pages of active
      // airports silently disappear from every picker on the site.
      const allItems: IAirport[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const json = await fetchAirportsPage(page);
        allItems.push(...json.data!.items);
        hasNextPage = json.data!.meta?.hasNextPage ?? false;
        page += 1;
      }

      return allItems
        .map(toAirportOption)
        .filter((airport): airport is AirportOption => airport !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
    })().catch((error) => {
      // Don't poison the cache with a failed request — the next mount
      // (or a retry) should be able to try again instead of being stuck.
      cachedRequest = null;
      throw error;
    });
  }
  return cachedRequest;
}

export interface UseAirportsResult {
  airports: AirportOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads the active airport list from the database (via /api/airports) for
 * use in search/select UI. Replaces the old static `@/content/airports`
 * list so departure/destination/base-airport pickers stay in sync with
 * whatever admins add, edit, or retire in the Airport collection.
 */
export function useAirports(): UseAirportsResult {
  const [airports, setAirports] = useState<AirportOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadAirports()
      .then((items) => {
        if (!cancelled) setAirports(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load airports");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { airports, isLoading, error };
}