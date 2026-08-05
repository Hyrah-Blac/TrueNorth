import { SearchX } from "lucide-react";
import { useConcierge } from "../../context/ConciergeContext";
import { buildRequestQuoteHref } from "../../lib/tripDraft";
import { CardActionLink } from "./CardActionLink";

interface EmptyResultCardProps {
  subject: "aircraft" | "airport";
}

const COPY: Record<EmptyResultCardProps["subject"], { heading: string; body: string }> = {
  aircraft: {
    heading: "No exact aircraft match",
    body: "Nothing in the fleet fits those exact requirements, but our operations team regularly finds the right alternative for trips like this.",
  },
  airport: {
    heading: "No airport match nearby",
    body: "We couldn't confirm a suitable airstrip for that. Our operations team can check further options and confirm suitability directly.",
  },
};

export function EmptyResultCard({ subject }: EmptyResultCardProps) {
  const { tripDraft } = useConcierge();
  const { heading, body } = COPY[subject];

  return (
    <div className="w-full max-w-sm rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
          <SearchX className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h4 className="font-display text-sm font-semibold text-navy-900">{heading}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{body}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <CardActionLink href="/contact" variant="outline">
          Contact Us
        </CardActionLink>
        <CardActionLink href={buildRequestQuoteHref(tripDraft)} variant="primary">
          Request Anyway
        </CardActionLink>
      </div>
    </div>
  );
}