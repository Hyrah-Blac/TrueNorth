import type { Metadata } from "next";
import { Section } from "@/components/layout/section/Section";
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
    <>
      <div className="relative overflow-hidden bg-slate-50 py-14 sm:py-20 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_0%,rgba(15,42,67,0.05),transparent)]"
          aria-hidden="true"
        />

        <Container className="relative">
          <h1 className="font-editorial max-w-2xl text-[1.75rem] font-light leading-[1.15] tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
            {prefillAircraft ? `Request the ${prefillAircraft.name}` : "Tell us about your mission"}
          </h1>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-slate-600 sm:mt-5 sm:text-sm">
            Fill in your route, dates, and requirements. Our operations team typically responds
            with aircraft recommendations and pricing within a few hours.
          </p>
        </Container>
      </div>

      <Section tone="white" className="!pt-8 sm:!pt-12">
        <div className="mx-auto max-w-2xl">
          <CharterRequestForm aircraftOptions={aircraftOptions} defaultValues={defaultValues} />
        </div>
      </Section>
    </>
  );
}