import { PlaneLanding } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";

export function NotFound({
  title = "We couldn't find that page",
  description = "It may have been moved or is no longer available.",
  actionLabel = "Back to Fleet",
  actionHref = "/fleet",
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <PlaneLanding className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="font-display text-xl font-semibold text-navy-900">{title}</h1>
      <p className="max-w-sm text-xs leading-relaxed text-slate-600">{description}</p>
      <Button href={actionHref} variant="outline" size="sm" className="mt-2">
        {actionLabel}
      </Button>
    </div>
  );
}