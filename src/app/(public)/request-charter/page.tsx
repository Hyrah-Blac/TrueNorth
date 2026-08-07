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
      {/* Full photo background + gradients — desktop/tablet only. On phones
          we skip the hero entirely so the very first thing a customer sees
          is the form itself, not a photo they have to scroll past. */}
      <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
        <Image src="/images/destinations/nairobi.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-navy-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/40 to-navy-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_55%,rgba(9,21,33,0.45),transparent_70%)]" />
      </div>

      {/* Mobile-only: the same hero photo, muted and faded to white at the
          bottom — a subtle nod to the desktop hero rather than a flat
          color block. The navbar (fixed, transparent on this route) sits
          on the dark top edge, then the band fades to solid white right
          where the form begins, so the two blend into one continuous
          surface instead of a hard seam. */}
      <div className="relative h-40 lg:hidden" aria-hidden="true">
        <Image src="/images/destinations/nairobi.jpg" alt="" fill priority className="object-cover opacity-50" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/75 via-navy-950/25 to-white" />
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
              a dedicated full-screen "sheet" for entering details, rather
              than a small floating card. Height is 100dvh minus the h-40
              muted-photo band above it, so together they fill exactly one
              screen with no forced scrolling to reach the form. Content is
              top-aligned (not centered) below `lg` — centering it inside a
              near-full-screen-height box left a large dead gap above the
              step indicator and pushed it up against the photo band. At
              `lg` it reverts to a normal inset card sitting beside the
              hero text, vertically centered as before. */}
          <div className="-mx-6 lg:mx-0">
            <div className="flex min-h-[calc(100dvh-10rem)] min-w-0 flex-col justify-start overflow-hidden bg-gradient-to-b from-white via-white to-slate-50/95 lg:min-h-0 lg:justify-center lg:rounded-[28px] lg:shadow-lifted lg:ring-1 lg:ring-black/[0.04]">
              <div className="px-6 py-8 sm:px-7 sm:py-10 lg:p-8">
                <CharterRequestForm aircraftOptions={aircraftOptions} defaultValues={defaultValues} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}