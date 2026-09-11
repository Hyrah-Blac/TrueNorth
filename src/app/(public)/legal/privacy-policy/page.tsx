import type { Metadata } from "next";
import { LegalPageLayout, LegalList, type LegalSection } from "@/components/legal/LegalPageLayout";
import { getSiteSettings } from "@/lib/config/siteSettings";

const LAST_UPDATED = "10 September 2026";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `How ${settings.companyName} collects, uses, and protects personal data submitted through this site and our charter, booking, and payment services.`;

  return {
    title: "Privacy Policy",
    description,
    openGraph: { title: `Privacy Policy | ${settings.companyName}`, description },
    twitter: { title: `Privacy Policy | ${settings.companyName}`, description },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const address = [settings.addressLine1, settings.addressLine2, settings.city, settings.country]
    .filter(Boolean)
    .join(", ");

  const sections: LegalSection[] = [
    {
      id: "overview",
      heading: "Overview",
      body: (
        <>
          <p>
            This policy explains what personal data {settings.companyName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            &ldquo;our&rdquo;) collects through this website and our charter, booking, and payment services, why we
            collect it, how it&apos;s used, and the choices and rights available to you.
          </p>
          <p>
            We process personal data in line with the Kenya Data Protection Act, 2019 and its associated
            regulations. If you&apos;re located outside Kenya, your local data protection law may give you
            additional rights — the principles below apply regardless.
          </p>
        </>
      ),
    },
    {
      id: "controller",
      heading: "Data controller",
      body: (
        <p>
          The controller of your personal data for the purposes described in this policy is{" "}
          {settings.companyName}, {address || "registered in Kenya"}. For any data protection question or
          request, use the contact details at the bottom of this page.
        </p>
      ),
    },
    {
      id: "data-we-collect",
      heading: "Data we collect",
      body: (
        <>
          <p>We collect personal data directly from you in a small number of places:</p>
          <LegalList>
            <li>
              <strong className="font-medium text-navy-900">Charter requests.</strong> When you submit a charter
              request, we collect your name, email address, phone number, trip details (route, dates, passenger
              count), and any optional details you add (mission type, special requirements).
            </li>
            <li>
              <strong className="font-medium text-navy-900">Account data.</strong> If you create an account to
              track bookings, quotes, or payments, our authentication provider (Clerk) collects your name, email,
              and — if you choose that sign-in method — data from your Google or other identity provider.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Payment data.</strong> Payments are handled by
              Paystack and/or M-Pesa. We receive confirmation of payment status and a reference number — we do
              not receive or store your full card number or M-Pesa PIN; that data is handled entirely by the
              payment processor.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Documents you upload.</strong> If a booking requires
              supporting documents (e.g. passenger identification for medevac or cross-border flights), those
              files are stored with our image/document hosting provider (Cloudinary) and linked to your booking.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Communications.</strong> If you contact us by phone,
              WhatsApp, or email, we keep a record of that conversation to respond to you and to maintain service
              quality.
            </li>
          </LegalList>
        </>
      ),
    },
    {
      id: "how-we-use-it",
      heading: "How we use it",
      body: (
        <>
          <p>We use the data above to:</p>
          <LegalList>
            <li>Respond to charter requests, prepare quotes, and confirm bookings.</li>
            <li>Process payments and issue receipts.</li>
            <li>Verify passenger identity where required for safety, security, or cross-border regulations.</li>
            <li>Send booking-related notifications (confirmations, reminders, cancellations, receipts).</li>
            <li>Maintain the security of accounts and prevent fraudulent use of the site.</li>
            <li>Meet our legal, tax, and aviation-regulatory record-keeping obligations.</li>
          </LegalList>
          <p>
            We do not sell personal data, and we do not use it for third-party advertising. At the time of this
            policy&apos;s last update, this site does not run analytics or advertising cookies/scripts — see our{" "}
            <a href="/legal/cookie-policy" className="text-sky-600 underline underline-offset-2 hover:text-sky-700">
              Cookie Policy
            </a>{" "}
            for the current, definitive list.
          </p>
        </>
      ),
    },
    {
      id: "legal-basis",
      heading: "Legal basis for processing",
      body: (
        <>
          <p>We rely on one of the following grounds each time we process your personal data:</p>
          <LegalList>
            <li>
              <strong className="font-medium text-navy-900">Performance of a contract</strong> — to prepare your
              quote, confirm your booking, and deliver the flight you&apos;ve requested.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Legal obligation</strong> — to meet aviation, tax, and
              financial record-keeping requirements (e.g. passenger manifests).
            </li>
            <li>
              <strong className="font-medium text-navy-900">Legitimate interest</strong> — to keep our systems
              secure, prevent fraud, and improve our service, balanced against your right to privacy.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Consent</strong> — for anything optional, such as
              marketing communications, which you can withdraw at any time.
            </li>
          </LegalList>
        </>
      ),
    },
    {
      id: "sharing",
      heading: "Who we share it with",
      body: (
        <>
          <p>We share personal data only where it&apos;s necessary to deliver the service you&apos;ve requested:</p>
          <LegalList>
            <li>
              <strong className="font-medium text-navy-900">Payment processors</strong> (Paystack, M-Pesa /
              Safaricom) to process your payment.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Our authentication provider</strong> (Clerk) to manage
              account sign-in.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Our hosting and document-storage providers</strong>{" "}
              (e.g. Cloudinary) to store uploaded files and images securely.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Aviation and border authorities</strong> where
              disclosure is legally required for a specific flight (e.g. passenger manifests).
            </li>
            <li>
              <strong className="font-medium text-navy-900">Professional advisers or authorities</strong> where
              required by law, court order, or to protect our legal rights.
            </li>
          </LegalList>
          <p>We do not share personal data with third parties for their own marketing purposes.</p>
        </>
      ),
    },
    {
      id: "international-transfers",
      heading: "International data transfers",
      body: (
        <>
          <p>
            Some of our service providers — our authentication provider (Clerk), payment processor (Paystack), and
            document-hosting provider (Cloudinary) — may store or process data on servers outside Kenya, including
            in the United States, the European Union, and South Africa. Where that happens, we rely on those
            providers&apos; own contractual and technical safeguards (standard contractual clauses or an
            equivalent mechanism) for cross-border data protection, and we only work with providers who commit to
            protecting your data to a standard consistent with the Kenya Data Protection Act, 2019.
          </p>
        </>
      ),
    },
    {
      id: "retention",
      heading: "How long we keep it",
      body: (
        <>
          <p>
            We keep booking, payment, and passenger-manifest records for seven years from the date of the flight,
            in line with Kenyan tax and financial record-keeping requirements, and for a reasonable period
            afterward where needed to resolve an open dispute or regulatory query. Charter requests that
            don&apos;t convert into a booking are kept for twelve months to allow follow-up, then deleted or
            anonymised. Account data is kept for as long as your account stays active, and deleted within 90 days
            of a verified deletion request unless we&apos;re required to keep it longer by law.
          </p>
        </>
      ),
    },
    {
      id: "your-rights",
      heading: "Your rights",
      body: (
        <>
          <p>Under the Kenya Data Protection Act, 2019, you have the right to:</p>
          <LegalList>
            <li>Be informed of how your data is being used (this policy).</li>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate or outdated data.</li>
            <li>Request deletion of data we no longer have a lawful basis to keep.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Request a copy of your data in a portable format.</li>
            <li>Lodge a complaint with the Office of the Data Protection Commissioner (ODPC), Kenya.</li>
          </LegalList>
          <p>
            To exercise any of these rights, contact us using the details at the bottom of this page. We&apos;ll
            respond within the timeframe required by law.
          </p>
        </>
      ),
    },
    {
      id: "security",
      heading: "How we protect your data",
      body: (
        <p>
          We use industry-standard safeguards — encrypted connections (HTTPS), access-controlled admin systems,
          and reputable third-party processors for payments and authentication — to protect personal data against
          unauthorised access, loss, or misuse. No system is completely immune to risk, and we continually review
          our practices as the site evolves.
        </p>
      ),
    },
    {
      id: "children",
      heading: "Children's data",
      body: (
        <p>
          This site is not directed at children. Where a minor is a passenger on a booked flight, we collect the
          minimum data required for safe travel (e.g. name, age) as provided by the booking adult, in line with
          applicable aviation regulations.
        </p>
      ),
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      body: (
        <p>
          We may update this policy as our services change. Material changes will be reflected by an updated
          &ldquo;Last updated&rdquo; date above, and, where appropriate, communicated directly to account holders.
        </p>
      ),
    },
    {
      id: "contact",
      heading: "Contact",
      body: (
        <p>
          {settings.companyName} is based at {address || "our registered office in Kenya"}. For any question
          about this policy or to exercise your data protection rights, use the contact details below.
        </p>
      ),
    },
  ];

  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro="How we collect, use, and protect the personal data you share with us through this site, our charter requests, and our booking and payment process."
      lastUpdated={LAST_UPDATED}
      sections={sections}
      contactEmail={settings.email}
      contactPhone={settings.phone}
      currentHref="/legal/privacy-policy"
    />
  );
}