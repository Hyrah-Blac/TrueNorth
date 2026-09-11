import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalList, type LegalSection } from "@/components/legal/LegalPageLayout";
import { getSiteSettings } from "@/lib/config/siteSettings";

const LAST_UPDATED = "10 September 2026";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `The terms that govern your use of this site and any charter request, booking, or payment made with ${settings.companyName}.`;

  return {
    title: "Terms & Conditions",
    description,
    openGraph: { title: `Terms & Conditions | ${settings.companyName}`, description },
    twitter: { title: `Terms & Conditions | ${settings.companyName}`, description },
    robots: { index: true, follow: true },
  };
}

export default async function TermsAndConditionsPage() {
  const settings = await getSiteSettings();

  const sections: LegalSection[] = [
    {
      id: "acceptance",
      heading: "Acceptance of these terms",
      body: (
        <p>
          By using this website or submitting a charter request, you agree to these Terms &amp; Conditions. If you
          don&apos;t agree, please don&apos;t use the site or submit a request.
        </p>
      ),
    },
    {
      id: "definitions",
      heading: "Definitions",
      body: (
        <>
          <p>A handful of terms recur through these Terms and are worth defining up front:</p>
          <LegalList>
            <li>
              <strong className="font-medium text-navy-900">&ldquo;Carrier&rdquo;</strong> means {settings.companyName}{" "}
              or, where a flight is operated under a wet-lease or partner-operator arrangement, the Kenya Civil
              Aviation Authority (KCAA)–licensed operator actually conducting the flight.
            </li>
            <li>
              <strong className="font-medium text-navy-900">&ldquo;Charterer&rdquo;</strong> means the person or
              organisation submitting the charter request and entering into the booking.
            </li>
            <li>
              <strong className="font-medium text-navy-900">&ldquo;Charter Price&rdquo;</strong> means the total
              amount payable for a Mission as confirmed in your quote, inclusive of the charges and exclusive of
              any additional costs described in{" "}
              <a href="#bookings-payment" className="text-sky-600 underline underline-offset-2 hover:text-sky-700">
                Bookings &amp; payment
              </a>
              .
            </li>
            <li>
              <strong className="font-medium text-navy-900">&ldquo;Mission&rdquo;</strong> means the complete
              flight itinerary agreed in a confirmed booking, including any positioning or ferry sectors needed to
              get the aircraft to your departure point.
            </li>
            <li>
              <strong className="font-medium text-navy-900">&ldquo;Force Majeure Event&rdquo;</strong> has the
              meaning given in{" "}
              <a href="#force-majeure" className="text-sky-600 underline underline-offset-2 hover:text-sky-700">
                Force majeure
              </a>{" "}
              below.
            </li>
          </LegalList>
        </>
      ),
    },
    {
      id: "who-we-are",
      heading: "Who we are",
      body: (
        <p>
          {settings.companyName} operates charter aviation services across Kenya and East Africa, including
          helicopters, turboprops, light jets, and medical evacuation aircraft, dispatched from{" "}
          {settings.addressLine1}, {settings.city}.
        </p>
      ),
    },
    {
      id: "charter-requests",
      heading: "Charter requests & quotes",
      body: (
        <>
          <p>
            Submitting a charter request through this site is not a booking. It&apos;s a request for a quote. Our
            operations team reviews route, aircraft availability, weather, and regulatory factors before issuing a
            firm quote by email or phone.
          </p>
          <LegalList>
            <li>Quoted prices are valid for the period stated in the quote and may change if trip details change.</li>
            <li>A booking is confirmed only once you accept a quote and any required deposit or payment is received.</li>
            <li>Aircraft availability is not guaranteed until a booking is confirmed.</li>
          </LegalList>
        </>
      ),
    },
    {
      id: "bookings-payment",
      heading: "Bookings & payment",
      body: (
        <>
          <p>
            Payments are processed securely through our payment partners (Paystack and M-Pesa). By making a
            payment, you confirm you&apos;re authorised to use the payment method provided.
          </p>
          <LegalList>
            <li>Full or partial payment may be required to confirm a booking, as stated in your quote.</li>
            <li>Prices are quoted in the currency shown at checkout and may be subject to taxes or levies.</li>
            <li>
              Where a Mission requires the aircraft to position from another base, positioning/ferry costs are
              included in your Charter Price. Once crew positioning, ground handling, or other preparatory
              arrangements have been committed on your behalf, those specific costs become non-refundable —
              regardless of the outcome of the Mission — and are treated the same way under our{" "}
              <Link
                href="/legal/refund-policy"
                className="text-sky-600 underline underline-offset-2 hover:text-sky-700"
              >
                Refund Policy
              </Link>
              .
            </li>
            <li>
              Cancellations, refunds, and rescheduling are otherwise governed by our{" "}
              <Link
                href="/legal/refund-policy"
                className="text-sky-600 underline underline-offset-2 hover:text-sky-700"
              >
                Refund Policy
              </Link>
              .
            </li>
          </LegalList>
        </>
      ),
    },
    {
      id: "force-majeure",
      heading: "Force majeure",
      body: (
        <>
          <p>
            Flight safety always takes priority over schedule. Neither party is liable for delay, cancellation, or
            failure to perform caused by a Force Majeure Event — any event beyond that party&apos;s reasonable
            control, including severe weather, air traffic control restrictions, airport or airspace closures,
            government action, strikes or labour disputes, civil unrest, epidemics or pandemics, and aircraft
            unserviceability discovered on inspection.
          </p>
          <p>
            Where a Force Majeure Event prevents a confirmed Mission from going ahead, we&apos;ll work with you on
            the best available option — typically a reschedule — but the standard cancellation tiers in our
            Refund Policy don&apos;t apply, since the interruption isn&apos;t a service failure on our part.
          </p>
        </>
      ),
    },
    {
      id: "aircraft-substitution",
      heading: "Aircraft & crew substitution",
      body: (
        <p>
          Where operationally necessary — for maintenance, crew duty-time limits, or availability — we may
          substitute the aircraft or crew assigned to your Mission with another of a reasonably equivalent type
          and standard, at no additional cost to you. We&apos;ll notify you of a substitution as soon as
          practicable.
        </p>
      ),
    },
    {
      id: "pilot-authority",
      heading: "Pilot-in-command authority",
      body: (
        <p>
          The pilot-in-command has final and binding authority over whether a flight is undertaken, delayed,
          diverted, or abandoned, and over all other operational and safety decisions relating to the Mission.
          This authority exists to keep everyone on board safe and can&apos;t be overridden by a Charterer&apos;s
          schedule or preference.
        </p>
      ),
    },
    {
      id: "passenger-conduct",
      heading: "Passenger conduct & prohibited items",
      body: (
        <>
          <p>
            Passengers must comply with crew instructions at all times for safety reasons. We reserve the right to
            refuse boarding or terminate a flight for passengers who are intoxicated, disruptive, or pose a safety
            risk, without refund.
          </p>
          <p>
            Weapons, hazardous materials, and other dangerous goods may not be carried except where explicitly
            declared, approved, and permitted by applicable aviation regulations.
          </p>
        </>
      ),
    },
    {
      id: "liability",
      heading: "Liability",
      body: (
        <>
          <p>
            Carriage by air is subject to the Montreal Convention 1999 (to which Kenya is a party) for
            international flights, and to Kenyan civil aviation law for domestic flights — both of which govern
            our liability for death, injury, delay, and loss of or damage to baggage, and, in most cases, cap that
            liability at a fixed amount per passenger unless a higher limit applies by law.
          </p>
          <p>
            To the extent permitted by law, we&apos;re not liable for indirect or consequential losses (such as
            missed connections or business losses) arising from delays or cancellations caused by circumstances
            outside our reasonable control, including weather, air traffic control restrictions, and government
            action.
          </p>
          <p>
            We maintain aviation liability insurance in line with Kenyan civil aviation requirements for the
            aircraft we operate.
          </p>
        </>
      ),
    },
    {
      id: "site-use",
      heading: "Use of this website",
      body: (
        <>
          <p>You agree not to:</p>
          <LegalList>
            <li>Use this site for any unlawful purpose or to submit false booking information.</li>
            <li>Attempt to gain unauthorised access to any part of the site, its systems, or other users&apos; accounts.</li>
            <li>Interfere with the site&apos;s normal operation, including through automated scraping or attacks.</li>
          </LegalList>
        </>
      ),
    },
    {
      id: "intellectual-property",
      heading: "Intellectual property",
      body: (
        <p>
          The content on this site — including text, photography, the {settings.companyName} name and logo, and
          site design — belongs to {settings.companyName} or its licensors and may not be reproduced without
          permission, except as necessary to use the site normally (e.g. printing a receipt or ticket).
        </p>
      ),
    },
    {
      id: "third-party-links",
      heading: "Third-party links & services",
      body: (
        <p>
          This site links to and integrates with third-party services (payment processors, account sign-in,
          WhatsApp). We&apos;re not responsible for the content, terms, or privacy practices of those third
          parties — please review their own terms separately.
        </p>
      ),
    },
    {
      id: "governing-law",
      heading: "Governing law",
      body: (
        <p>
          These terms, and any dispute or claim (including non-contractual disputes) arising from them or your use
          of our services, are governed by the laws of Kenya, without prejudice to any mandatory
          consumer-protection rights you may have under the law of your home country.
        </p>
      ),
    },
    {
      id: "dispute-resolution",
      heading: "Dispute resolution",
      body: (
        <>
          <p>
            If a dispute arises, contact us first — most issues are resolved faster through a direct conversation
            with our operations team than through a formal process. If we can&apos;t resolve it directly within 30
            days, either party may refer the dispute to arbitration administered by the Nairobi Centre for
            International Arbitration (NCIA) under its rules, seated in Nairobi, conducted in English, before a
            single arbitrator. The arbitrator&apos;s award is final and binding on both parties.
          </p>
          <p>
            Nothing in this clause stops either party from applying to the courts of Kenya for interim or
            injunctive relief where urgency requires it, or from applying to a court to enforce an arbitral award.
          </p>
        </>
      ),
    },
    {
      id: "entire-agreement",
      heading: "Entire agreement & severability",
      body: (
        <p>
          These Terms, together with your accepted quote and our Privacy, Cookie, and Refund policies, form the
          entire agreement between you and {settings.companyName} for a Mission, superseding any prior
          discussions on the same booking. If any provision of these Terms is found unenforceable by a court, the
          rest of these Terms remain in full effect.
        </p>
      ),
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      body: (
        <p>
          We may update these terms from time to time. Continued use of the site after an update constitutes
          acceptance of the revised terms. Material changes will be reflected by an updated &ldquo;Last
          updated&rdquo; date above.
        </p>
      ),
    },
  ];

  return (
    <LegalPageLayout
      title="Terms & Conditions"
      intro="The terms that govern your use of this website and any charter request, booking, or payment made with us."
      lastUpdated={LAST_UPDATED}
      sections={sections}
      contactEmail={settings.email}
      contactPhone={settings.phone}
      currentHref="/legal/terms-and-conditions"
    />
  );
}