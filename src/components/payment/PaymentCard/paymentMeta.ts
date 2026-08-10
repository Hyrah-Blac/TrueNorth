import { Smartphone, Landmark, Banknote, type LucideIcon } from "lucide-react";
import type { PaymentMethod, PaymentStatus } from "@/database/constants/payment-status";

/**
 * Presentation-only metadata for payment methods/statuses, shared between
 * PaymentsTable (desktop) and PaymentCard (mobile) so the two views stay
 * visually consistent. No domain logic lives here — labels/colors only.
 */
export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; icon: LucideIcon }> = {
  mpesa: { label: "M-Pesa", icon: Smartphone },
  bank_transfer: { label: "Bank transfer", icon: Landmark },
  cash: { label: "Cash", icon: Banknote },
};

/** Thin left-edge accent color per status — a quiet "boarding pass stub" cue. */
export const PAYMENT_STATUS_ACCENT: Record<PaymentStatus, string> = {
  pending: "bg-slate-300",
  processing: "bg-sky-400",
  completed: "bg-green-500",
  failed: "bg-red-400",
  refunded: "bg-champagne-500",
};
