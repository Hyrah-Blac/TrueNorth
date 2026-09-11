import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalList, type LegalSection } from "@/components/legal/LegalPageLayout";
import { getSiteSettings } from "@/lib/config/siteSettings";

const LAST_UPDATED = "10 September 2026";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `${settings.companyName}'s cancellation and refund terms for charter bookings and deposits.`;

  return {
    title: "Refund Policy",
    description,
    openGraph: { title: `Refund Policy | ${settings.companyName}`, description },
    twitter: { title: `Refund Policy | ${settings.companyName}`, description },
    robots: { index: true, follow: true },
  };
}

export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();

  const sections: LegalSection[] = [
    {
      id: "overview",
      heading: "Overview",
      body: (
        <>
          <p>
            This policy explains how cancellations, refunds, and rescheduling work for charter bookings made with{" "}
            {settings.companyName}. It applies alongside our{" "}
            <Link
              href="/legal/terms-and-conditions"
              className="text-sky-600 underline underline-offset-2 hover:text-sky-700"
            >
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      id: "customer-cancellations",
      heading: "If you cancel a confirmed booking",
      body: (
        <>
          <p>Refunds on a customer-initiated cancellation depend on how far ahead of departure you cancel:</p>
          <LegalList>
            <li>
              <strong className="font-medium text-navy-900">More than 72 hours before departure</strong> — full
              refund of amounts paid, less any non-refundable third-party costs already committed (e.g. permits,
              landing fees).
            </li>
            <li>
              <strong className="font-medium text-navy-900">24–72 hours before departure</strong> — 50% refund of
              amounts paid.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Less than 24 hours before departure, or a no-show</strong>{" "}
              — non-refundable, as the aircraft and crew are already committed and can&apos;t be reassigned in
              time.
            </li>
          </LegalList>
          <p>
            Deposits paid to hold a specific aircraft for a bespoke or multi-leg itinerary may carry different
            terms, which will be stated in your individual quote.
          </p>
          <p>
            Regardless of which tier applies, any positioning/ferry flight, crew accommodation, or ground-handling
            cost already committed on your behalf before you cancel is non-refundable — this mirrors the{" "}
            <Link
              href="/legal/terms-and-conditions#bookings-payment"
              className="text-sky-600 underline underline-offset-2 hover:text-sky-700"
            >
              Bookings &amp; payment
            </Link>{" "}
            terms in our Terms &amp; Conditions.
          </p>
        </>
      ),
    },
    {
      id: "our-cancellations",
      heading: "If we cancel or substantially change your flight",
      body: (
        <>
          <p>
            If we cancel or substantially change a confirmed booking for operational reasons within our control,
            you&apos;re entitled to a full refund or a free reschedule to the next available slot, your choice.
          </p>
          <p>
            If a flight is delayed, rerouted, or cancelled for reasons outside our control — weather, air traffic
            control, government restrictions, or other safety-related grounds — we&apos;ll work with you on the
            best available option (reschedule where possible), but this policy&apos;s standard refund tiers above
            don&apos;t apply, since the interruption isn&apos;t a service failure on our part.
          </p>
        </>
      ),
    },
    {
      id: "how-refunds-are-paid",
      heading: "How refunds are paid",
      body: (
        <>
          <p>
            Approved refunds are returned to the original payment method used at booking — via Paystack for card
            payments, or M-Pesa for mobile-money payments. Processing typically takes{" "}
            <span className="whitespace-nowrap">5–10 business days</span> once approved, depending on your bank
            or mobile money provider.
          </p>
        </>
      ),
    },
    {
      id: "medical-emergency",
      heading: "Medical evacuation & emergency bookings",
      body: (
        <p>
          Standard cancellation windows may not be practical for time-critical medevac bookings. Where a medevac
          flight is stood down before departure, our operations team will assess the situation individually and
          apply a fair outcome based on aircraft and crew commitments already made.
        </p>
      ),
    },
    {
      id: "how-to-request",
      heading: "How to request a cancellation or refund",
      body: (
        <>
          <p>To cancel a booking or request a refund:</p>
          <LegalList>
            <li>
              Call us on <a href={`tel:${settings.phone}`} className="text-sky-600 underline underline-offset-2 hover:text-sky-700">{settings.phone}</a>{" "}
              (fastest option, available {settings.operatingHours.toLowerCase()}), or
            </li>
            <li>
              Email <a href={`mailto:${settings.email}`} className="text-sky-600 underline underline-offset-2 hover:text-sky-700">{settings.email}</a>{" "}
              with your booking reference, or
            </li>
            <li>If you have an account, request cancellation directly from your booking in the dashboard.</li>
          </LegalList>
          <p>We&apos;ll confirm your cancellation and any applicable refund amount in writing.</p>
        </>
      ),
    },
  ];

  return (
    <LegalPageLayout
      title="Refund Policy"
      intro="Our cancellation and refund terms for charter bookings — what you get back, when, and how to request it."
      lastUpdated={LAST_UPDATED}
      sections={sections}
      contactEmail={settings.email}
      contactPhone={settings.phone}
      currentHref="/legal/refund-policy"
    />
  );
}