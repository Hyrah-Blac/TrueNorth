"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/layout/container/Container";
import { TripSearchBar, type TripSearchBarValues } from "@/components/quote/TripSearchBar";

// Same sessionStorage draft shape/key CharterRequestForm restores from on
// mount (see charterRequestDraft:v1 there) — writing to it here means the
// homepage bar and the /request-charter page's own search bar are really
// the same "step 1", just entered from two different places. No new
// prefill plumbing needed on the request-charter route itself.
const DRAFT_STORAGE_KEY = "charterRequestDraft:v1";

const DEFAULT_VALUES: TripSearchBarValues = {
  departureAirportCode: "",
  destinationAirportCode: "",
  departureDate: "",
  returnDate: undefined,
  isRoundTrip: false,
  departureTimePreference: undefined,
  passengerCount: 1,
};

/**
 * "PLAN A FLIGHT" banner — modeled on VistaJet's homepage charter-request
 * opener: a short eyebrow + line of copy, then the From/To/Date/Passengers
 * bar as the sole call to action. This is deliberately just step 1 of the
 * request flow (trip details, no contact fields) — submitting hands off
 * to /request-charter, which is where CharterRequestForm's step 2
 * (contact info) lives.
 */
export function PlanAFlightBanner() {
  const router = useRouter();
  const [values, setValues] = useState<TripSearchBarValues>(DEFAULT_VALUES);
  const [isNavigating, setIsNavigating] = useState(false);

  function handleChange<K extends keyof TripSearchBarValues>(field: K, value: TripSearchBarValues[K]) {
    // Mirrors CharterRequestForm's handling of the same field: an empty
    // string return date (e.g. round-trip toggled back off) should read
    // as "not set", not as a literal empty-string date.
    const nextValue = field === "returnDate" && value === "" ? undefined : value;
    setValues((current) => ({ ...current, [field]: nextValue }) as TripSearchBarValues);
  }

  function handleSubmit() {
    setIsNavigating(true);
    try {
      // Clicking this arrow only happens once TripSearchBar's own
      // isReady check has passed (From/To/Date are all filled in — see
      // TripSearchBar's disabled state), so trip details are already
      // complete. The draft hands off straight to step 2 (contact info)
      // rather than step 1, so /request-charter opens directly on the
      // next thing the customer actually needs to fill in instead of
      // re-showing the same search bar they just submitted.
      window.sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ step: 2, trip: values, contact: {} }),
      );
    } catch {
      // Private browsing / storage quota — worst case the customer just
      // re-enters trip details on the next page instead of them carrying
      // over, which is fine.
    }
    router.push("/request-charter");
  }

  return (
    <Container className="pb-0 pt-6 sm:pt-8 lg:pt-10">
      <p className="font-body text-xl font-light uppercase tracking-[0.28em] text-navy-950 sm:text-2xl">Plan a Flight</p>

      <p className="mt-4 max-w-3xl font-body text-xs leading-relaxed text-navy-950/70 sm:text-sm">
        Give us your route, travel dates, and passenger count. Our operations team will match you with
        the right aircraft for the mission and return pricing and availability within hours.
      </p>

      <div className="mt-6 sm:mt-8">
        <TripSearchBar values={values} onChange={handleChange} onSubmit={handleSubmit} isSubmitting={isNavigating} />
      </div>
    </Container>
  );
}