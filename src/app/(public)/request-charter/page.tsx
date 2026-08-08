import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { CharterRequestForm } from "@/components/quote/CharterRequestForm";
import { getAircraftOptions, getAircraftByIdOrSlug } from "@/features/aircraft/lib/getAircraft";
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

  const [aircraftOptions, prefillAircraft] = await Promise.all([
    getAircraftOptions(),
    params.aircraft ? getAircraftByIdOrSlug(params.aircraft) : Promise.resolve(null),
  ]);

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

  return (
    <section className="relative overflow-hidden bg-navy-950 lg:flex lg:min-h-screen lg:items-center lg:py-20">
      {/* Background photo — now spans the whole section at every breakpoint
          (not just a band up top), because the mobile form panel below is
          a frosted-glass surface that needs the photo actually visible
          behind it, not just peeking above it. */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image src="/images/destinations/nairobi.jpg" alt="" fill priority className="object-cover" sizes="100vw" />

        {/* Desktop treatment — darkens the LEFT side only, where the white
            hero text sits, fading to fully transparent by the card's
            column on the right so the photo stays bright and visible
            behind the frosted card instead of being darkened along with
            the text side. */}
        <div className="absolute inset-x-0 top-0 hidden h-40 bg-gradient-to-b from-navy-950/70 to-transparent lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-navy-950/80 via-navy-950/25 to-transparent lg:block" />

        {/* Mobile treatment — just enough to keep the fixed navbar's
            light-colored text legible at the very top. Nothing darkens
            the rest of the photo, since it needs to read clearly through
            the frosted form panel below. */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy-950/70 to-transparent lg:hidden" />
      </div>

      {/* Visually-hidden but still announced/indexed heading for mobile,
          since the decorative text panel carrying the real <h1> is hidden
          below `lg` — keeps the page's heading structure intact for
          screen readers and SEO even though nothing changes visually. */}
      <h1 className="sr-only lg:hidden">
        {prefillAircraft ? `Request the ${prefillAircraft.name}` : "Tell us about your mission"}
      </h1>

      <Container className="relative">
        <div className="grid gap-0 lg:items-center lg:gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="hidden lg:block">
            <h1 className="font-editorial max-w-xl text-[1.75rem] font-light leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {prefillAircraft ? `Request the ${prefillAircraft.name}` : "Tell us about your mission"}
            </h1>
            <div className="mt-6 h-px w-12 bg-white/20" />
            <p className="mt-6 max-w-md text-xs leading-relaxed text-slate-200 sm:text-sm">
              Fill in your route, dates, and requirements. Our operations team typically responds
              with aircraft recommendations and pricing within a few hours.
            </p>
          </div>

          {/* -mx-6 cancels Container's own px-6 gutter below `lg`, so this
              panel runs edge-to-edge and fills the full mobile viewport —
              a dedicated full-screen "sheet" for entering details. It's a
              translucent white surface (bg-white/55, no blur) at every
              breakpoint — enough opacity to keep text and fields clearly
              legible, while still letting the photo tint through rather
              than blocking it outright. The individual input fields keep
              their own solid white background regardless, so legibility
              there isn't affected either way. The fixed navbar sits
              transparently on top of it too, so pt-28 pushes the actual
              visible content (step indicator etc.) down clear of the bar
              instead of starting underneath it. At `lg` it becomes an
              inset rounded card (shadow, ring, corners) sitting beside
              the hero text, instead of the full-bleed mobile sheet. */}
          <div className="-mx-6 lg:mx-0">
            <div className="flex min-h-[100dvh] min-w-0 flex-col justify-start bg-white/55 lg:min-h-0 lg:justify-center lg:overflow-hidden lg:rounded-[28px] lg:shadow-lifted lg:ring-1 lg:ring-black/[0.04]">
              <div className="px-6 pb-8 pt-28 sm:px-7 sm:pb-10 sm:pt-32 lg:p-8">
                <CharterRequestForm aircraftOptions={aircraftOptions} defaultValues={defaultValues} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}