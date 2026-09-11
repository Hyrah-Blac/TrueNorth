import type { Metadata } from "next";
import { LegalPageLayout, LegalList, type LegalSection } from "@/components/legal/LegalPageLayout";
import { getSiteSettings } from "@/lib/config/siteSettings";

const LAST_UPDATED = "10 September 2026";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `Which cookies ${settings.companyName}'s website uses, why, and how to control them.`;

  return {
    title: "Cookie Policy",
    description,
    openGraph: { title: `Cookie Policy | ${settings.companyName}`, description },
    twitter: { title: `Cookie Policy | ${settings.companyName}`, description },
    robots: { index: true, follow: true },
  };
}

export default async function CookiePolicyPage() {
  const settings = await getSiteSettings();

  const sections: LegalSection[] = [
    {
      id: "what-are-cookies",
      heading: "What cookies are",
      body: (
        <p>
          Cookies are small text files stored on your device when you visit a website. They let a site remember
          who you are between page loads — for example, keeping you signed in — or protect you against certain
          types of attack.
        </p>
      ),
    },
    {
      id: "what-we-use",
      heading: "What we currently use",
      body: (
        <>
          <p>
            This site uses only <strong className="font-medium text-navy-900">strictly necessary</strong> cookies
            — the kind that don&apos;t require consent under Kenyan and most international cookie regulations,
            because the site simply can&apos;t function properly without them:
          </p>
          <LegalList>
            <li>
              <strong className="font-medium text-navy-900">Authentication &amp; session cookies</strong> — set by
              our sign-in provider, Clerk, to keep you signed in to your account and know which role
              (customer/admin) you have.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Security cookies</strong> — used to protect forms
              against cross-site request forgery (CSRF) and to verify requests come from this site.
            </li>
            <li>
              <strong className="font-medium text-navy-900">Operational cookies</strong> — used to check whether
              the site is in maintenance mode.
            </li>
          </LegalList>
          <p>
            We do not currently use analytics cookies (e.g. Google Analytics), advertising or retargeting
            cookies, or any third-party tracking pixels.
          </p>
          <p>
            The cookies above are <strong className="font-medium text-navy-900">session cookies</strong> — they
            expire automatically when you close your browser or sign out — except for a persistent cookie that
            keeps you signed in between visits if you choose that option, which expires after a limited period of
            inactivity.
          </p>
        </>
      ),
    },
    {
      id: "do-not-track",
      heading: "\u201cDo Not Track\u201d signals",
      body: (
        <p>
          Some browsers send a &ldquo;Do Not Track&rdquo; signal. Since this site doesn&apos;t set analytics or
          advertising cookies to begin with, there&apos;s currently nothing for that signal to switch off — we&apos;ll
          honour it for any tracking cookies we add in the future.
        </p>
      ),
    },
    {
      id: "if-that-changes",
      heading: "If that changes",
      body: (
        <p>
          If we ever add analytics or marketing cookies, we&apos;ll update this policy first and give you a way
          to accept or decline them before they&apos;re set — that&apos;s what the cookie notice on this site is
          there to support going forward, even though today there&apos;s nothing non-essential for you to opt out
          of.
        </p>
      ),
    },
    {
      id: "managing-cookies",
      heading: "Managing cookies in your browser",
      body: (
        <>
          <p>
            Because the cookies we currently set are strictly necessary, blocking them will likely break sign-in
            and secure form submission on this site. If you&apos;d still like to control or clear cookies, most
            browsers let you do this from their settings menu — search your browser&apos;s help pages for
            &ldquo;cookies&rdquo; for exact steps.
          </p>
        </>
      ),
    },
    {
      id: "contact",
      heading: "Questions",
      body: (
        <p>
          If you have questions about this Cookie Policy or how {settings.companyName} handles data more broadly,
          see our{" "}
          <a
            href="/legal/privacy-policy"
            className="text-sky-600 underline underline-offset-2 hover:text-sky-700"
          >
            Privacy Policy
          </a>{" "}
          or contact us using the details below.
        </p>
      ),
    },
  ];

  return (
    <LegalPageLayout
      title="Cookie Policy"
      intro="Which cookies this site uses, why, and how to control them. In short: only the essential ones needed to keep you signed in and your forms secure — no tracking, no ads."
      lastUpdated={LAST_UPDATED}
      sections={sections}
      contactEmail={settings.email}
      contactPhone={settings.phone}
      currentHref="/legal/cookie-policy"
    />
  );
}