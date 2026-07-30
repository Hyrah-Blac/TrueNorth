import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";

export function SuccessState({
  title,
  description,
  primaryAction,
}: {
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
}) {
  return (
    <div className="animate-fade-up-editorial relative overflow-hidden rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-soft sm:px-8 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(14,165,233,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 sm:h-16 sm:w-16">
          <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
        </span>
        <p className="spec-readout mt-5 text-xs uppercase tracking-widest2 text-sky-600 sm:mt-6">Confirmed</p>
        <h2 className="mt-3 max-w-md font-editorial text-2xl font-light leading-[1.2] tracking-tight text-navy-900 sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
        {primaryAction ? (
          <Button href={primaryAction.href} variant="primary" className="mt-8">
            {primaryAction.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}