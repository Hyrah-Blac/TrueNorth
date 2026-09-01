import Link from "next/link";
import { CaretRight, Ticket, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { CustomerPaymentStatusBadge } from "./PaymentCard/CustomerPaymentStatusBadge";
import { PAYMENT_METHOD_META } from "./PaymentCard/paymentMeta";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

/**
 * One row, every breakpoint. Below lg it stacks: identity + amount share a
 * top line (so the number that matters is visible without scrolling), a
 * hairline separates that from a booking · date meta line, then status.
 * At lg+ it becomes a defined 4-column grid — Payment / Meta / Status /
 * Amount — so the list reads as evenly distributed rather than one loose
 * flex block.
 *
 * Only completed payments have a receipt to open, so the row is only a
 * link in that case; everything else renders the same layout inert.
 *
 * Each row is its own rounded, softly-shadowed card — the same
 * rounded-2xl / shadow-sm / hairline-border container used for the admin
 * dashboard's stat cards — rather than a flush divider row, so the
 * customer portal's lists read as consistently "premium" while keeping
 * the portal's own navy/sky palette.
 */
export function PaymentRow({ payment }: { payment: IPayment }) {
  const bookingNumber =
    typeof payment.booking === "object" && payment.booking !== null ? payment.booking.bookingNumber : undefined;
  const method = PAYMENT_METHOD_META[payment.method];
  const isReceiptReady = payment.status === "completed";

  const rowClassName =
    "flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:grid lg:grid-cols-[1fr_1.1fr_170px_140px] lg:items-center lg:gap-6" +
    (isReceiptReady ? " cursor-pointer" : "");
  const rowStyle = { border: "1px solid rgba(0,0,0,0.06)" };

  const amount = (
    <span className="spec-readout text-base font-semibold text-navy-900 sm:text-[15px]">
      {formatCurrency(payment.amount, payment.currency)}
    </span>
  );

  const chevron = isReceiptReady ? (
    <CaretRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
  ) : null;

  const content = (
    <>
      {/* Identity: payment number + method, with the amount pinned alongside
          it on mobile/tablet so the number that matters most never needs
          scrolling to find. At lg+ the amount becomes its own column. */}
      <div className="flex items-start justify-between gap-4 lg:block">
        <div className="min-w-0">
          <p className="spec-readout text-[11px] text-slate-400">{payment.paymentNumber}</p>
          <p className="mt-0.5 truncate font-editorial text-xl font-light text-navy-900">
            {method?.label ?? payment.method}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {amount}
          {chevron}
        </div>
      </div>

      {/* Meta: booking + timestamp on one line, separated by a middot
          rather than a second icon, so the row stays quiet. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-4 text-sm text-slate-500 lg:border-0 lg:pt-0">
        <span className="inline-flex items-center gap-1.5">
          <Ticket className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {bookingNumber ?? "—"}
        </span>
        <span className="text-slate-300" aria-hidden="true">
          &middot;
        </span>
        <span>{formatDateTime(payment.createdAt)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <CustomerPaymentStatusBadge status={payment.status} />
        {payment.status === "failed" && payment.failureReason ? (
          <span
            className="flex items-center gap-1.5 text-xs font-medium text-red-500"
            title={payment.failureReason}
          >
            <WarningCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="max-w-[140px] truncate sm:max-w-[220px]">{payment.failureReason}</span>
          </span>
        ) : null}
      </div>

      <div className="hidden items-center justify-end gap-2 lg:flex">
        {amount}
        {chevron}
      </div>
    </>
  );

  if (isReceiptReady) {
    return (
      <Link href={`/dashboard/payments/${payment._id}`} className={rowClassName} style={rowStyle}>
        {content}
      </Link>
    );
  }

  return (
    <div className={rowClassName} style={rowStyle}>
      {content}
    </div>
  );
}