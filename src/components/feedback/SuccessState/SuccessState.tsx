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
    <div className="animate-fade-up-editorial flex flex-col items-center rounded-xl border border-navy-800 bg-navy-950 px-8 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-400">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="spec-readout mt-6 text-xs uppercase tracking-widest2 text-sky-400">Confirmed</p>
      <h2 className="mt-3 font-editorial text-4xl font-light italic text-white">{title}</h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">{description}</p>
      {primaryAction ? (
        <Button href={primaryAction.href} variant="secondary" className="mt-8">
          {primaryAction.label}
        </Button>
      ) : null}
    </div>
  );
}
