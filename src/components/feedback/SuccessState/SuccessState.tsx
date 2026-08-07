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
    <div className="flex flex-col items-center px-2 py-6 text-center sm:py-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-900 sm:h-12 sm:w-12">
        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </span>
      <p className="spec-readout mt-4 text-[0.6875rem] uppercase tracking-widest2 text-navy-900">Confirmed</p>
      <h2 className="mt-2.5 max-w-sm font-editorial text-lg font-light leading-[1.3] tracking-tight text-navy-900 sm:text-xl">
        {title}
      </h2>
      <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem]">{description}</p>
      {primaryAction ? (
        <Button href={primaryAction.href} variant="primary" size="sm" className="mt-6">
          {primaryAction.label}
        </Button>
      ) : null}
    </div>
  );
}