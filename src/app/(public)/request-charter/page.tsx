import type { Metadata } from "next";
import { Section } from "@/components/layout/section/Section";
import { CharterRequestForm } from "@/components/quote/CharterRequestForm";
import { getAircraftOptions, getAircraftByIdOrSlug } from "@/features/aircraft/lib/getAircraft";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";

const description =
  "Tell us your route, dates, and mission and True North's operations team will follow up with aircraft recommendations and pricing.";

export const metadata: Metadata = {
  title: "Request a Charter",
  description,
  openGraph: { title: "Request a Charter | True North Charters", description },
  twitter: { title: "Request a Charter | True North Charters", description },
};

interface RequestCharterPageProps {
  searchParams: Promise<{ aircraft?: string; destination?: string }>;
}

export default async function RequestCharterPage({ searchParams }: RequestCharterPageProps) {
  const params = await searchParams;
  const [aircraftOptions, prefillAircraft] = await Promise.all([
    getAircraftOptions(),
    params.aircraft ? getAircraftByIdOrSlug(params.aircraft) : Promise.resolve(null),
  ]);

  const defaultValues: Partial<CreateQuoteInput> | undefined =
    prefillAircraft || params.destination
      ? {
          ...(prefillAircraft ? { aircraftPreference: prefillAircraft._id } : {}),
          ...(params.destination ? { destinationAirportCode: params.destination.toUpperCase() } : {}),
        }
      : undefined;

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <p className="spec-readout mb-4 text-xs font-medium uppercase tracking-widest2 text-sky-600">
            Charter Request
          </p>
          <h1 className="font-editorial max-w-2xl text-5xl font-light italic tracking-tight text-navy-900 lg:text-6xl">
            {prefillAircraft ? `Request the ${prefillAircraft.name}` : "Tell us about your mission"}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
            Fill in your route, dates, and requirements. Our operations team typically responds
            with aircraft recommendations and pricing within a few hours.
          </p>
        </div>
      </div>

      <Section tone="white" className="!pt-12">
        <div className="mx-auto max-w-2xl">
          <CharterRequestForm aircraftOptions={aircraftOptions} defaultValues={defaultValues} />
        </div>
      </Section>
    </>
  );
}
