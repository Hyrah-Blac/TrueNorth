import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container/Container";
import { HorizonDivider } from "@/components/layout/section/Section";

export interface LegalSection {
  /** Anchor id — must be unique within the page. Kebab-case. */
  id: string;
  heading: string;
  body: ReactNode;
}

// The four policy routes, used to build the "Related" list on each page —
// kept in one place so adding a fifth policy later only means editing this
// array plus creating its route.
export const LEGAL_PAGES = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/legal/cookie-policy", label: "Cookie Policy" },
  { href: "/legal/refund-policy", label: "Refund Policy" },
] as const;

/**
 * A quietly-flagged callout for anything in these policies that's a
 * reasonable default rather than a confirmed operational fact (refund
 * windows, a registration number, etc.) — champagne-tinted to match the
 * site's existing accent-highlight language, not a jarring red warning
 * box. Keeps "please confirm this" visible in context instead of buried
 * in a disclaimer no one reads.
 */
export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-champagne-500/30 bg-champagne-500/[0.06] px-4 py-3 text-xs leading-relaxed text-navy-900/80 sm:text-sm">
      {children}
    </div>
  );
}

export function LegalPageLayout({
  eyebrow = "Legal",
  title,
  intro,
  lastUpdated,
  sections,
  contactEmail,
  contactPhone,
  currentHref,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
  contactEmail: string;
  contactPhone: string;
  currentHref: string;
}) {
  return (
    <>
      {/* Photo hero — same photo AND treatment as AboutIntro's white-field
          hero (sept.jpg + a soft white wash), not the dark navy scrim used
          on FleetHero/DestinationsHero. That dark wash was flattening this
          particular photo toward grey; the light wash keeps it bright and
          lets the actual photo read through, which is the "premium" look
          here rather than a moody dark band. Text below is dark
          (navy-900/slate-600) to match, the same as About/Contact — see
          Navbar.tsx's LIGHT_TEXT_ROUTES, which now includes /legal/* so
          the transparent nav uses dark text over this hero too. pt-28/
          lg:pt-32 still clears the fixed nav's height regardless of its
          text color. */}
      <section className="relative overflow-hidden bg-white pb-14 pt-28 lg:pb-16 lg:pt-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Image
            src="/images/gallery/sept.jpg"
            alt=""
            fill
            priority
            quality={90}
            className="object-cover object-center [filter:saturate(1.3)_contrast(1.06)]"
            sizes="100vw"
          />
          {/* Base wash — bumped from 38% to 58%. The AboutIntro photo
              this treatment was modeled on is a calm, evenly-lit
              landscape; this one is a high-contrast jet cabin interior
              (dark table edge, bright leather seats), and 38% wasn't
              enough to keep text legible against it everywhere. */}
          <div className="absolute inset-0 bg-white/58" />
          {/* Top fade — white from the very top so the transparent navbar
              has a clean, legible surface to sit on */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/90 via-white/45 to-transparent sm:h-40" />
          {/* Bottom fade — dissolves into the white content section below,
              so there's no hard edge between hero and content */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent" />
          {/* Text-column wash — a full-height rectangle behind the whole
              left column (title, intro paragraph, "Last updated" line),
              not just a small radial pool near the title. The previous
              radial was centered too high to cover the intro/date lines,
              which is exactly where they were getting lost against the
              table edge in the photo. This covers the full height of
              wherever the text can sit, and fades out by ~70% width so
              the photo still reads clearly on the right. */}
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white/85 via-white/55 to-transparent sm:w-[70%]" />
        </div>
        <Container className="relative">
          <p className="font-body text-[0.6875rem] font-medium uppercase tracking-[0.25em] text-champagne-600">
            {eyebrow}
          </p>
          {/* Heading spec: font-body/font-light/uppercase/tracking-[0.1em]
              language from the Fleet card, sized for a hero role but
              pulled back from an earlier, too-loud pass (was clamping up
              to 3rem) — a premium page title reads as restrained, not
              oversized. */}
          <h1 className="font-body mt-3 max-w-2xl text-balance text-[clamp(1.5rem,1.15rem+1.6vw,2.25rem)] font-light uppercase leading-[1.2] tracking-[0.1em] text-navy-950">
            {title}
          </h1>
          {/* Body spec: quieter again — back near the Fleet card's own
              text-xs, with leading-relaxed for comfort. */}
          <p className="mt-5 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">{intro}</p>
          <p className="mt-6 text-[0.6875rem] uppercase tracking-[0.15em] text-navy-900/40">
            Last updated {lastUpdated}
          </p>
        </Container>
      </section>

      <section className="bg-white py-12 lg:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* In-page nav — pure CSS sticky, no client JS needed. Sits
                above the content on mobile (order handled by DOM order,
                which reads naturally as "here's what's covered" before
                the prose starts). Labels use the same light-caps heading
                spec as the section headings below, just smaller. */}
            <nav aria-label="Sections on this page" className="lg:col-span-3">
              <div className="lg:sticky lg:top-28">
                <p className="font-body text-[0.6875rem] font-light uppercase tracking-[0.1em] text-slate-400">
                  On this page
                </p>
                <ul className="mt-4 space-y-1 border-l border-slate-200">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-xs leading-snug text-slate-600 transition-colors duration-300 ease-out hover:border-sky-500 hover:text-navy-900"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ul>

                <HorizonDivider className="my-8" />

                <p className="font-body text-[0.6875rem] font-light uppercase tracking-[0.1em] text-slate-400">
                  Related
                </p>
                <ul className="mt-4 space-y-2">
                  {LEGAL_PAGES.filter((page) => page.href !== currentHref).map((page) => (
                    <li key={page.href}>
                      <Link
                        href={page.href}
                        className="text-xs text-slate-600 transition-colors duration-300 ease-out hover:text-sky-600"
                      >
                        {page.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="lg:col-span-9 lg:max-w-3xl">
              <div className="space-y-12">
                {sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-28">
                    {/* Same light-caps heading language as the hero h1,
                        scaled down for an in-body h2 — trimmed from an
                        earlier pass that ran a bit large for a page this
                        text-dense. */}
                    <h2 className="font-body text-[clamp(0.9375rem,0.85rem+0.3vw,1.125rem)] font-light uppercase leading-[1.2] tracking-[0.08em] text-navy-950">
                      {section.heading}
                    </h2>
                    {/* Body copy — pulled back to text-xs/sm, a size that
                        reads as refined rather than a dense wall of
                        14–15px paragraphs. */}
                    <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {section.body}
                    </div>
                  </section>
                ))}
              </div>

              <HorizonDivider className="my-12" />

              <div className="rounded-xl bg-slate-50 px-6 py-6 sm:px-8 sm:py-8">
                <p className="font-body text-xs font-light uppercase tracking-[0.1em] text-navy-950">
                  Questions about this policy?
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Reach our team at{" "}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-sky-600 underline underline-offset-2 transition-colors hover:text-sky-700"
                  >
                    {contactEmail}
                  </a>{" "}
                  or call{" "}
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-sky-600 underline underline-offset-2 transition-colors hover:text-sky-700"
                  >
                    {contactPhone}
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Shared list styling for policy body content — bullet accent matches the site's sky accent rather than default browser black dots. */
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-sky-500">{children}</ul>;
}