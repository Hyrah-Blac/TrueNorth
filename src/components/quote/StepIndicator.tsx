import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  // Circles + connectors only — no text labels. This now lives inside a
  // fixed-width (~480px) card rather than a full-width page, and five
  // labels ("Mission & Aircraft", "Requirements", ...) don't fit at that
  // width without forcing the card wider than its column and overflowing
  // the page. Each step already renders its own heading (e.g. "Trip
  // details") immediately below, so the labels were redundant anyway.
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={`spec-readout flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold shadow-sm sm:h-8 sm:w-8 sm:text-xs ${
                isComplete
                  ? "border-sky-500 bg-sky-500 text-navy-950"
                  : isActive
                    ? "border-sky-500 bg-navy-950 text-white shadow-[0_0_0_4px_rgba(14,165,233,0.15)]"
                    : "border-slate-300 bg-white text-slate-500"
              }`}
              aria-label={label}
              title={label}
            >
              {isComplete ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" /> : stepNumber}
            </span>
            {stepNumber < steps.length ? (
              <span className="relative h-px flex-1 overflow-hidden bg-slate-300">
                <span className={`absolute inset-y-0 left-0 bg-sky-500 ${isComplete ? "w-full" : "w-0"}`} />
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}