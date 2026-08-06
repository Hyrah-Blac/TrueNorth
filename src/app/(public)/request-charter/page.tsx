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
    <section className="relative flex min-h-screen items-center overflow-hidden bg-navy-950 py-28 lg:py-20">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero/true.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-navy-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/40 to-navy-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_55%,rgba(9,21,33,0.45),transparent_70%)]" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-16">
          <div>
            <p className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.5em] text-white/50">
              Charter Request
            </p>
            <h1 className="font-editorial mt-5 max-w-xl text-[1.75rem] font-light leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {prefillAircraft ? `Request the ${prefillAircraft.name}` : "Tell us about your mission"}
            </h1>
            <div className="mt-6 h-px w-12 bg-white/20" />
            <p className="mt-6 max-w-md text-xs leading-relaxed text-slate-200 sm:text-sm">
              Fill in your route, dates, and requirements. Our operations team typically responds
              with aircraft recommendations and pricing within a few hours.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8 lg:p-10">
            <CharterRequestForm aircraftOptions={aircraftOptions} defaultValues={defaultValues} />
          </div>
        </div>
      </Container>
    </section>
  );
}