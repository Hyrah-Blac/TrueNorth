import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { PaymentStatusBadge } from "@/components/payment/PaymentCard/PaymentStatusBadge";
import { PAYMENT_METHOD_META } from "@/components/payment/PaymentCard/paymentMeta";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

// Divided list row, same shape as the customer-side QuoteRow
// (dashboard/quotes/page.tsx) — no card border, a soft hover wash, and an
// absolutely-positioned caret so it doesn't consume layout space.
export function AdminPaymentRow({ payment }: { payment: IPayment }) {
  const customer = typeof payment.customer === "object" && payment.customer !== null ? payment.customer : null;
  const booking = typeof payment.booking === "object" && payment.booking !== null ? payment.booking : null;
  const aircraftName = booking && typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
  const method = PAYMENT_METHOD_META?.[payment.method];

  return (
    <Link
      href={`/admin/payments/${payment._id}`}
      className="group relative -mx-3 flex flex-col gap-3 rounded-lg px-3 py-5 pr-8 transition-colors hover:bg-sky-500/[0.035] sm:flex-row sm:items-center sm:justify-between sm:pr-9"
    >
      <div className="min-w-0">
        <p className="spec-readout text-[11px] text-slate-400">{payment.paymentNumber}</p>
        <p className="mt-0.5 truncate font-editorial text-xl font-light text-navy-900">
          {method?.label ?? payment.method}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {customer ? (
            <span className="font-medium text-slate-600">
              {customer.firstName ?? ""} {customer.lastName ?? ""}
            </span>
          ) : null}
          {booking ? (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="spec-readout">{booking.bookingNumber}</span>
            </>
          ) : null}
          {aircraftName ? (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span>{aircraftName}</span>
            </>
          ) : null}
        </div>
        <p className="mt-0.5 spec-readout text-[10px] text-slate-400">{formatDateTime(payment.createdAt)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="spec-readout text-sm font-semibold text-navy-900">
            {formatCurrency(payment.amount, payment.currency)}
          </p>
          {payment.mpesa?.mpesaReceiptNumber ? (
            <p className="spec-readout text-[10px] text-slate-400">{payment.mpesa.mpesaReceiptNumber}</p>
          ) : payment.paystack?.reference ? (
            <p className="spec-readout text-[10px] text-slate-400">{payment.paystack.reference}</p>
          ) : null}
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <CaretRight
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-sky-500 sm:right-1.5"
        aria-hidden="true"
      />
    </Link>
  );
}