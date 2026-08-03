export interface TripDraft {
  departureAirportCode?: string;
  departureAirportName?: string;
  destinationAirportCode?: string;
  destinationAirportName?: string;
  passengerCount?: number;
}

const PASSENGER_PATTERN = /\b(\d{1,2})\s*(?:passengers?|pax|people|guests?|travell?ers?)\b/i;

/**
 * Extracts a passenger count from the visitor's own message via a plain
 * regex — deliberately not inferred by the model. A number the visitor
 * literally typed can't be a hallucination; anything the model "thought"
 * the count might be could.
 */
export function extractPassengerCount(text: string): number | undefined {
  const match = PASSENGER_PATTERN.exec(text);
  if (!match) return undefined;
  const value = Number(match[1]);
  return value >= 1 && value <= 100 ? value : undefined;
}

/**
 * Builds a /request-charter URL that merges whatever the concierge
 * conversation already knows (departure, destination, passenger count)
 * with an optional specific aircraft — reusing the existing quote page's
 * query-param prefill contract rather than inventing a new one.
 */
export function buildRequestQuoteHref(draft: TripDraft, aircraftSlug?: string): string {
  const params = new URLSearchParams();
  if (aircraftSlug) params.set("aircraft", aircraftSlug);
  if (draft.departureAirportCode) params.set("departure", draft.departureAirportCode);
  if (draft.destinationAirportCode) params.set("destination", draft.destinationAirportCode);
  if (draft.passengerCount) params.set("passengers", String(draft.passengerCount));

  const query = params.toString();
  return query ? `/request-charter?${query}` : "/request-charter";
}
