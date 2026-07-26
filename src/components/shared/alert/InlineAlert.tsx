import { AlertCircle, CheckCircle2, Info, Smartphone, MinusCircle } from "lucide-react";
import type { ReactNode } from "react";

type AlertTone = "success" | "error" | "danger" | "info" | "pending" | "neutral";

const toneStyles: Record<AlertTone, { wrap: string; icon: string }> = {
  success: { wrap: "bg-green-50 text-green-700", icon: "text-green-600" },
  error: { wrap: "bg-red-50 text-red-700", icon: "text-red-600" },
  // "danger" is used interchangeably with "error" by callers (e.g. a
  // rejected quote reads more naturally as "danger" than "error") —
  // same visual treatment, just a friendlier name at the call site.
  danger: { wrap: "bg-red-50 text-red-700", icon: "text-red-600" },
  info: { wrap: "bg-sky-100/60 text-sky-700", icon: "text-sky-600" },
  pending: { wrap: "bg-gold-200/60 text-gold-600", icon: "text-gold-600" },
  neutral: { wrap: "bg-slate-100 text-slate-600", icon: "text-slate-500" },
};

const toneIcon: Record<AlertTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  danger: AlertCircle,
  info: Info,
  pending: Smartphone,
  neutral: MinusCircle,
};

/**
 * Shared notification banner used across dashboard forms and action
 * panels (profile save, booking actions, M-Pesa status, receipts) so
 * every inline notification in the customer portal looks and behaves
 * the same way.
 */
export function InlineAlert({
  tone,
  children,
  role,
}: {
  tone: AlertTone;
  children: ReactNode;
  role?: "alert" | "status";
}) {
  const styles = toneStyles[tone];
  const Icon = toneIcon[tone];

  return (
    <div
      role={role ?? (tone === "error" || tone === "danger" ? "alert" : "status")}
      className={`flex items-start gap-2.5 rounded-md px-4 py-3.5 text-sm leading-relaxed ${styles.wrap}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}