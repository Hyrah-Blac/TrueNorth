import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div>
      <ol className="flex items-center gap-1.5 sm:gap-4">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li key={label} className="flex flex-1 items-center gap-1.5 sm:gap-3">
              <span
                className={`spec-readout flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-500 ease-editorial sm:h-10 sm:w-10 sm:text-xs ${
                  isComplete
                    ? "border-sky-500 bg-sky-500 text-white shadow-[0_0_0_4px_rgb(43_91_191_/_0.12)]"
                    : isActive
                      ? "border-sky-500 bg-navy-950 text-white shadow-[0_0_0_4px_rgb(43_91_191_/_0.16)]"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {isComplete ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" /> : stepNumber}
              </span>
              <span
                className={`hidden text-xs font-medium uppercase tracking-wide transition-colors duration-500 sm:block ${
                  isActive ? "text-navy-900" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              {stepNumber < steps.length ? (
                <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full bg-sky-500 transition-all duration-700 ease-editorial ${
                      isComplete ? "w-full" : "w-0"
                    }`}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="spec-readout mt-3 text-[11px] uppercase tracking-wide text-slate-500 sm:hidden">
        Step {currentStep} of {steps.length} — <span className="text-navy-900">{steps[currentStep - 1]}</span>
      </p>
    </div>
  );
}