import type { Metadata } from "next";
import { headers } from "next/headers";
import { SealCheck, SealWarning } from "@phosphor-icons/react/dist/ssr";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { verifyTicket } from "@/features/ticket/lib/verifyTicket";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { checkRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
import { formatDate } from "@/utils/date";

// Ticket verification links are meant to be scanned/opened by whoever
// is checking someone in for a flight, not indexed by search engines.
export const metadata: Metadata = {
  title: "Verify Charter Ticket",
  robots: { index: false, follow: false },
};

interface VerifyTicketPageProps {
  params: Promise<{ token: string }>;
}

async function getCallerIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Public ticket verification page — no sign-in required (this is what
 * the QR code on a printed/digital ticket points to, scanned by
 * whoever is checking someone in). Deliberately shows only enough to
 * prove "this is a valid charter ticket" — see verifyTicket.ts for the
 * exact fields and the reasoning for excluding everything else
 * (Phase 2 requirement #16).
 */
export default async function VerifyTicketPage({ params }: VerifyTicketPageProps) {
  const { token } = await params;

  // IP-keyed rather than user-keyed since this page has no signed-in
  // user — same shape as the public server actions (see
  // features/payment/actions/payment.actions.ts). A 256-bit token
  // isn't practically guessable, but this caps the scan/guess rate
  // anyway as defence-in-depth, consistent with how the authenticated
  // detail pages are rate-limited too.
  const ip = await getCallerIp();
  const rate = checkRateLimit(`ticket:verify:${ip}`, RATE_LIMITS.PUBLIC_READ);

  const result = rate.allowed ? await verifyTicket(token) : null;

  if (!result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-8 py-14 text-center">
          <SealWarning className="h-10 w-10 text-red-600" weight="light" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-navy-900">Invalid Ticket</h1>
          <p className="max-w-sm text-sm text-slate-600">
            This ticket could not be verified. It may be invalid, cancelled, or no longer active.
          </p>
        </div>
      </div>
    );
  }

  // Admin-configured company name (Settings > General) rather than
  // the hardcoded site.ts fallback — only needed on this branch, so
  // it's fetched after the invalid-ticket early return above.
  const settings = await getSiteSettings();
  // City/name is public, non-sensitive information (same as every other
  // route display across the site) — resolving it here just replaces
  // bare codes with the same premium name + code treatment used
  // everywhere else, it doesn't widen what this deliberately-minimal
  // page exposes (see verifyTicket.ts for what's excluded and why).
  const airportNames = await getAirportNamesByCodes([result.departureAirportCode, result.destinationAirportCode]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-champagne-400/30 bg-white shadow-soft">
        <div className="flex flex-col items-center gap-3 bg-navy-950 px-8 py-8 text-center">
          <SealCheck className="h-10 w-10 text-champagne-400" weight="light" aria-hidden="true" />
          <h1 className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-white">
            Valid Charter Ticket
          </h1>
          <p className="text-[0.6875rem] text-white/60">{settings.companyName}</p>
        </div>

        <dl className="divide-y divide-navy-900/10 px-8 py-6">
          <Row label="Ticket" value={result.ticketNumber} />
          <Row label="Booking" value={result.bookingNumber} />
          <Row label="Passenger" value={result.passengerName} />
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Route</dt>
            <dd>
              <RouteDisplay
                size="sm"
                departure={{ code: result.departureAirportCode, name: airportNames[result.departureAirportCode.toUpperCase()] }}
                destination={{ code: result.destinationAirportCode, name: airportNames[result.destinationAirportCode.toUpperCase()] }}
              />
            </dd>
          </div>
          <Row label="Date" value={formatDate(result.departureDate)} />
          <Row label="Passengers" value={String(result.passengerCount)} />
          {result.aircraftName ? (
            <Row
              label="Aircraft"
              value={
                result.aircraftRegistration
                  ? `${result.aircraftName} (${result.aircraftRegistration})`
                  : result.aircraftName
              }
            />
          ) : null}
        </dl>

        <div className="border-t border-navy-900/10 bg-green-50 px-8 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">Paid</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="text-right text-xs font-semibold text-navy-900 sm:text-sm">{value}</dd>
    </div>
  );
}
