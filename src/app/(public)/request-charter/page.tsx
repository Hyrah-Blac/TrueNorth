import type { Metadata } from "next";
import { Container } from "@/components/layout/container/Container";
import { CharterRequestForm } from "@/components/quote/CharterRequestForm";
import { Reveal } from "@/components/shared/Reveal";
import { AboutIntro } from "@/components/about/AboutIntro";
import { getAircraftByIdOrSlug } from "@/features/aircraft/lib/getAircraft";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { recordQuoteStart } from "@/lib/ai/analytics";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `Tell us your route, dates, and mission and ${settings.companyShortName || settings.companyName}'s operations team will follow up with aircraft recommendations and pricing.`;

  return {
    title: "Request a Charter",
    description,
    openGraph: { title: `Request a Charter | ${settings.companyName}`, description },
    twitter: { title: `Request a Charter | ${settings.companyName}`, description },
  };
}

interface RequestCharterPageProps {
  searchParams: Promise<{
    aircraft?: string;
    destination?: string;
    departure?: string;
    passengers?: string;
    pets?: string;
    source?: string;
  }>;
}

export default async function RequestCharterPage({ searchParams }: RequestCharterPageProps) {
  const params = await searchParams;

  // The concierge is currently the only sender of `source=concierge` —
  // this is purely a "did a quote start from the concierge" counter for
  // Feature 12, and never affects rendering or form defaults.
  if (params.source === "concierge") {
    await recordQuoteStart();
  }

  const prefillAircraft = params.aircraft ? await getAircraftByIdOrSlug(params.aircraft) : null;

  const passengerCount = params.passengers ? Number.parseInt(params.passengers, 10) : undefined;

  const defaultValues: Partial<CreateQuoteInput> | undefined =
    prefillAircraft || params.destination || params.departure || passengerCount || params.pets
      ? {
          ...(prefillAircraft ? { aircraftPreference: prefillAircraft._id } : {}),
          ...(params.destination ? { destinationAirportCode: params.destination.toUpperCase() } : {}),
          ...(params.departure ? { departureAirportCode: params.departure.toUpperCase() } : {}),
          ...(passengerCount && passengerCount > 0 && passengerCount <= 100
            ? { passengerCount }
            : {}),
          ...(params.pets === "1" ? { hasPets: true } : {}),
        }
      : undefined;

  const heading = prefillAircraft ? `Request the ${prefillAircraft.name}.` : "Request a quote for your next flight.";

  return (
    <>
      <section className="relative z-10 bg-white pt-32 sm:pt-40 lg:pt-44">
        <Container>
          <Reveal variant="fade-up">
            <div>
              {/*
                This headline deliberately breaks from the site's usual
                font-editorial (which resolves to Poppins, a geometric
                sans) in favor of Fraunces — already loaded globally for
                the dashboard's serif sections, see layout.tsx — to get
                the classic serif look VistaJet's own headline uses.
                Scoped to just this h1 via an arbitrary Tailwind font-
                family value, not a change to font-editorial itself, so
                every other page's headings (Home, Fleet, Destinations,
                About, Contact) are untouched. Stays on one line from sm
                up (matching the reference); below that, nowrap is
                dropped so it wraps onto two lines instead of overflowing
                the viewport — even at the clamp's smallest size, the full
                sentence is wider than the smallest phone screens, and
                nowrap there caused horizontal overflow rather than a
                clean wrap. Sized down from the original 4rem ceiling to
                2.75rem — reads as refined editorial type rather than a
                shouty banner headline, closer in scale to the body copy
                beneath it.
              */}
              <h1
                className="text-[clamp(1.25rem,0.5rem+2.4vw,2.75rem)] font-normal leading-[1.15] tracking-tight text-navy-900 sm:whitespace-nowrap"
                style={{ fontFamily: '"Fraunces", "Iowan Old Style", "Georgia", serif' }}
              >
                {prefillAircraft ? (
                  <>
                    Request the <span className="text-champagne-600">{prefillAircraft.name}</span>.
                  </>
                ) : (
                  heading
                )}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed tracking-wide text-slate-600">
                Every flight is unique and our expert teams work diligently to create the perfect flight that meets
                both your travel requirements and personal preferences every time you fly. To find the most suitable
                flying solution for your next journey, please provide as much information as you can below and we
                will offer a tailored recommendation accompanied by a quotation.
              </p>
            </div>
          </Reveal>

          {/*
            The search bar runs the full Container width, same as the
            heading/paragraph above — in the VistaJet reference the whole
            block (text and bar) shares one wide column, not a narrow
            text column with a wider bar underneath it.
          */}
          <Reveal variant="fade-up" delayMs={120} className="mt-10 sm:mt-14 lg:mt-16">
            <CharterRequestForm defaultValues={defaultValues} />
          </Reveal>
        </Container>
      </section>

      {/*
        Reuses the About page's full-bleed photo hero (AboutIntro) as a
        closing visual right before the footer — but with showText=false,
        since that heading/copy ("Built around the mission...") is
        specific to the About page and doesn't belong here. Just the
        photo + light wash + top/bottom gradient treatment. The section
        above has no bottom padding of its own (see its className) since
        AboutIntro already carries its own top padding — stacking both
        left a large blank gap between the search bar and the photo.
      */}
      <AboutIntro showText={false} />
    </>
  );
}