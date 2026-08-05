export interface TripDraft {
  departureAirportCode?: string;
  departureAirportName?: string;
  destinationAirportCode?: string;
  destinationAirportName?: string;
  passengerCount?: number;
  hasPets?: boolean;
  /** Set only by an explicit click (View Aircraft), never inferred from text. */
  aircraftSlug?: string;
}

const PASSENGER_PATTERN = /\b(\d{1,2})\s*(?:passengers?|pax|people|guests?|travell?ers?)\b/i;
const PETS_PATTERN = /\b(pets?|dogs?|cats?|animals?)\b/i;

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
 * Detects a pet mention via plain keyword match — same non-hallucinating
 * approach as passenger extraction. Deliberately one-directional: once a
 * pet is mentioned it stays true for the conversation (a false "no pets"
 * detection would be far more costly than an unnecessary form checkbox).
 */
export function mentionsPets(text: string): boolean {
  return PETS_PATTERN.test(text);
}

/**
 * Builds a /request-charter URL that merges whatever the concierge
 * conversation already knows (departure, destination, passenger count,
 * pets, preferred aircraft) with an optional specific aircraft —
 * reusing the existing quote page's query-param prefill contract rather
 * than inventing a new one. `source=concierge` is a plain tracking
 * marker (Feature 12 analytics) — it does not affect prefill.
 */
export function buildRequestQuoteHref(draft: TripDraft, aircraftSlug?: string): string {
  const params = new URLSearchParams();
  const resolvedAircraft = aircraftSlug ?? draft.aircraftSlug;
  if (resolvedAircraft) params.set("aircraft", resolvedAircraft);
  if (draft.departureAirportCode) params.set("departure", draft.departureAirportCode);
  if (draft.destinationAirportCode) params.set("destination", draft.destinationAirportCode);
  if (draft.passengerCount) params.set("passengers", String(draft.passengerCount));
  if (draft.hasPets) params.set("pets", "1");
  params.set("source", "concierge");

  return `/request-charter?${params.toString()}`;
}
